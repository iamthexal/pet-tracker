// lib/schemas/medication.ts

import * as z from "zod"
import { parse, isAfter } from "date-fns"

const dateStringSchema = z.string().refine(
  (date) => {
    try {
      parse(date, 'yyyy-MM-dd', new Date())
      return true
    } catch {
      return false
    }
  },
  {
    message: "Invalid date format",
  }
)

export const medicationSchema = z.object({
  name: z.string({
    required_error: "Medication name is required",
  }).min(1, "Medication name is required"),

  type: z.enum(['medication', 'vaccination', 'treatment'], {
    required_error: "Please select a type",
  }),

  date: dateStringSchema,

  nextDueDate: dateStringSchema.optional(),

  endDate: dateStringSchema.optional(),

  status: z.enum(['active', 'completed', 'discontinued']).default('active'),

  endReason: z.string().max(500, "End reason cannot exceed 500 characters").optional(),

  prescribedBy: z.string().max(100, "Name cannot exceed 100 characters").optional(),

  dosage: z.string().max(100, "Dosage cannot exceed 100 characters").optional(),

  frequency: z.string().max(100, "Frequency cannot exceed 100 characters").optional(),

  duration: z.string().max(100, "Duration cannot exceed 100 characters").optional(),

  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
}).refine((data) => {
  // If status is completed or discontinued, endDate is required
  if ((data.status === 'completed' || data.status === 'discontinued') && !data.endDate) {
    return false
  }
  return true
}, {
  message: "End date is required when medication is completed or discontinued",
  path: ["endDate"],
}).refine((data) => {
  // If status is active and nextDueDate is provided, it must be after the start date
  if (data.status === 'active' && data.nextDueDate) {
    const startDate = parse(data.date, 'yyyy-MM-dd', new Date())
    const nextDate = parse(data.nextDueDate, 'yyyy-MM-dd', new Date())
    return isAfter(nextDate, startDate) || startDate.getTime() === nextDate.getTime()
  }
  return true
}, {
  message: "Next due date must be on or after the start date",
  path: ["nextDueDate"],
}).refine((data) => {
  // If endDate is provided, it must be after or equal to the start date
  if (data.endDate) {
    const startDate = parse(data.date, 'yyyy-MM-dd', new Date())
    const endDate = parse(data.endDate, 'yyyy-MM-dd', new Date())
    return isAfter(endDate, startDate) || startDate.getTime() === endDate.getTime()
  }
  return true
}, {
  message: "End date must be on or after the start date",
  path: ["endDate"],
})

// Export types and default values
export type MedicationFormValues = z.infer<typeof medicationSchema>

export const defaultMedicationValues: Partial<MedicationFormValues> = {
  name: '',
  type: 'medication',
  date: '',
  nextDueDate: '',
  status: 'active',
  endDate: '',
  endReason: '',
  prescribedBy: '',
  dosage: '',
  frequency: '',
  duration: '',
  notes: '',
}
