'use client';

import { WeightRecord } from '@/types';
import {
 Line,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 ReferenceLine,
 Legend,
 Area,
 ComposedChart,
 TooltipProps,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface WeightChartProps {
 data: WeightRecord[];
}

export function WeightChart({ data }: WeightChartProps) {
 const { chartData, average, minWeight, maxWeight } = useMemo(() => {
   const sortedData = [...data].sort(
     (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
   );

   const weights = sortedData.map((d) => d.weight);
   const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
   const min = Math.min(...weights);
   const max = Math.max(...weights);

   const movingAverage = (index: number, arr: WeightRecord[]) => {
     const windowSize = 7;
     const start = Math.max(0, index - windowSize + 1);
     const window = arr.slice(start, index + 1);
     return window.reduce((sum, record) => sum + record.weight, 0) / window.length;
   };

   const chartData = sortedData.map((record, index) => ({
     date: record.date,
     weight: record.weight,
     ma7: movingAverage(index, sortedData),
     unit: record.unit,
   }));

   return {
     chartData,
     average: avg,
     minWeight: min,
     maxWeight: max,
   };
 }, [data]);

 const yDomain = useMemo(() => {
   const padding = (maxWeight - minWeight) * 0.1;
   return [Math.max(0, minWeight - padding), maxWeight + padding];
 }, [minWeight, maxWeight]);

 const CustomTooltip = ({ 
   active, 
   payload, 
   label 
 }: TooltipProps<number, string>) => {
   if (active && payload && payload.length) {
     return (
       <div className="bg-background border rounded-lg shadow-lg p-3">
         <p className="font-medium">{format(parseISO(label), 'PPP')}</p>
         <p className="text-blue-600">
           Weight: {payload[0].value?.toFixed(1)} {payload[0].payload.unit}
         </p>
         {payload[1] && (
           <p className="text-orange-500">
             7-day avg: {payload[1].value?.toFixed(1)} {payload[0].payload.unit}
           </p>
         )}
       </div>
     );
   }
   return null;
 };

 if (data.length === 0) {
   return (
     <Card className="h-full flex items-center justify-center">
       <CardContent className="text-center">
         <p className="text-muted-foreground">No weight records available</p>
       </CardContent>
     </Card>
   );
 }

 return (
   <Card>
     <CardHeader className="text-center">
       <h2 className="text-lg font-bold">Weight Tracking</h2>
       <p className="text-muted-foreground">Monitor your weight trends over time</p>
     </CardHeader>
     <CardContent className="h-96">
       <ResponsiveContainer width="100%" height="100%">
         <ComposedChart
           data={chartData}
           margin={{
             top: 20,
             right: 30,
             left: 20,
             bottom: 20,
           }}
         >
           <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
           <XAxis
             dataKey="date"
             tickFormatter={(date) => format(parseISO(date), 'MMM d')}
             tick={{ fill: '#888' }}
           />
           <YAxis
             domain={yDomain}
             label={{
               value: `Weight (${data[0]?.unit})`,
               angle: -90,
               position: 'insideLeft',
               style: { fill: '#888' },
             }}
             tick={{ fill: '#888' }}
           />
           <Tooltip content={<CustomTooltip />} />
           <Legend />

           <ReferenceLine
             y={average}
             label={{
               value: 'Average',
               position: 'right',
               fill: '#888',
             }}
             stroke="#888"
             strokeDasharray="3 3"
           />

           <Area
             type="monotone"
             dataKey="weight"
             fill="rgb(37, 99, 235, 0.1)"
             strokeWidth={0}
           />

           <Line
             type="monotone"
             dataKey="ma7"
             stroke="#f97316"
             strokeWidth={2}
             dot={false}
             name="7-day average"
           />

           <Line
             type="monotone"
             dataKey="weight"
             stroke="#2563eb"
             strokeWidth={2}
             dot={{
               stroke: '#2563eb',
               strokeWidth: 2,
               r: 4,
               fill: 'white',
             }}
             activeDot={{
               stroke: '#2563eb',
               strokeWidth: 2,
               r: 6,
               fill: 'white',
             }}
             name="Weight"
           />
         </ComposedChart>
       </ResponsiveContainer>
     </CardContent>
   </Card>
 );
}