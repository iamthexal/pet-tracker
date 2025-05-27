// components\AddAppointmentDialog.tsx

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/context/auth-context';
import { appointmentFormSchema, type AppointmentFormValues } from '@/lib/schemas/appointment';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';

interface AddAppointmentDialogProps {
  children: React.ReactNode;
  petId: string;
}

export function AddAppointmentDialog({ children, petId }: AddAppointmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomType, setShowCustomType] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      type: 'checkup',
      date: '',
      time: '',
      vetName: '',
      clinic: '',
      notes: '',
      status: 'scheduled',
      customType: '',
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
        description: "You must be logged in to schedule appointments.",
      });
      return;
    }

    try {
      setIsLoading(true);

      const timestamp = serverTimestamp();
      await addDoc(collection(db, 'appointments'), {
        ...data,
        // If it's a custom type, use that instead of the generic 'other'
        type: data.type === 'other' ? data.customType : data.type,
        petId,
        userId: user.uid,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      toast({
        title: 'Success',
        description: 'Appointment has been scheduled successfully.',
      });

      setIsOpen(false);
      form.reset();

    } catch (error) {
      console.error('Error adding appointment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem scheduling the appointment. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment for your pet
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                    <Input type="time" {...field} />
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
                    <Input placeholder="Enter veterinarian name (optional)" {...field} />
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
                    <Input placeholder="Enter clinic name (optional)" {...field} />
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
                      placeholder="Add any additional notes (optional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Add any additional notes or instructions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loading className="mr-2" size={16} />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Appointment'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}