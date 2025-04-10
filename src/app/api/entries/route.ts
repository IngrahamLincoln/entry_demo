import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Tag } from '@/generated/prisma'; // Use alias
import { auth, clerkClient } from '@clerk/nextjs/server'; // Import clerkClient and auth
import { User } from '@clerk/backend'; // Keep User type import

const prisma = new PrismaClient();

// GET /api/entries - Fetch all entries
export async function GET(request: NextRequest) {
    // TODO: Add sorting logic based on request.url query params (?sort=new or ?sort=top)
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort') || 'new'; // Default to 'new'

    let orderByClause: any = { createdAt: 'desc' }; // Default sorting

    if (sort === 'top') {
        orderByClause = { 
            upvotes: { 
                _count: 'desc' 
            } 
        }; // Sort by upvote count
    } 
    // No need for explicit 'new' case, it's the default

    try {
        const entriesFromDb = await prisma.entry.findMany({
            orderBy: orderByClause, // Use the dynamic orderBy clause
            include: {
                author: {
                    select: { id: true }, // Still just need the ID from DB
                },
                _count: { // Include the count of upvotes
                    select: { upvotes: true },
                },
            },
        });

        // --- Fetch Usernames from Clerk --- 
        const authorIds = [...new Set(entriesFromDb.map(entry => entry.author.id))]; // Get unique author IDs
        if (authorIds.length > 0) {
            // Use clerkClient() pattern - await it first!
            const client = await clerkClient(); // Await the client first
            const clerkUsersResponse = await client.users.getUserList({ userId: authorIds }); // Then call getUserList
            
            // Access the user array from the .data property
            const userMap = new Map(clerkUsersResponse.data.map((user: User) => [
                user.id,
                user.username || `User ${user.id.substring(5, 9)}` // Fallback if username is null
            ]));

            // Add username to each entry
            const entriesWithUsernames = entriesFromDb.map(entry => ({
                ...entry,
                author: {
                    ...entry.author,
                    username: userMap.get(entry.author.id) || 'Unknown User' // Add username, with fallback
                }
            }));
            return NextResponse.json(entriesWithUsernames);

        } else {
             // No entries found, return empty array
            return NextResponse.json([]);
        }
        // --- End Fetch Usernames ---
        
    } catch (error) {
        console.error("Failed to fetch entries or user data:", error);
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