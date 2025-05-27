// lib/schemas/pet.ts

import * as z from "zod"

export const addPetSchema = z.object({
  name: z.string().min(1, "Pet name is required").max(50),
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  imageUrl: z.string().optional(),
})