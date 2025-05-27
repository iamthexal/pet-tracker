'use client';

import { useEffect, useState, useCallback } from 'react';
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
  serverTimestamp,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { isAfter, isBefore, startOfDay, parseISO, endOfDay } from 'date-fns';
import { Plus, Calendar } from 'lucide-react';
import { Appointment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddAppointmentDialog } from '@/components/dialogs/AddAppointmentDialog';
import { AppointmentCard } from '@/components/cards/AppointmentCard';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';

interface AppointmentsClientProps {
  petId: string;
}

export function AppointmentsClient({ petId }: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const updatePastAppointments = useCallback(async (appointments: Appointment[]) => {
    if (!user) return;

    const today = endOfDay(new Date());
    const batch = writeBatch(db);
    let updateCount = 0;

    appointments.forEach((appointment) => {
      if (
        appointment.userId === user.uid &&
        isBefore(parseISO(appointment.date), today) && 
        appointment.status === 'scheduled'
      ) {
        const appointmentRef = doc(db, 'appointments', appointment.id);
        batch.update(appointmentRef, {
          status: 'completed',
          updatedAt: serverTimestamp(),
        });
        updateCount++;
      }
    });

    if (updateCount > 0) {
      try {
        await batch.commit();
        toast({
          title: "Auto-Update Complete",
          description: `${updateCount} past ${updateCount === 1 ? 'appointment was' : 'appointments were'} marked as completed.`,
        });
      } catch (error) {
        console.error('Error updating past appointments:', error);
      }
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user || !petId) return;

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

    const setupAppointments = async () => {
      const hasAccess = await verifyPetOwnership();
      if (!hasAccess) return;

      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('petId', '==', petId),
        where('userId', '==', user.uid),
        orderBy('date', 'asc')
      );

      const unsubscribe = onSnapshot(
        appointmentsQuery,
        (snapshot) => {
          const appointmentsData: Appointment[] = [];
          snapshot.forEach((doc) => {
            appointmentsData.push({ id: doc.id, ...doc.data() } as Appointment);
          });
          setAppointments(appointmentsData);
          setIsLoading(false);

          updatePastAppointments(appointmentsData);
        },
        (error) => {
          console.error('Error fetching appointments:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load appointments. Please try again."
          });
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    };

    setupAppointments();
  }, [petId, user, toast, router, updatePastAppointments]);

  const now = startOfDay(new Date());

  const upcomingAppointments = appointments.filter(
    (appointment) => 
      isAfter(new Date(appointment.date), now) && 
      appointment.status === 'scheduled'
  );

  const pastAppointments = appointments.filter(
    (appointment) => 
      isBefore(new Date(appointment.date), now) || 
      appointment.status !== 'scheduled'
  ).sort((a, b) => {
    return parseISO(b.date).getTime() - parseISO(a.date).getTime();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size={32} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">
            Manage your pet&apos;s appointments and check-ups
          </p>
        </div>
        <AddAppointmentDialog petId={petId}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Appointment
          </Button>
        </AddAppointmentDialog>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No upcoming appointments</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Schedule a new appointment for your pet
                </p>
                <AddAppointmentDialog petId={petId}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Appointment
                  </Button>
                </AddAppointmentDialog>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                isUpcoming={true}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No past appointments</p>
                <p className="text-sm text-muted-foreground">
                  Past and completed appointments will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            pastAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                isUpcoming={false}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

