import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// Remove RouteContext interface if it's no longer needed elsewhere
// interface RouteContext {
//   params: {
//     entryId: string;
//   };
// }

// POST /api/entries/[entryId]/upvote - Toggle upvote for an entry
export async function POST(
    request: NextRequest,
    { params }: { params: { entryId: string } } // Keep destructuring, remove explicit context type, let TS infer
) {
    // const { params } = context; // Remove this if using direct destructuring in signature
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
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: { id: userId },
        });
        // --- End User Sync ---

        const existingUpvote = await prisma.upvote.findUnique({
            where: {
                userId_entryId: { // Use the composite key defined in the schema
                    userId: userId,
                    entryId: entryId,
                },
            },
        });
        
        let upvoteCount; // Declare outside the blocks to return it consistently

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
            upvoteCount = await prisma.upvote.count({ where: { entryId } });
            return NextResponse.json({ message: 'Upvote removed', upvoteCount: upvoteCount });
        } else {
            // If not exists, create it (upvote)
            await prisma.upvote.create({
                data: {
                    userId: userId,
                    entryId: entryId,
                },
            });
            upvoteCount = await prisma.upvote.count({ where: { entryId } });
            return NextResponse.json({ message: 'Upvote added', upvoteCount: upvoteCount }, { status: 201 });
        }
    } catch (error) {
        console.error("Failed to toggle upvote:", error);
        if (error instanceof Error && 'code' in error && error.code === 'P2003') { 
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to toggle upvote' }, { status: 500 });
    } finally {
        // Optional: Disconnect Prisma client
        // await prisma.$disconnect();
    }
} 