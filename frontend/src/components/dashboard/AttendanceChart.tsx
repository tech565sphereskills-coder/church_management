import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
interface ChartData {
  date: string;
  attendance: number;
  service?: string;
}

interface AttendanceChartProps {
  data: ChartData[];
  title: string;
}

export function AttendanceChart({ data, title }: AttendanceChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="chart-container"
    >
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(350, 65%, 35%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(350, 65%, 35%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 20%, 88%)" />
            <XAxis
              dataKey="date"
              stroke="hsl(350, 10%, 45%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(350, 10%, 45%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(30, 20%, 88%)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Area
              type="monotone"
              dataKey="attendance"
              stroke="hsl(350, 65%, 35%)"
              strokeWidth={2}
              fill="url(#attendanceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
