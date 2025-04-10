'use client';

import React, { useState } from 'react'; // Import useState
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UpvoteButton } from "./UpvoteButton"
import { Tag } from "@/generated/prisma"; // Import Tag enum
import { formatDistanceToNow } from 'date-fns'; // For relative timestamps
import { cn } from "@/lib/utils"; // Import cn utility
import { useUser } from '@clerk/nextjs'; // <-- Import useUser
import { Button } from '@/components/ui/button'; // <-- Import Button
import { Trash2 } from 'lucide-react'; // <-- Import Trash icon
// Remove useSWRConfig import if not needed elsewhere (keeping UpvoteButton might need it? Check UpvoteButton later if needed)
// import { useSWRConfig } from 'swr'; 

// Import the server action
import { deleteEntryAction } from '@/app/actions'; // Adjusted path

// Define the shape of the entry data we expect
// Matches the data structure returned by our GET /api/entries endpoint
interface FeedItemProps {
  entry: {
    id: string;
    title: string;
    description: string;
    tag: Tag;
    createdAt: string; // Prisma returns ISO string date
    author: {
      id: string;
      username: string; // Add username field
    };
    _count: {
      upvotes: number;
    };
  };
}

// Helper function to get color based on tag
const getTagBorderColor = (tag: Tag): string => {
    switch (tag) {
        case Tag.PROGRAM:
            return 'border-l-[#39FF14]'; // Neon Green
        case Tag.EVENT:
            return 'border-l-[#FF10F0]'; // Neon Pink
        case Tag.TIPS_AND_TRICKS:
            // Using a slightly less intense blue for better readability maybe?
            // Let's try the requested one first. 
            return 'border-l-[#1F51FF]'; // Neon Blue (User Request)
            // Alternative: return 'border-l-blue-500'; 
        default:
            return 'border-l-border'; // Default border color from theme
    }
};

// Helper function to get color based on tag
export function FeedItem({ entry }: FeedItemProps) {
    const { user } = useUser(); // <-- Get user data from Clerk
    console.log('FeedItem - User Object:', user); // <-- ADD THIS LINE
    // Remove mutate from useSWRConfig if SWR isn't used for feed invalidation here anymore
    // const { mutate } = useSWRConfig(); 
    const [isDeleting, setIsDeleting] = useState(false); // <-- State for loading
    const [deleteError, setDeleteError] = useState<string | null>(null); // <-- State for error

    const timeAgo = formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true });
    const borderColorClass = getTagBorderColor(entry.tag);

    // <-- Check if the user is an admin
    const isAdmin = user?.publicMetadata?.role === 'ADMIN';

    // Updated handleDelete function to use the server action
    const handleDelete = async () => {
        if (!isAdmin) return; // Extra safety check

        setIsDeleting(true);
        setDeleteError(null);

        try {
            // Call the server action
            const result = await deleteEntryAction(entry.id);

            if (!result.success) {
                throw new Error(result.error || 'Failed to delete entry');
            }

            console.log(`Entry ${entry.id} deleted successfully via action.`);
            // No need for manual mutation, revalidatePath handles it

        } catch (error: unknown) {
            console.error("Deletion failed:", error);
            // Check if error is an instance of Error to safely access message
            let errorMessage = 'An unknown error occurred during deletion.';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            setDeleteError(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card className={cn(
            "w-full max-w-2xl mx-auto overflow-hidden bg-background/60 backdrop-blur-md border border-white/10 border-l-4 shadow-lg transition-all duration-300 hover:bg-background/70",
            borderColorClass
        )}>
            <CardHeader>
                <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl font-bold text-primary">{entry.title}</CardTitle>
                    <Badge variant="outline" className="backdrop-blur-sm bg-secondary/30">{entry.tag}</Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                    Posted by {entry.author.username} {timeAgo}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm whitespace-pre-wrap text-foreground/90">{entry.description}</p> {/* Preserve whitespace */} 
            </CardContent>
            <CardFooter className="flex justify-end items-center gap-2 bg-background/40 backdrop-blur-sm"> {/* <-- Added items-center and gap */}
                 {/* <-- Conditionally render Delete Button --> */}
                {isAdmin && (
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        aria-label="Delete entry"
                        className="bg-red-500/70 hover:bg-red-600/90 backdrop-blur-sm"
                    >
                        {isDeleting ? (
                           <span className="loading loading-spinner loading-xs"></span> // Simple spinner
                        ) : (
                           <Trash2 className="h-4 w-4" />
                        )}
                    </Button>
                )}
                <UpvoteButton entryId={entry.id} initialCount={entry._count.upvotes} />
            </CardFooter>
             {/* Display error message */} 
            {deleteError && (
                <CardFooter className="text-red-500 text-xs justify-end">
                    {deleteError}
                </CardFooter>
            )}
        </Card>
    );
} 