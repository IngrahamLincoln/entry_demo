'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tag } from "@/generated/prisma"; // Import Tag enum
import { useState } from "react";

// Zod schema for validation
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }).max(100),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).max(1000),
  tag: z.nativeEnum(Tag, { errorMap: () => ({ message: "Please select a valid tag." }) })
})

interface CreateEntryFormProps {
  onSuccess?: () => void; // Optional callback for successful submission
}

export function CreateEntryForm({ onSuccess }: CreateEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      // tag: undefined, // Let placeholder handle initial state
    },
  })
 
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setSubmitError(null);
    console.log("Submitting:", values);

    try {
        const response = await fetch('/api/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        // Reset form and call onSuccess callback if provided
        form.reset();
        if (onSuccess) {
          onSuccess();
        }

    } catch (error) {
        console.error("Submission failed:", error);
        setSubmitError(error instanceof Error ? error.message : "An unknown error occurred during submission.");
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter a concise title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide details about the program, event, or tip..."
                  className="resize-none" // Optional: disable resizing
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a relevant tag" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(Tag).map((tagValue) => (
                    <SelectItem key={tagValue} value={tagValue}>
                      {tagValue.replace(/_/g, ' ')} {/* Format enum for display */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {submitError && (
          <p className="text-sm font-medium text-destructive">{submitError}</p>
        )}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Submitting...' : 'Create Entry'}
        </Button>
      </form>
    </Form>
  )
} 