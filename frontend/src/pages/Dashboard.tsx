import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import HODDashboard from './HODDashboard';

export default function Dashboard() {
  const { role } = useAuth();
  
  // Conditionally render the appropriate dashboard based on role
  if (role === 'hod') {
    return <HODDashboard />;
  }
  
  // Default to AdminDashboard (can be refined to handle Viewer, etc.)
  return <AdminDashboard />;
}
