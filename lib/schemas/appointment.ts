// lib/schemas/appointment.ts

import * as z from "zod"

export const appointmentFormSchema = z.object({
  type: z.enum(['checkup', 'grooming', 'emergency', 'vaccination', 'other'], {
    required_error: "Please select an appointment type",
  }),
  customType: z.string()
    .max(50, "Custom type cannot exceed 50 characters")
    .optional(),
  date: z.string({
    required_error: "Please select a date",
  }).regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string({
    required_error: "Please select a time",
  }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  vetName: z.string().optional(),
  clinic: z.string().optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
}).refine((data) => {
  // Require customType when type is 'other'
  if (data.type === 'other' && !data.customType) {
    return false;
  }
  return true;
}, {
  message: "Please specify the appointment type",
  path: ["customType"],
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>

export const defaultValues: Partial<AppointmentFormValues> = {
  type: 'checkup',
  status: 'scheduled',
  notes: '',
  customType: '',
}