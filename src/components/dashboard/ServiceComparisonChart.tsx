import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface ServiceData {
  month: string;
  sunday: number;
  midweek: number;
  special: number;
}

export function ServiceComparisonChart() {
  const [data, setData] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          months.push({
            start: startOfMonth(date),
            end: endOfMonth(date),
            label: format(date, 'MMM'),
          });
        }

        const { data: records } = await supabase
          .from('attendance_records')
          .select('marked_at, services:service_id(service_type)')
          .gte('marked_at', months[0].start.toISOString());

        const result: ServiceData[] = months.map(({ start, end, label }) => {
          const inRange = (records || []).filter((r: any) => {
            const d = new Date(r.marked_at);
            return d >= start && d <= end;
          });
          return {
            month: label,
            sunday: inRange.filter((r: any) => r.services?.service_type === 'sunday_service').length,
            midweek: inRange.filter((r: any) => r.services?.service_type === 'midweek_service').length,
            special: inRange.filter((r: any) => r.services?.service_type === 'special_program').length,
          };
        });

        setData(result);
      } catch (e) {
        console.error('Error fetching service comparison:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance by Service Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="sunday" name="Sunday" fill="hsl(210, 80%, 35%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="midweek" name="Midweek" fill="hsl(145, 70%, 35%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="special" name="Special" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
