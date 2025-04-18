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
        <Button 
          variant="outline" 
          className="bg-background/60 backdrop-blur-md border border-white/20 hover:bg-background/80 shadow-lg transition-all duration-300"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background/70 backdrop-blur-xl border border-white/20 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-primary text-xl">Create New Entry</DialogTitle>
          <DialogDescription className="text-muted-foreground/90">
            Share a program, event, or tip with the community.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <CreateEntryForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  )
} 