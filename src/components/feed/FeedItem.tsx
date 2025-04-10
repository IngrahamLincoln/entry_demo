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
import { useUser } from "@clerk/nextjs"; // Import useUser
import { useSWRConfig } from 'swr'; // Import useSWRConfig
import { Button } from "@/components/ui/button"; // Import Button if not already there
import { Trash2 } from 'lucide-react'; // Icon for delete button

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
  const timeAgo = formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true });
  const borderColorClass = getTagBorderColor(entry.tag);
  const { user } = useUser(); // Get current user
  const { mutate } = useSWRConfig(); // Get SWR mutate function

  // Check if the current user is the admin
  const isAdmin = user?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  // Function to handle delete action
  const handleDelete = async () => {
    if (!isAdmin) return; // Extra check

    // Optional: Add a confirmation dialog
    // if (!confirm("Are you sure you want to delete this entry?")) {
    //   return;
    // }

    try {
      const response = await fetch(`/api/entries/${entry.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete entry');
      }

      // Revalidate the feed data after successful deletion
      // This will find all SWR keys starting with '/api/entries' and revalidate them
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/entries'), undefined, { revalidate: true });
      // Optional: Show a success toast message here
      console.log(`Entry ${entry.id} deleted successfully.`);

    } catch (error) {
      console.error("Delete failed:", error);
      // Optional: Show an error toast message here
      alert(`Error deleting entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      <CardFooter className="flex justify-end items-center space-x-2"> {/* Adjust layout */} 
        {/* Conditionally render Delete Button for Admin */}
        {isAdmin && (
          <Button 
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            aria-label="Delete entry"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <UpvoteButton entryId={entry.id} initialCount={entry._count.upvotes} />
      </CardFooter>
    </Card>
  );
} 