'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { Pet, Appointment, MedicalRecord, WeightRecord } from '@/types';
import { useAuth } from '@/lib/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Pill, Weight, Edit, Cake, PawPrint, Clock, AlertCircle } from 'lucide-react';
import { EditPetDialog } from "@/components/dialogs/EditPetDialog";
import { capitalizeFirst } from "@/lib/utils";
import { parseISO, format, formatDistanceToNow, isAfter, startOfDay } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { AddAppointmentDialog } from '@/components/dialogs/AddAppointmentDialog';
import { AddMedicationDialog } from '@/components/dialogs/AddMedicationDialog';
import { useRouter } from 'next/navigation';

interface PetOverviewClientProps {
  petId: string;
}

interface PetStats {
  upcomingAppointments: number;
  activeMedications: number;
  dueMedications: number;
  latestWeight: {
    weight: number;
    unit: string;
  } | null;
}

export function PetOverviewClient({ petId }: PetOverviewClientProps) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<MedicalRecord[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const today = startOfDay(new Date());

  // Compute stats from medication data
  const stats = useMemo<PetStats>(() => {
    const activeMeds = medications.filter(med => med.status === 'active');
    const dueMeds = activeMeds.filter(med => 
      med.nextDueDate && !isAfter(parseISO(med.nextDueDate), today)
    );

    return {
      upcomingAppointments: upcomingAppointments.length,
      activeMedications: activeMeds.length,
      dueMedications: dueMeds.length,
      latestWeight: weightHistory[0] ? {
        weight: weightHistory[0].weight,
        unit: weightHistory[0].unit
      } : null
    };
  }, [medications, upcomingAppointments, weightHistory, today]);

  useEffect(() => {
    if (!petId || !user) return;

    const fetchPetData = async () => {
      try {
        const petDoc = await getDoc(doc(db, 'pets', petId));

        // Verify pet ownership
        if (!petDoc.exists() || petDoc.data()?.userId !== user.uid) {
          router.push('/dashboard');
          toast({
            variant: "destructive",
            title: "Error",
            description: "Pet not found or access denied.",
          });
          return;
        }

        setPet({ id: petDoc.id, ...petDoc.data() } as Pet);

        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('petId', '==', petId),
          where('userId', '==', user.uid),
          where('status', '==', 'scheduled'),
          limit(3)
        );

        const medicationsQuery = query(
          collection(db, 'medications'),
          where('petId', '==', petId),
          where('userId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(5)
        );

        const weightQuery = query(
          collection(db, 'weights'),
          where('petId', '==', petId),
          where('userId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(5)
        );

        // Set up real-time listeners
        const unsubAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
          const appointments: Appointment[] = [];
          snapshot.forEach((doc) => {
            const appointment = { id: doc.id, ...doc.data() } as Appointment;
            if (isAfter(parseISO(appointment.date), today)) {
              appointments.push(appointment);
            }
          });
          setUpcomingAppointments(appointments);
        });

        const unsubMedications = onSnapshot(medicationsQuery, (snapshot) => {
          const medicationsData: MedicalRecord[] = [];
          snapshot.forEach((doc) => {
            medicationsData.push({ id: doc.id, ...doc.data() } as MedicalRecord);
          });
          setMedications(medicationsData);
        });

        const unsubWeights = onSnapshot(weightQuery, (snapshot) => {
          const weights: WeightRecord[] = [];
          snapshot.forEach((doc) => {
            weights.push({ id: doc.id, ...doc.data() } as WeightRecord);
          });
          setWeightHistory(weights);
        });

        setIsLoading(false);

        return () => {
          unsubAppointments();
          unsubMedications();
          unsubWeights();
        };

      } catch (error) {
        console.error('Error fetching pet data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load pet information. Please try again.",
        });
        setIsLoading(false);
      }
    };

    fetchPetData();
  }, [petId, user, toast, router, today]);

  const formatDate = (dateString: string): string => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  const formatDateTime = (date: string, time?: string) => {
    if (!date) return '';
    const formattedDate = format(parseISO(date), 'MMM d, yyyy');
    if (time) {
      return `${formattedDate} at ${format(parseISO(`2000-01-01T${time}`), 'h:mm a')}`;
    }
    return formattedDate;
  };

  const calculateAge = (birthDate: string) => {
    const birth = parseISO(birthDate);
    const age = formatDistanceToNow(birth);
    return { text: age, tooltip: `Born on ${formatDate(birthDate)}` };
  };
  

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Pet not found</p>
      </div>
    );
  }

  const ageInfo = calculateAge(pet.birthDate);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-24 w-24">
            {pet.imageUrl ? (
              <AvatarImage src={pet.imageUrl} alt={pet.name} />
            ) : (
              <AvatarFallback>
                <PawPrint className="h-12 w-12" />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{pet.name}</h1>
            <p className="text-muted-foreground">
              {pet.breed ? `${capitalizeFirst(pet.species)} • ${pet.breed}` : capitalizeFirst(pet.species)}
            </p>
          </div>
        </div>
        <EditPetDialog pet={pet}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Pet
          </Button>
        </EditPetDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Age</CardTitle>
            <Cake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-2xl font-bold cursor-help">{ageInfo.text}</div>
              </TooltipTrigger>
              <TooltipContent>{ageInfo.tooltip}</TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Medications</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMedications}</div>
            {stats.dueMedications > 0 && (
              <p className="text-xs text-red-500">
                {stats.dueMedications} due now
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Weight</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.latestWeight ? `${stats.latestWeight.weight} ${stats.latestWeight.unit}` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="weight">Weight History</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
            <AddAppointmentDialog petId={petId}>
              <Button>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Button>
            </AddAppointmentDialog>
          </div>
          <div className="grid gap-4">
            {upcomingAppointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No upcoming appointments</p>
                  <p className="text-sm text-muted-foreground mb-4">Schedule a new appointment</p>
                  <AddAppointmentDialog petId={petId}>
                    <Button>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Appointment
                    </Button>
                  </AddAppointmentDialog>
                </CardContent>
              </Card>
            ) : (
              upcomingAppointments.map((appointment) => (
                <Card key={appointment.id} className="cursor-pointer hover:bg-accent/50" onClick={() => router.push(`/pets/${petId}/appointments`)}>
                  <CardContent className="flex justify-between items-center p-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge>{capitalizeFirst(appointment.type)}</Badge>
                        {appointment.status === 'scheduled' && (
                          <Badge variant="outline">Scheduled</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(appointment.date, appointment.time)}
                      </p>
                      {appointment.clinic && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {appointment.clinic}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
            {upcomingAppointments.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(`/pets/${petId}/appointments`)}
              >
                View All Appointments
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="medications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Medications</h2>
            <AddMedicationDialog petId={petId}>
              <Button>
                <Pill className="mr-2 h-4 w-4" />
                Add Medication
              </Button>
            </AddMedicationDialog>
          </div>
          <div className="grid gap-4">
            {medications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Pill className="h-8 w-8 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No medications</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first medication to start tracking
                  </p>
                  <AddMedicationDialog petId={petId}>
                    <Button>
                      <Pill className="mr-2 h-4 w-4" />
                      Add Medication
                    </Button>
                  </AddMedicationDialog>
                </CardContent>
              </Card>
            ) : (
              medications.map((medication) => (
                <Card key={medication.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{medication.name}</h3>
                          <Badge variant={
                            medication.status === 'active' 
                              ? (medication.nextDueDate && !isAfter(parseISO(medication.nextDueDate), today)
                                ? 'destructive'
                                : 'default')
                              : medication.status === 'completed'
                              ? 'secondary'
                              : 'outline'
                          }>
                            {medication.status === 'active' && medication.nextDueDate && !isAfter(parseISO(medication.nextDueDate), today)
                              ? 'Overdue'
                              : capitalizeFirst(medication.status)}
                          </Badge>
                          <Badge variant="outline">
                            {capitalizeFirst(medication.type)}
                          </Badge>
                        </div>
                        
                        {medication.dosage && (
                          <p className="text-sm text-muted-foreground">
                            Dosage: {medication.dosage}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-muted-foreground">
                            Started: {formatDate(medication.date)}
                          </p>
                          {medication.status === 'active' && medication.nextDueDate && (
                            <p className="text-sm text-muted-foreground">
                              Next due: {formatDate(medication.nextDueDate)}
                            </p>
                          )}
                          {medication.endDate && (
                            <p className="text-sm text-muted-foreground">
                              Ended: {formatDate(medication.endDate)}
                            </p>
                          )}
                        </div>

                        {medication.endReason && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            <p>{medication.endReason}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/pets/${petId}/medications`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            {medications.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(`/pets/${petId}/medications`)}
              >
                View All Medications
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="weight" className="space-y-4">
          <div className="grid gap-4">
            {weightHistory.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Weight className="h-8 w-8 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No weight records</p>
                  <p className="text-sm text-muted-foreground">
                    No weight history recorded yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              weightHistory.map((weight) => (
                <Card key={weight.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{weight.weight} {weight.unit}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(weight.date)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}