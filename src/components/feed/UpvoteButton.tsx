'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react'; // Using lucide icons

interface UpvoteButtonProps {
  initialCount: number;
  entryId: string;
  // Add a prop to indicate if the current user has upvoted (for styling)
  // currentUserHasUpvoted: boolean; // We'll add this logic later
}

export function UpvoteButton({ initialCount, entryId }: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  // TODO: Add state for optimistic updates and better error handling later

  const handleUpvote = async () => {
    if (isLoading) return; // Prevent multiple clicks while loading
    setIsLoading(true);
    console.log(`Toggling upvote for entry: ${entryId}`);

    try {
      const response = await fetch(`/api/entries/${entryId}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // No body needed for this specific toggle endpoint
      });

      if (!response.ok) {
        // Handle non-2xx responses
        const errorData = await response.json();
        console.error('Failed to upvote:', response.status, errorData.error);
        // Optional: Show error message to user
        // Revert optimistic update if implemented
      } else {
        const data = await response.json();
        console.log('Upvote response:', data); // Log response message and count
        setCount(data.upvoteCount); // Update count from server response
        // TODO: Update parent component/feed state if necessary
      }
    } catch (error) {
      console.error('Error during upvote request:', error);
      // Optional: Show error message to user
      // Revert optimistic update if implemented
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleUpvote}
      disabled={isLoading} // Disable button while loading
    >
      <ThumbsUp className="mr-2 h-4 w-4" />
      {count}
    </Button>
  );
} 