'use client';

import { useEffect, useState, useMemo } from 'react';
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
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { MedicalRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pill, CalendarCheck, AlertCircle, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddMedicationDialog } from '@/components/dialogs/AddMedicationDialog';
import { MedicationCard } from '@/components/cards/MedicationCard';
import { isAfter, parseISO } from 'date-fns';

interface MedicationsClientProps {
  petId: string;
}

export function MedicationsClient({ petId }: MedicationsClientProps) {
  const [medications, setMedications] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

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

    const setupMedications = async () => {
      const hasAccess = await verifyPetOwnership();
      if (!hasAccess) return;

      const medicationsQuery = query(
        collection(db, 'medications'),
        where('petId', '==', petId),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(
        medicationsQuery,
        (snapshot) => {
          const medicationsData: MedicalRecord[] = [];
          snapshot.forEach((doc) => {
            medicationsData.push({ id: doc.id, ...doc.data() } as MedicalRecord);
          });
          setMedications(medicationsData);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching medications:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load medications. Please try again."
          });
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    };

    setupMedications();
  }, [petId, user, toast, router]);

  const {
    activeMedications,
    completedMedications,
    discontinuedMedications,
    dueMedications
  } = useMemo(() => {
    const active = medications.filter(med => med.status === 'active');
    return {
      activeMedications: active,
      completedMedications: medications.filter(med => med.status === 'completed'),
      discontinuedMedications: medications.filter(med => med.status === 'discontinued'),
      dueMedications: active.filter(med => {
        if (!med.nextDueDate) return false;
        return !isAfter(parseISO(med.nextDueDate), new Date());
      })
    };
  }, [medications]);

  const handleDelete = async (id: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to delete medications.",
      });
      return;
    }

    try {
      await deleteDoc(doc(db, 'medications', id));
      toast({
        title: 'Success',
        description: 'Medication deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete medication. Please try again.',
      });
    }
  };

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
          <h1 className="text-3xl font-bold">Medications</h1>
          <p className="text-muted-foreground">
            Track your pet&apos;s medications and treatments
          </p>
        </div>
        <AddMedicationDialog petId={petId}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Medication
          </Button>
        </AddMedicationDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Medications</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMedications.length}</div>
            <p className="text-sm text-muted-foreground">Current medications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Now</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueMedications.length}</div>
            <p className="text-sm text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedMedications.length}</div>
            <p className="text-sm text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discontinued</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discontinuedMedications.length}</div>
            <p className="text-sm text-muted-foreground">Ended early</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeMedications.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedMedications.length})
          </TabsTrigger>
          <TabsTrigger value="discontinued">
            Discontinued ({discontinuedMedications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {dueMedications.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Due Medications</h2>
              <div className="space-y-4">
                {dueMedications.map((medication) => (
                  <MedicationCard 
                    key={medication.id}
                    medication={medication}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {activeMedications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Pill className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No active medications</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add a new medication to start tracking
                </p>
                <AddMedicationDialog petId={petId}>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Medication
                  </Button>
                </AddMedicationDialog>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeMedications
                .filter(med => !dueMedications.includes(med))
                .map((medication) => (
                  <MedicationCard 
                    key={medication.id}
                    medication={medication}
                    onDelete={handleDelete}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedMedications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarCheck className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No completed medications</p>
                <p className="text-sm text-muted-foreground">
                  Completed medications will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedMedications.map((medication) => (
                <MedicationCard 
                  key={medication.id}
                  medication={medication}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discontinued" className="space-y-4">
          {discontinuedMedications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Ban className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No discontinued medications</p>
                <p className="text-sm text-muted-foreground">
                  Discontinued medications will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {discontinuedMedications.map((medication) => (
                <MedicationCard 
                  key={medication.id}
                  medication={medication}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}