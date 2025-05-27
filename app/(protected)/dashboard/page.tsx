'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, isAfter, parseISO, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertCircle, PlusCircle, ArrowRight, PawPrint, Activity } from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import { AddPetDialog } from '@/components/dialogs/AddPetDialog';
import { capitalizeFirst, capitalizeWords } from '@/lib/utils';
import { isDueSoon, isOverdue } from '@/lib/date';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardStats {
  totalPets: number;
  upcomingAppointments: number;
  activeMedications: number;
  dueMedications: number;
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  imageUrl?: string;
  userId: string;
  createdAt: Timestamp;
}

interface Appointment {
  id: string;
  petId: string;
  type: string;
  date: string;
  time: string;
  status: string;
  userId: string;
  petName?: string;
}

interface Medication {
  id: string;
  petId: string;
  name: string;
  nextDueDate: string;
  status: 'active' | 'completed' | 'discontinued';
  userId: string;
  petName?: string;
  type: string;
}

interface DashboardData {
  recentPets: Pet[];
  recentAppointments: Appointment[];
  recentMedications: Medication[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPets: 0,
    upcomingAppointments: 0,
    activeMedications: 0,
    dueMedications: 0,
  });
  const [data, setData] = useState<DashboardData>({
    recentPets: [],
    recentAppointments: [],
    recentMedications: [],
  });
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const today = startOfDay(new Date());

    // Set up queries
    const petsQuery = query(
      collection(db, 'pets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('userId', '==', user.uid),
      where('status', '==', 'scheduled'),
      orderBy('date', 'asc'),
      limit(5)
    );

    const medicationsQuery = query(
      collection(db, 'medications'),
      where('userId', '==', user.uid),
      where('status', '==', 'active'),
      orderBy('nextDueDate', 'asc'),
      limit(5)
    );

    // Set up real-time listeners
    const unsubPets = onSnapshot(petsQuery, (snapshot) => {
      const pets: Pet[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Pet));
      setStats(prev => ({ ...prev, totalPets: snapshot.size }));
      setData(prev => ({ ...prev, recentPets: pets }));

      // Create a map of pet names for reference
      const petNames = new Map(pets.map(pet => [pet.id, pet.name]));

      // Update appointments and medications with pet names
      setData(prev => ({
        ...prev,
        recentAppointments: prev.recentAppointments.map(apt => ({
          ...apt,
          petName: petNames.get(apt.petId)
        })),
        recentMedications: prev.recentMedications.map(med => ({
          ...med,
          petName: petNames.get(med.petId)
        }))
      }));
    });

    const unsubAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointments: Appointment[] = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Appointment))
        .filter(apt => isAfter(parseISO(apt.date), today));

      setStats(prev => ({ ...prev, upcomingAppointments: appointments.length }));
      setData(prev => ({ ...prev, recentAppointments: appointments }));
    });

    // Updated medications processing
    const unsubMedications = onSnapshot(medicationsQuery, (snapshot) => {
      const medications: Medication[] = [];
      snapshot.forEach((doc) => {
        const med = { id: doc.id, ...doc.data() } as Medication;
        // Only add to the list if it's due soon or overdue
        if (med.nextDueDate && isDueSoon(med.nextDueDate)) {
          medications.push(med);
        }
      });

      const dueMeds = medications.filter(med => 
        med.nextDueDate && isOverdue(med.nextDueDate)
      );

      setStats(prev => ({ 
        ...prev, 
        activeMedications: medications.length,
        dueMedications: dueMeds.length
      }));
      setData(prev => ({ ...prev, recentMedications: medications }));
      setIsLoading(false);
    });

    return () => {
      unsubPets();
      unsubAppointments();
      unsubMedications();
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-2rem)]">
        <Loading size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          Welcome, {user?.displayName || 'User'}
        </h1>
        <AddPetDialog key="add-pet-dialog">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Pet
          </Button>
        </AddPetDialog>
      </div>
      
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pets</CardTitle>
            <PawPrint className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPets}</div>
            <p className="text-xs text-muted-foreground">
              Active pet profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled visits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Medications</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMedications}</div>
            <p className="text-xs text-muted-foreground">
              Medications due soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Medications</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dueMedications}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent pets section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Pets</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentPets.length === 0 ? (
            <div className="bg-muted/50 rounded-lg">
              <div className="flex flex-col items-center justify-center p-6">
                <PawPrint className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  No pets added yet. Add your first pet to get started!
                </p>
                <AddPetDialog key="empty-state-add-pet">
                  <Button variant="outline" className="mt-4">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Your First Pet
                  </Button>
                </AddPetDialog>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.recentPets.map((pet) => (
                <div
                  key={pet.id}
                  className="flex items-center space-x-4 p-4 rounded-lg border cursor-pointer hover:bg-accent/50"
                  onClick={() => router.push(`/pets/${pet.id}`)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={pet.imageUrl} alt={pet.name} />
                    <AvatarFallback>{pet.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-medium">{pet.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {capitalizeFirst(pet.species)} •{' '}
                      {pet.breed ? capitalizeFirst(pet.breed) : 'No breed specified'}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent appointments and medications */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentAppointments.length === 0 ? (
              <div className="text-center py-4">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentAppointments.map((apt) => (
                  <div key={apt.id} className="flex justify-between items-center p-4 rounded-lg border">
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{capitalizeWords(apt.type)}</p>
                        <Badge variant="outline">{apt.petName}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(parseISO(apt.date), 'PPP')}
                        {apt.time && ` at ${format(parseISO(`2000-01-01T${apt.time}`), 'h:mm a')}`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/pets/${apt.petId}/appointments`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Due Medications */}
        <Card>
          <CardHeader>
            <CardTitle>Due Medications</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentMedications.length === 0 ? (
              <div className="text-center py-4">
                <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No medications due</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentMedications.map((med) => (
                  <div key={med.id} className="flex justify-between items-center p-4 rounded-lg border">
                    <div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{med.name}</p>
                        <Badge variant="outline">{med.petName}</Badge>
                        {med.nextDueDate && isOverdue(med.nextDueDate) && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          Due: {format(parseISO(med.nextDueDate), 'PPP')}
                        </p>
                        <Badge variant="secondary">
                          {capitalizeFirst(med.type)}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/pets/${med.petId}/medications`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

