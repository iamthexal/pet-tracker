'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/context/auth-context';
import { 
 collection, 
 query, 
 where, 
 orderBy, 
 onSnapshot,
 doc,
 getDoc
} from 'firebase/firestore';
import { FeedingSchedule } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Clock, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddFeedingScheduleDialog } from '@/components/dialogs/AddFeedingScheduleDialog';
import { EditFeedingScheduleDialog } from '@/components/dialogs/EditFeedingScheduleDialog';
import { format } from 'date-fns';

interface FeedingScheduleClientProps {
 petId: string;
}

export function FeedingScheduleClient({ petId }: FeedingScheduleClientProps) {
 const [schedules, setSchedules] = useState<FeedingSchedule[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
 const { user } = useAuth();
 const { toast } = useToast();
 const router = useRouter();

 useEffect(() => {
   if (!user || !petId) return;

   // First verify pet ownership
   const verifyPetOwnership = async () => {
     try {
       const petDoc = await getDoc(doc(db, 'pets', petId));
       if (!petDoc.exists() || petDoc.data()?.userId !== user.uid) {
         toast({
           variant: "destructive",
           title: "Error",
           description: "Pet not found or access denied.",
         });
         router.push('/dashboard');
         return false;
       }
       return true;
     } catch (error) {
       console.error('Error verifying pet ownership:', error);
       return false;
     }
   };

   const setupFeedingSchedules = async () => {
     const hasAccess = await verifyPetOwnership();
     if (!hasAccess) return;

     const schedulesQuery = query(
       collection(db, 'feeding-schedules'),
       where('petId', '==', petId),
       where('userId', '==', user.uid),
       orderBy('timeOfDay', 'asc')
     );

     const unsubscribe = onSnapshot(
       schedulesQuery,
       (snapshot) => {
         const schedulesData: FeedingSchedule[] = [];
         snapshot.forEach((doc) => {
           schedulesData.push({ id: doc.id, ...doc.data() } as FeedingSchedule);
         });
         setSchedules(schedulesData);
         setIsLoading(false);
       },
       () => {
         toast({
           variant: "destructive",
           title: "Error",
           description: "Could not load feeding schedules. Please try again."
         });
         setIsLoading(false);
       }
     );

     return () => unsubscribe();
   };

   setupFeedingSchedules();
 }, [petId, user, toast, router]);

 const formatTime = (timeString: string) => {
   try {
     // Use a fixed date to parse the time
     const date = new Date(`2000-01-01T${timeString}`);
     return format(date, 'h:mm a');
   } catch {
     return timeString;
   }
 };

 if (isLoading) {
   return (
     <div className="flex items-center justify-center min-h-screen">
       <Loading size={32} />
     </div>
   );
 }

 const editingSchedule = schedules.find(s => s.id === editingScheduleId);

 return (
   <div className="container mx-auto p-6 space-y-8">
     <div className="flex justify-between items-center">
       <div>
         <h1 className="text-3xl font-bold">Feeding Schedule</h1>
         <p className="text-muted-foreground">
           Manage your pet&apos;s feeding times and portions
         </p>
       </div>
       <AddFeedingScheduleDialog petId={petId}>
         <Button>
           <PlusCircle className="mr-2 h-4 w-4" />
           Add Schedule
         </Button>
       </AddFeedingScheduleDialog>
     </div>

     {schedules.length === 0 ? (
       <Card>
         <CardContent className="flex flex-col items-center justify-center py-8 text-center">
           <Clock className="h-8 w-8 text-muted-foreground mb-4" />
           <p className="text-lg font-medium">No feeding schedules</p>
           <p className="text-sm text-muted-foreground mb-4">
             Add your first feeding schedule to keep track of meals
           </p>
           <AddFeedingScheduleDialog petId={petId}>
             <Button>
               <PlusCircle className="mr-2 h-4 w-4" />
               Add Schedule
             </Button>
           </AddFeedingScheduleDialog>
         </CardContent>
       </Card>
     ) : (
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         {schedules.map((schedule) => (
           <Card key={schedule.id} className="hover:shadow-md transition-shadow">
             <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="text-xl">
                 {formatTime(schedule.timeOfDay)}
               </CardTitle>
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => setEditingScheduleId(schedule.id)}
               >
                 <Pencil className="h-4 w-4" />
               </Button>
             </CardHeader>
             <CardContent>
               <div className="space-y-2">
                 <p>
                   <span className="font-medium">Amount:</span>{' '}
                   {schedule.amount} {schedule.unit}
                 </p>
                 <p>
                   <span className="font-medium">Food Type:</span>{' '}
                   {schedule.foodType}
                 </p>
                 {schedule.notes && (
                   <p className="text-sm text-muted-foreground">
                     {schedule.notes}
                   </p>
                 )}
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
     )}

     {editingSchedule && (
       <EditFeedingScheduleDialog
         schedule={editingSchedule}
         isOpen={!!editingScheduleId}
         onOpenChange={(open) => {
           if (!open) setEditingScheduleId(null);
         }}
       />
     )}
   </div>
 );
}