'use client';

import { useState } from 'react';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { cn } from '@/lib/utils';

interface CommentsProps {
  entryId: string;
  className?: string;
}

export function Comments({ entryId, className }: CommentsProps) {
  const [refreshKey, setRefreshKey] = useState(Date.now());

  const handleCommentAdded = () => {
    // Force refresh of comments list when a new comment is added
    setRefreshKey(Date.now());
  };

  return (
    <div className={cn("pt-2 border-t border-white/10", className)}>
      <CommentList key={refreshKey} entryId={entryId} />
      <CommentForm entryId={entryId} onCommentAdded={handleCommentAdded} />
    </div>
  );
} 