// lib/schemas/feeding-schedule.ts

import * as z from "zod"

export const feedingScheduleSchema = z.object({
  timeOfDay: z.string({
    required_error: "Please select a feeding time",
  }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  
  foodType: z.string({
    required_error: "Please enter the type of food",
  }).min(1, "Food type is required").max(100, "Food type cannot exceed 100 characters"),
  
  amount: z.number({
    required_error: "Please enter the amount",
  }).min(0, "Amount must be greater than 0"),
  
  unit: z.enum(['cups', 'grams', 'oz'], {
    required_error: "Please select a unit",
  }),
  
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export type FeedingScheduleFormValues = z.infer<typeof feedingScheduleSchema>

export const defaultValues: Partial<FeedingScheduleFormValues> = {
  timeOfDay: '',
  foodType: '',
  amount: 0,
  unit: 'cups',
  notes: '',
}