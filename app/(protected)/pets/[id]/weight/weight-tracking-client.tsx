// app/(protected)/pets/[id]/weight/weight-tracking-client.tsx
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
  getDoc
} from 'firebase/firestore';
import { WeightRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Weight, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subMonths } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddWeightDialog } from '@/components/dialogs/AddWeightDialog';
import { WeightChart } from '@/components/charts/WeightChart';

interface WeightTrackingClientProps {
  petId: string;
}

export function WeightTrackingClient({ petId }: WeightTrackingClientProps) {
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6m'); // Options: 1m, 3m, 6m, 1y, all
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Calculate stats
  const stats = useMemo(() => {
    if (weights.length === 0) return null;

    const sortedWeights = [...weights].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latestWeight = sortedWeights[0];
    const previousWeight = sortedWeights[1];

    const change = previousWeight
      ? latestWeight.weight - previousWeight.weight
      : 0;

    const changePercent = previousWeight
      ? (change / previousWeight.weight) * 100
      : 0;

    return {
      latest: latestWeight,
      change,
      changePercent,
      total: weights.length,
    };
  }, [weights]);

  // Filter weights based on time range
  const filteredWeights = useMemo(() => {
    if (timeRange === 'all') return weights;

    const months = {
      '1m': 1,
      '3m': 3,
      '6m': 6,
      '1y': 12,
    }[timeRange] || 6;

    const cutoffDate = subMonths(new Date(), months);
    return weights.filter(weight =>
      new Date(weight.date) >= cutoffDate
    );
  }, [weights, timeRange]);

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

    const setupWeightRecords = async () => {
      const hasAccess = await verifyPetOwnership();
      if (!hasAccess) return;

      const weightsQuery = query(
        collection(db, 'weights'),
        where('petId', '==', petId),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(
        weightsQuery,
        (snapshot) => {
          const weightsData: WeightRecord[] = [];
          snapshot.forEach((doc) => {
            weightsData.push({ id: doc.id, ...doc.data() } as WeightRecord);
          });
          setWeights(weightsData);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching weight records:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load weight records. Please try again."
          });
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    };

    setupWeightRecords();
  }, [petId, user, toast, router]);

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
          <h1 className="text-3xl font-bold">Weight Tracking</h1>
          <p className="text-muted-foreground">
            Monitor your pet&apos;s weight over time
          </p>
        </div>
        <AddWeightDialog petId={petId}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Weight
          </Button>
        </AddWeightDialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Latest Weight
              </CardTitle>
              <Weight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.latest.weight} {stats.latest.unit}
              </div>
              <p className="text-xs text-muted-foreground">
                Recorded on {format(new Date(stats.latest.date), 'MMM d, yyyy')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Weight Change
              </CardTitle>
              {stats.change === 0 ? (
                <Minus className="h-4 w-4 text-muted-foreground" />
              ) : stats.change > 0 ? (
                <ArrowUp className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)} {stats.latest.unit}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.changePercent > 0 ? '+' : ''}
                {stats.changePercent.toFixed(1)}% from previous
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Records
              </CardTitle>
              <Weight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Weight measurements
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weight Chart */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Weight History</h2>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-[400px]">
          <WeightChart data={filteredWeights} />
        </div>
      </Card>

      {/* Recent Weight Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredWeights.map((weight) => (
              <div
                key={weight.id}
                className="flex justify-between items-center py-3 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">
                    {weight.weight} {weight.unit}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(weight.date), 'PPP')}
                  </p>
                </div>
                {weight.notes && (
                  <p className="text-sm text-muted-foreground max-w-[50%] text-right">
                    {weight.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}