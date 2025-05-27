//lib/schemas/weight.ts

import * as z from "zod"

export const weightRecordSchema = z.object({
  weight: z
    .number({
      required_error: "Weight is required",
      invalid_type_error: "Weight must be a number",
    })
    .positive("Weight must be greater than 0"),
  
  unit: z.enum(['lbs', 'kg'], {
    required_error: "Please select a unit",
  }),
  
  date: z.string({
    required_error: "Date is required",
  }).regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export type WeightFormValues = z.infer<typeof weightRecordSchema>

export const defaultValues: Partial<WeightFormValues> = {
  weight: 0,
  unit: 'lbs',
  date: '',
  notes: '',
}