'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter, // Added for potential close button
  DialogClose, // Added for explicit close
} from "@/components/ui/dialog"
import { CreateEntryForm } from "./CreateEntryForm"
import { PlusCircle } from 'lucide-react';

interface CreateEntryDialogProps {
  onEntryCreated?: () => void; // Callback to refresh feed, etc.
}

export function CreateEntryDialog({ onEntryCreated }: CreateEntryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false); // Close dialog on successful submission
    if (onEntryCreated) {
      onEntryCreated(); // Trigger potential feed refresh
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card/90 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>Create New Entry</DialogTitle>
          <DialogDescription>
            Share a program, event, or tip with the community.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <CreateEntryForm onSuccess={handleSuccess} />
        </div>
        {/* Optional: Add an explicit close button in the footer */}
        {/* <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  )
} 