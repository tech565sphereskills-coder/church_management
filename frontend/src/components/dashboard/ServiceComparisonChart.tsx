import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
        setLoading(true);
        const response = await api.get('/stats/service_comparison/');
        setData(response.data);
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
                    borderRadius: '12px',
                    boxShadow: 'hsl(var(--shadow-lg))',
                  }}
                />
                <Legend />
                <Bar dataKey="sunday" name="Sunday" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="midweek" name="Midweek" fill="hsl(var(--rccg-green))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="special" name="Special" fill="hsl(var(--warning))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
