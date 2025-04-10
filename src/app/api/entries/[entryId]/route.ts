import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Role } from '@/generated/prisma'; // Import Role enum
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// Define the context type explicitly
type DeleteContext = {
    params: {
        entryId: string;
    };
};

// DELETE /api/entries/[entryId] - Delete an entry (Admin only)
export async function DELETE(
    request: NextRequest,
    context: DeleteContext // Use the explicit type
) {
    const { userId } = await auth();
    const { entryId } = context.params; // Access via context.params

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!entryId) {
        return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 });
    }

    try {
        // 1. Check if the user is an admin
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }, // Only select the role field
        });

        // User might not be in DB if they haven't created/upvoted yet
        // Or if they exist but aren't an admin
        if (!user || user.role !== Role.ADMIN) {
            console.warn(`User ${userId} attempted unauthorized delete on entry ${entryId}. User role: ${user?.role}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. If user is admin, proceed with deletion
        await prisma.entry.delete({
            where: { id: entryId },
        });

        console.log(`Admin user ${userId} deleted entry ${entryId}`);
        return NextResponse.json({ message: 'Entry deleted successfully' }, { status: 200 });

    } catch (error: unknown) {
        // Need to check if error is an object with a 'code' property
        let errorCode: string | undefined;
        if (typeof error === 'object' && error !== null && 'code' in error) {
            errorCode = (error as { code: string }).code;
        }

        console.error(`Failed to delete entry ${entryId} by admin ${userId}:`, error);

        // Handle case where the entry doesn't exist (Prisma P2025)
        if (errorCode === 'P2025') {
             return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }

        return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }
} 