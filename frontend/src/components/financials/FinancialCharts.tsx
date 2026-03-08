import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Contribution, Expense } from '@/hooks/useFinancials';

interface FinancialChartsProps {
  contributions: Contribution[];
  expenses: Expense[];
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export function FinancialCharts({ contributions, expenses }: FinancialChartsProps) {
  // Process data for trend chart (Income vs Expenses by month)
  const processTrendData = () => {
    const months: Record<string, { month: string; income: number; expense: number }> = {};
    
    contributions.forEach(c => {
      const m = format(parseISO(c.date), 'MMM yy');
      if (!months[m]) months[m] = { month: m, income: 0, expense: 0 };
      months[m].income += parseFloat(c.amount);
    });
    
    expenses.forEach(e => {
      const m = format(parseISO(e.date), 'MMM yy');
      if (!months[m]) months[m] = { month: m, income: 0, expense: 0 };
      months[m].expense += parseFloat(e.amount);
    });
    
    return Object.values(months).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Process data for category distribution
  const processCategoryData = () => {
    const categories: Record<string, number> = {};
    contributions.forEach(c => {
      const cat = c.contribution_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      categories[cat] = (categories[cat] || 0) + parseFloat(c.amount);
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const trendData = processTrendData();
  const categoryData = processCategoryData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card className="border-none shadow-premium bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Financial Trends</CardTitle>
          <CardDescription>Monthly Income vs Expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `₦${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₦${parseFloat(value as string).toLocaleString()}`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                  name="Income"
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-premium bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Contribution Breakdown</CardTitle>
          <CardDescription>Distribution by Type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => `₦${parseFloat(value as string).toLocaleString()}`}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
