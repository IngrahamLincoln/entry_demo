import { NextResponse } from 'next/server';
import { PrismaClient, Tag } from '@/generated/prisma'; // Use alias
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// GET /api/entries - Fetch all entries
export async function GET(_request: Request) {
    // TODO: Add sorting logic based on request.url query params (?sort=new or ?sort=top)
    try {
        const entries = await prisma.entry.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                author: {
                    select: { id: true }, // Select specific fields if needed
                },
                _count: { // Include the count of upvotes
                    select: { upvotes: true },
                },
            },
        });
        return NextResponse.json(entries);
    } catch (error) {
        console.error("Failed to fetch entries:", error);
        return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }
}

// POST /api/entries - Create a new entry
export async function POST(request: Request) {
    const { userId } = await auth(); // Re-add await
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, description, tag } = body;

        // Basic validation (consider Zod for robust validation later)
        if (!title || !description || !tag || !Object.values(Tag).includes(tag)) {
            return NextResponse.json({ error: 'Missing required fields or invalid tag' }, { status: 400 });
        }

        // --- User Sync --- 
        // Ensure the user exists in our database before creating an entry
        await prisma.user.upsert({
            where: { id: userId },
            update: {}, // No update needed if user exists
            create: { id: userId }, // Create user if they don't exist
        });
        // --- End User Sync --- 

        const newEntry = await prisma.entry.create({
            data: {
                title,
                description,
                tag,
                authorId: userId,
            },
        });

        return NextResponse.json(newEntry, { status: 201 });
    } catch (error) {
        console.error("Failed to create entry:", error);
        // Handle potential Prisma errors (e.g., validation)
        if (error instanceof Error && 'code' in error && error.code === 'P2002') { // Example: Unique constraint failed (less likely here)
             return NextResponse.json({ error: 'Database error occurred' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
    }
} 