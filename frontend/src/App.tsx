import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Members from "./pages/Members";
import MemberProfile from "./pages/MemberProfile";
import History from "./pages/History";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import FollowUp from "./pages/FollowUp";
import Messaging from "./pages/Messaging";
import Financials from "./pages/Financials";
import Departments from "./pages/Departments";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public route */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/members" element={<Members />} />
                  <Route path="/members/:memberId" element={<MemberProfile />} />
                  <Route path="/history" element={<ProtectedRoute requiredRole="attendance_officer" />}>
                    <Route index element={<History />} />
                  </Route>
                  <Route path="/reports" element={<ProtectedRoute requiredRole="attendance_officer" />}>
                    <Route index element={<Reports />} />
                  </Route>
                  <Route path="/settings" element={<ProtectedRoute requiredRole="admin" />}>
                    <Route index element={<Settings />} />
                  </Route>
                  <Route path="/user-management" element={<ProtectedRoute requiredRole="admin" />}>
                    <Route index element={<UserManagement />} />
                  </Route>
                  <Route path="/follow-up" element={<ProtectedRoute requiredRole="attendance_officer" />}>
                    <Route index element={<FollowUp />} />
                  </Route>
                  <Route path="/messaging" element={<ProtectedRoute requiredRole="attendance_officer" />}>
                    <Route index element={<Messaging />} />
                  </Route>
                  <Route path="/financials" element={<ProtectedRoute requiredRole={['admin', 'finance_officer']} />}>
                    <Route index element={<Financials />} />
                  </Route>
                  <Route path="/departments" element={<Departments />} />
                </Route>
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
