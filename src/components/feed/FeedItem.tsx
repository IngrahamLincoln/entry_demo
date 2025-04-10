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
import { useSWRConfig } from 'swr'; // <-- Import useSWRConfig

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
    const { mutate } = useSWRConfig(); // <-- Get SWR mutate function
    const [isDeleting, setIsDeleting] = useState(false); // <-- State for loading
    const [deleteError, setDeleteError] = useState<string | null>(null); // <-- State for error

    const timeAgo = formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true });
    const borderColorClass = getTagBorderColor(entry.tag);

    // <-- Check if the user is an admin
    const isAdmin = user?.publicMetadata?.role === 'ADMIN';

    // <-- Handle delete function
    const handleDelete = async () => {
        if (!isAdmin) return; // Extra safety check

        setIsDeleting(true);
        setDeleteError(null);

        try {
            const response = await fetch(`/api/entries/${entry.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to delete entry: ${response.statusText}`);
            }

            console.log(`Entry ${entry.id} deleted successfully.`);
            // Refresh the feed data by revalidating the key used by the main feed fetch
            // Adjust '/api/entries' if your feed fetching hook uses a different key
            mutate('/api/entries');
             // Optional: Revalidate sorted feeds if they use different keys
            mutate('/api/entries?sort=new'); 
            mutate('/api/entries?sort=top');

        } catch (error: any) {
            console.error("Deletion failed:", error);
            setDeleteError(error.message || 'An unknown error occurred during deletion.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card className={cn(
            "w-full max-w-2xl mx-auto overflow-hidden bg-card/80 backdrop-blur-sm border border-border/50 border-l-4",
            borderColorClass
        )}>
            <CardHeader>
                <div className="flex justify-between items-start mb-2">
                    <CardTitle>{entry.title}</CardTitle>
                    <Badge variant="outline">{entry.tag}</Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                    Posted by {entry.author.username} {timeAgo}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm whitespace-pre-wrap">{entry.description}</p> {/* Preserve whitespace */} 
            </CardContent>
            <CardFooter className="flex justify-end items-center gap-2"> {/* <-- Added items-center and gap */}
                 {/* <-- Conditionally render Delete Button --> */}
                {isAdmin && (
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        aria-label="Delete entry"
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