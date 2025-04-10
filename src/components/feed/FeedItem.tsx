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
      <CardFooter className="flex justify-end">
        <UpvoteButton entryId={entry.id} initialCount={entry._count.upvotes} />
      </CardFooter>
    </Card>
  );
} 