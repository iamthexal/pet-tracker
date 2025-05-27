// lib/schemas/note.ts

import * as z from "zod"

export const noteFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Content cannot exceed 2000 characters"),
  category: z.enum(['behavior', 'health', 'emergency', 'general'], {
    required_error: "Please select a category",
  }),
})

export type NoteFormValues = z.infer<typeof noteFormSchema>

export const defaultValues: Partial<NoteFormValues> = {
  title: '',
  content: '',
  category: 'general',
}