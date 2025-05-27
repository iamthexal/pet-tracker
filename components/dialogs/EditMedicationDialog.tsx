"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/context/auth-context'
import { medicationSchema, type MedicationFormValues } from '@/lib/schemas/medication'
import { MedicalRecord } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loading } from '@/components/ui/loading'

interface EditMedicationDialogProps {
  medication: MedicalRecord
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EditMedicationDialog({
  medication,
  isOpen,
  onOpenChange,
}: EditMedicationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: medication.name,
      type: medication.type,
      date: medication.date,
      nextDueDate: medication.nextDueDate || '',
      status: medication.status || 'active',
      endDate: medication.endDate || '',
      endReason: medication.endReason || '',
      prescribedBy: medication.prescribedBy || '',
      dosage: medication.dosage || '',
      frequency: medication.frequency || '',
      duration: medication.duration || '',
      notes: medication.notes || '',
    },
  })

  useEffect(() => {
    // Reset form with medication data whenever the medication prop changes
    form.reset({
      name: medication.name,
      type: medication.type,
      date: medication.date,
      nextDueDate: medication.nextDueDate || '',
      status: medication.status || 'active',
      endDate: medication.endDate || '',
      endReason: medication.endReason || '',
      prescribedBy: medication.prescribedBy || '',
      dosage: medication.dosage || '',
      frequency: medication.frequency || '',
      duration: medication.duration || '',
      notes: medication.notes || '',
    })
  }, [medication, form])

  async function onSubmit(data: MedicationFormValues) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to update medications.",
      })
      return
    }

    try {
      setIsLoading(true)

      const updateData = {
        ...data,
        // Only include nextDueDate if status is active
        nextDueDate: data.status === 'active' ? data.nextDueDate : null,
        // Only include endDate and endReason if status is completed or discontinued
        endDate: ['completed', 'discontinued'].includes(data.status) ? data.endDate : null,
        endReason: ['completed', 'discontinued'].includes(data.status) ? data.endReason : null,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(doc(db, 'medications', medication.id), updateData)

      toast({
        title: 'Success',
        description: 'Medication updated successfully.',
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating medication:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update medication. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Watch status field to show/hide conditional fields
  const status = form.watch('status')
  const showEndFields = status === 'completed' || status === 'discontinued'
  const showNextDueDate = status === 'active'

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Medication</DialogTitle>
          <DialogDescription>
            Update medication details
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter medication name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="medication">Medication</SelectItem>
                        <SelectItem value="vaccination">Vaccination</SelectItem>
                        <SelectItem value="treatment">Treatment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showNextDueDate && (
              <FormField
                control={form.control}
                name="nextDueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Due Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showEndFields && (
              <>
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Reason</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter reason for ending medication"
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Add reason for completing or discontinuing medication
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="prescribedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prescribed By</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter prescriber's name"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter dosage"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter frequency"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter duration"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any additional notes"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loading className="mr-2" size={16} />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}