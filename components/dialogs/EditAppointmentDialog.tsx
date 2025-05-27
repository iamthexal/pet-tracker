// components/EditAppointmentDialog.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { doc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { appointmentFormSchema, type AppointmentFormValues } from '@/lib/schemas/appointment';
import { Appointment } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { useAuth } from '@/lib/context/auth-context';

interface EditAppointmentDialogProps {
  appointment: Appointment;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAppointmentDialog({ 
  appointment,
  isOpen,
  onOpenChange
}: EditAppointmentDialogProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomType, setShowCustomType] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize form with appointment data
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      // If the type is not one of the predefined types, set type to 'other' and customType to the actual type
      type: ['checkup', 'grooming', 'emergency', 'vaccination'].includes(appointment.type) 
        ? appointment.type as 'checkup' | 'grooming' | 'emergency' | 'vaccination'
        : 'other',
      customType: ['checkup', 'grooming', 'emergency', 'vaccination'].includes(appointment.type)
        ? ''
        : appointment.type,
      date: appointment.date,
      time: appointment.time,
      vetName: appointment.vetName || '',
      clinic: appointment.clinic || '',
      notes: appointment.notes || '',
      status: appointment.status,
    },
  });

  // Watch the appointment type to show/hide custom type input
  const appointmentType = form.watch('type');

  useEffect(() => {
    setShowCustomType(appointmentType === 'other');
  }, [appointmentType]);

  async function onSubmit(data: AppointmentFormValues) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to update appointments.",
      });
      return;
    }

    try {
      setIsLoading(true);

      const appointmentRef = doc(db, 'appointments', appointment.id);
      await updateDoc(appointmentRef, {
        ...data,
        // Use customType as the type if 'other' is selected
        type: data.type === 'other' ? data.customType : data.type,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Success',
        description: 'Appointment has been updated successfully.',
      });

      onOpenChange(false);
      router.refresh();

    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem updating the appointment. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onDelete() {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to delete appointments.",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Verify ownership before deletion
      const appointmentRef = doc(db, 'appointments', appointment.id);
      const appointmentDoc = await getDoc(appointmentRef);

      if (!appointmentDoc.exists() || appointmentDoc.data()?.userId !== user.uid) {
        throw new Error('Unauthorized to delete this appointment');
      }

      await deleteDoc(appointmentRef);

      toast({
        title: 'Success',
        description: 'Appointment has been deleted successfully.',
      });

      setIsDeleteDialogOpen(false);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem deleting the appointment. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Make changes to the appointment details
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appointment Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select appointment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="checkup">Check-up</SelectItem>
                      <SelectItem value="grooming">Grooming</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="vaccination">Vaccination</SelectItem>
                      <SelectItem value="other">Other (Custom)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCustomType && (
              <FormField
                control={form.control}
                name="customType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Appointment Type</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter appointment type"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Specify the type of appointment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vetName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Veterinarian Name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                  <FormDescription>
                    Optional: Enter the name of the veterinarian
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clinic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinic</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                  <FormDescription>
                    Optional: Enter the name of the clinic
                  </FormDescription>
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
                      className="resize-none"
                      {...field}
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Add any additional notes or instructions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <div className="flex w-full justify-between">
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" disabled={isLoading}>
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        appointment and remove it from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isLoading ? (
                          <>
                            <Loading className="mr-2" size={16} />
                            Deleting...
                          </>
                        ) : (
                          'Delete'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

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
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}