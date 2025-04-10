import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// POST /api/entries/[entryId]/upvote - Toggle upvote for an entry
export async function POST(
    request: Request,
    { params }: { params: { entryId: string } }
) {
    const { userId } = await auth();
    const entryId = params.entryId;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!entryId) {
        return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 });
    }

    try {
        // --- User Sync (Optional but good practice) ---
        // Ensure the user exists in our database before upvoting
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: { id: userId },
        });
        // --- End User Sync ---

        // Check if the upvote already exists
        const existingUpvote = await prisma.upvote.findUnique({
            where: {
                userId_entryId: { // Use the composite key defined in the schema
                    userId: userId,
                    entryId: entryId,
                },
            },
        });

        if (existingUpvote) {
            // If exists, delete it (unvote)
            await prisma.upvote.delete({
                where: {
                    userId_entryId: {
                        userId: userId,
                        entryId: entryId,
                    },
                },
            });
            // Optionally, return the new count after deletion
            const count = await prisma.upvote.count({ where: { entryId } });
            return NextResponse.json({ message: 'Upvote removed', upvoteCount: count });
        } else {
            // If not exists, create it (upvote)
            await prisma.upvote.create({
                data: {
                    userId: userId,
                    entryId: entryId,
                },
            });
            // Optionally, return the new count after creation
            const count = await prisma.upvote.count({ where: { entryId } });
            return NextResponse.json({ message: 'Upvote added', upvoteCount: count }, { status: 201 });
        }
    } catch (error) {
        console.error("Failed to toggle upvote:", error);
         // Check if the error is because the entry doesn't exist (foreign key constraint)
        if (error instanceof Error && 'code' in error && error.code === 'P2003') { 
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to toggle upvote' }, { status: 500 });
    }
} 