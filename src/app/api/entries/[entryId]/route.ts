import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

interface RouteParams {
    params: {
        entryId: string;
    };
}

// DELETE /api/entries/[entryId]
export async function DELETE(request: Request, { params }: RouteParams) {
    const { userId } = await auth();
    const { entryId } = params;

    // 1. Check if user is logged in
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check if the logged-in user is the Admin
    if (userId !== process.env.ADMIN_USER_ID) {
        console.warn(`User ${userId} attempted to delete entry ${entryId} without admin privileges.`);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. If admin, attempt to delete the entry
    try {
        await prisma.entry.delete({
            where: { id: entryId },
        });
        console.log(`Admin user ${userId} deleted entry ${entryId}`);
        return NextResponse.json({ message: 'Entry deleted successfully' }, { status: 200 });
    } catch (error: any) {
        // Handle cases where the entry might not be found (Prisma throws an error)
        // P2025: Record to delete does not exist.
        if (error.code === 'P2025') {
            console.error(`Admin user ${userId} failed to delete non-existent entry ${entryId}`);
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }
        // Handle other potential errors
        console.error(`Failed to delete entry ${entryId} by admin ${userId}:`, error);
        return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }
} 