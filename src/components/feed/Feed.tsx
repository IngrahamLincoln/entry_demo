'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { FeedItem } from './FeedItem';
import { Tag } from "@/generated/prisma"; 
import { Button } from "@/components/ui/button";

// Define the structure of the data expected from the API
// This should match the structure defined in FeedItemProps
interface ApiEntry {
    id: string;
    title: string;
    description: string;
    tag: Tag;
    createdAt: string; 
    author: {
      id: string;
      username: string;
    };
    _count: {
      upvotes: number;
    };
}

// Define the fetcher function for useSWR
const fetcher = async (url: string): Promise<ApiEntry[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorInfo = await response.json().catch(() => ({})); // Try to get error details
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorInfo.error || 'Failed to fetch'}`);
  }
  return response.json();
};

export function Feed() {
  const [sortOrder, setSortOrder] = useState<'new' | 'top'>('new');

  // Use useSWR for data fetching
  const { data: entries, error, isLoading } = useSWR<ApiEntry[]>(
    `/api/entries?sort=${sortOrder}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return <div className="text-center p-10">Loading feed...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error loading feed: {error.message}</div>;
  }

  const safeEntries = Array.isArray(entries) ? entries : [];

  if (safeEntries.length === 0 && !isLoading) {
    return <div className="text-center p-10">No entries yet. Be the first to post!</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-center space-x-2 mb-4">
        <Button 
          variant={sortOrder === 'new' ? 'secondary' : 'outline'}
          onClick={() => setSortOrder('new')}
        >
          New
        </Button>
        <Button 
          variant={sortOrder === 'top' ? 'secondary' : 'outline'}
          onClick={() => setSortOrder('top')}
        >
          Top
        </Button>
      </div>

      {safeEntries.map((entry) => (
        <FeedItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
} 