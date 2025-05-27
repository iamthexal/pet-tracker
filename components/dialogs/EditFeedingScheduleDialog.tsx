// components/EditFeedingScheduleDialog.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { doc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { feedingScheduleSchema, type FeedingScheduleFormValues } from '@/lib/schemas/feeding-schedule';
import { FeedingSchedule } from '@/types';
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

interface EditFeedingScheduleDialogProps {
  schedule: FeedingSchedule;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditFeedingScheduleDialog({ 
  schedule,
  isOpen,
  onOpenChange
}: EditFeedingScheduleDialogProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FeedingScheduleFormValues>({
    resolver: zodResolver(feedingScheduleSchema),
    defaultValues: {
      timeOfDay: schedule.timeOfDay || '',
      foodType: schedule.foodType || '',
      amount: schedule.amount || 0,
      unit: schedule.unit || 'cups',
      notes: schedule.notes || '',
    },
  });

  async function onSubmit(data: FeedingScheduleFormValues) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to update feeding schedules.",
      });
      return;
    }

    try {
      setIsLoading(true);

      const scheduleRef = doc(db, 'feeding-schedules', schedule.id);
      await updateDoc(scheduleRef, {
        ...data,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Success',
        description: 'Feeding schedule has been updated successfully.',
      });

      onOpenChange(false);
      router.refresh();

    } catch (error) {
      console.error('Error updating feeding schedule:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem updating the feeding schedule. Please try again.',
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
        description: "You must be logged in to delete feeding schedules.",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Verify ownership before deletion
      const scheduleRef = doc(db, 'feeding-schedules', schedule.id);
      const scheduleDoc = await getDoc(scheduleRef);

      if (!scheduleDoc.exists() || scheduleDoc.data()?.userId !== user.uid) {
        throw new Error('Unauthorized to delete this schedule');
      }

      await deleteDoc(scheduleRef);

      toast({
        title: 'Success',
        description: 'Feeding schedule has been deleted successfully.',
      });

      setIsDeleteDialogOpen(false);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error deleting feeding schedule:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was a problem deleting the feeding schedule. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Feeding Schedule</DialogTitle>
          <DialogDescription>
            Make changes to the feeding schedule
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="timeOfDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feeding Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="time"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="foodType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Type</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Dry kibble, Wet food"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.1"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Unit</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cups">Cups</SelectItem>
                        <SelectItem value="grams">Grams</SelectItem>
                        <SelectItem value="oz">Ounces</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional notes"
                      className="resize-none"
                      {...field}
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Add any special instructions
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
                        feeding schedule.
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