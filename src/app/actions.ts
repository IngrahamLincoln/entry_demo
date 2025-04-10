"use server";

import { PrismaClient, Role } from '@/generated/prisma';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// Define a return type for better feedback
type ActionResult = {
    success: boolean;
    message?: string;
    error?: string;
};

export async function deleteEntryAction(entryId: string): Promise<ActionResult> {
    const { userId } = await auth();

    if (!userId) {
        return { success: false, error: 'Unauthorized' };
    }

    if (!entryId) {
        return { success: false, error: 'Missing entry ID' };
    }

    try {
        // 1. Check if the user is an admin
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user || user.role !== Role.ADMIN) {
            console.warn(`User ${userId} attempted unauthorized delete action on entry ${entryId}. User role: ${user?.role}`);
            return { success: false, error: 'Forbidden' };
        }

        // 2. If user is admin, proceed with deletion
        await prisma.entry.delete({
            where: { id: entryId },
        });

        console.log(`Admin user ${userId} deleted entry ${entryId} via server action`);

        // 3. Revalidate the path to refresh data on the page
        revalidatePath('/');

        return { success: true, message: 'Entry deleted successfully' };

    } catch (error: unknown) {
        let errorCode: string | undefined;
        if (typeof error === 'object' && error !== null && 'code' in error) {
            errorCode = (error as { code: string }).code;
        }

        console.error(`Failed to delete entry ${entryId} by admin ${userId} via server action:`, error);

        if (errorCode === 'P2025') { // Prisma error code for record not found
             return { success: false, error: 'Entry not found' };
        }

        return { success: false, error: 'Failed to delete entry' };
    }
} 