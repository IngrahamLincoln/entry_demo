'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquarePlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';

// Create a schema for the comment form
const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1200, 'Comment must be less than 200 words'),
});

type CommentFormValues = z.infer<typeof commentSchema>;

interface CommentFormProps {
  entryId: string;
  onCommentAdded: () => void;
}

export function CommentForm({ entryId, onCommentAdded }: CommentFormProps) {
  const { isSignedIn } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: '',
    },
  });

  const onSubmit = async (data: CommentFormValues) => {
    if (!isSignedIn) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId,
          content: data.content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post comment');
      }

      // Reset the form
      form.reset();
      
      // Notify parent component to refresh comments
      onCommentAdded();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="text-sm text-muted-foreground mt-4">
        Sign in to leave a comment.
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-2">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Add a comment... (200 words max)"
                  className="bg-background/40 backdrop-blur-sm border border-white/10 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="sm" 
            className="bg-secondary/70 backdrop-blur-sm" 
            disabled={isSubmitting}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Posting...' : 'Comment'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 