'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useUser } from '@clerk/nextjs';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
}

interface CommentListProps {
  entryId: string;
}

export function CommentList({ entryId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/comments?entryId=${entryId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching comments: ${response.status}`);
        }
        
        const data = await response.json();
        setComments(data);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
        setError('Failed to load comments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [entryId]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-2">Loading comments...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500 py-2">{error}</div>;
  }

  if (comments.length === 0) {
    return null; // Don't show anything if there are no comments
  }

  return (
    <div className="space-y-3 mt-4">
      <h4 className="text-sm font-medium">Comments</h4>
      {comments.map((comment) => (
        <Card key={comment.id} className="bg-background/40 backdrop-blur-sm border border-white/10">
          <CardContent className="p-3">
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          </CardContent>
          <CardFooter className="px-3 py-1 text-xs text-muted-foreground flex justify-between">
            <span>
              {comment.authorId === user?.id ? 'You' : 'Anonymous'}
            </span>
            <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 