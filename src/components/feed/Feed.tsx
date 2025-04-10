'use client';

import { useEffect, useState } from 'react';
import { FeedItem } from './FeedItem';
import { Tag } from "@/generated/prisma"; 

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

export function Feed() {
  const [entries, setEntries] = useState<ApiEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/entries'); // Fetches using default sorting (newest first)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ApiEntry[] = await response.json();
        setEntries(data);
      } catch (err) {
        console.error("Failed to fetch entries:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, []); // Empty dependency array means this runs once on mount

  if (isLoading) {
    return <div className="text-center p-10">Loading feed...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error loading feed: {error}</div>;
  }

  if (entries.length === 0) {
    return <div className="text-center p-10">No entries yet. Be the first to post!</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {/* TODO: Add sorting controls here in Phase 4 */}
      {entries.map((entry) => (
        <FeedItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
} 