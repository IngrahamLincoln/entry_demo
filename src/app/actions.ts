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
    console.log("[Server Action] deleteEntryAction: Started");
    const { userId } = await auth();

    console.log(`[Server Action] deleteEntryAction: Received entryId: ${entryId}, userId: ${userId}`);

    if (!userId) {
        console.warn("[Server Action] deleteEntryAction: Unauthorized - No userId found.");
        return { success: false, error: 'Unauthorized' };
    }

    if (!entryId) {
        console.warn("[Server Action] deleteEntryAction: Missing entry ID.");
        return { success: false, error: 'Missing entry ID' };
    }

    try {
        console.log(`[Server Action] deleteEntryAction: Checking admin status for userId: ${userId}`);
        // 1. Check if the user is an admin
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        console.log(`[Server Action] deleteEntryAction: User query result:`, user);

        if (!user || user.role !== Role.ADMIN) {
            console.warn(`[Server Action] deleteEntryAction: Forbidden - User ${userId} is not an admin. User role: ${user?.role}`);
            return { success: false, error: 'Forbidden' };
        }

        console.log(`[Server Action] deleteEntryAction: Admin user ${userId} attempting to delete entry ${entryId}`);
        // 2. If user is admin, proceed with deletion
        await prisma.entry.delete({
            where: { id: entryId },
        });

        console.log(`[Server Action] deleteEntryAction: Successfully deleted entry ${entryId} by admin ${userId}`);

        // 3. Revalidate the path to refresh data on the page
        revalidatePath('/');

        return { success: true, message: 'Entry deleted successfully' };

    } catch (error: unknown) {
        // Log the specific Prisma error code if available
        let errorCode: string | undefined;
        let errorMessage: string = 'Unknown error';
        if (typeof error === 'object' && error !== null) {
             if ('code' in error) {
                 errorCode = (error as { code: string }).code;
             }
             if (error instanceof Error) {
                errorMessage = error.message;
             }
             // Log the full error object for more details
             console.error(`[Server Action] deleteEntryAction: Error deleting entry ${entryId} by admin ${userId}. ErrorCode: ${errorCode}, Message: ${errorMessage}`, error);
        } else {
             console.error(`[Server Action] deleteEntryAction: Unknown error type deleting entry ${entryId} by admin ${userId}:`, error);
        }


        if (errorCode === 'P2025') { // Prisma error code for record not found
             return { success: false, error: 'Entry not found' };
        }

        // Include more error detail in the returned object if possible
        return { success: false, error: `Failed to delete entry: ${errorMessage}` };
    }
} 