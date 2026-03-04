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
import Children from "./pages/Children";
import PrayerRequests from "./pages/PrayerRequests";
import SubmitPrayer from "./pages/SubmitPrayer";
import ResetPassword from "./pages/ResetPassword";
import Calendar from "./pages/Calendar";
import AuditLogs from "./pages/AuditLogs";
import Notifications from "./pages/Notifications";
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
              <Route path="/submit-prayer" element={<SubmitPrayer />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/calendar" element={<ProtectedRoute requiredPermission="canManageCalendar" />}>
                    <Route index element={<Calendar />} />
                  </Route>
                  <Route path="/attendance" element={<ProtectedRoute requiredPermission="canManageAttendance" />}>
                    <Route index element={<Attendance />} />
                  </Route>
                  <Route path="/members" element={<ProtectedRoute requiredPermission="canManageMembers" />}>
                    <Route index element={<Members />} />
                  </Route>
                  <Route path="/members/:memberId" element={<ProtectedRoute requiredPermission="canManageMembers" />}>
                    <Route index element={<MemberProfile />} />
                  </Route>
                  <Route path="/history" element={<ProtectedRoute requiredPermission="canManageAttendance" />}>
                    <Route index element={<History />} />
                  </Route>
                  <Route path="/reports" element={<ProtectedRoute requiredPermission="canViewReports" />}>
                    <Route index element={<Reports />} />
                  </Route>
                  <Route path="/settings" element={<ProtectedRoute requiredPermission="canManageSettings" />}>
                    <Route index element={<Settings />} />
                  </Route>
                  <Route path="/audit-logs" element={<ProtectedRoute requiredRole="admin" />}>
                    <Route index element={<AuditLogs />} />
                  </Route>
                  <Route path="/user-management" element={<ProtectedRoute requiredRole="admin" />}>
                    <Route index element={<UserManagement />} />
                  </Route>
                  <Route path="/follow-up" element={<ProtectedRoute requiredPermission="canManageMembers" />}>
                    <Route index element={<FollowUp />} />
                  </Route>
                  <Route path="/messaging" element={<ProtectedRoute requiredPermission="canManageMembers" />}>
                    <Route index element={<Messaging />} />
                  </Route>
                  <Route path="/financials" element={<ProtectedRoute requiredPermission="canManageFinances" />}>
                    <Route index element={<Financials />} />
                  </Route>
                  <Route path="/departments" element={<Departments />} />
                  <Route path="/children" element={<ProtectedRoute requiredPermission="canManageChildren" />}>
                    <Route index element={<Children />} />
                  </Route>
                  <Route path="/prayer-requests" element={<ProtectedRoute requiredPermission="canManagePrayer" />}>
                    <Route index element={<PrayerRequests />} />
                  </Route>
                  <Route path="/notifications" element={<Notifications />} />
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
