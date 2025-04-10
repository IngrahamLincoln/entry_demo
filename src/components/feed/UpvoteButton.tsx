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
  // Add state for loading/optimistic updates later

  const handleUpvote = async () => {
    console.log(`Upvoting entry: ${entryId}`);
    // TODO: Implement API call and state updates in Phase 4
    // For now, maybe just increment locally for visual feedback
    setCount(count + 1); // Temporary local update
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleUpvote}>
      <ThumbsUp className="mr-2 h-4 w-4" />
      {count}
    </Button>
  );
} 