import { lazy, Suspense } from 'react';
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { SplashScreen } from "./components/common/SplashScreen";
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

// Main pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Members = lazy(() => import("./pages/Members"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const History = lazy(() => import("./pages/History"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const FollowUp = lazy(() => import("./pages/FollowUp"));
const Messaging = lazy(() => import("./pages/Messaging"));
const Financials = lazy(() => import("./pages/Financials"));
const Departments = lazy(() => import("./pages/Departments"));
const DepartmentReports = lazy(() => import("./pages/DepartmentReports"));
const Ministers = lazy(() => import("./pages/Ministers"));
const Family = lazy(() => import("./pages/Family"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Auth = lazy(() => import("./pages/Auth"));
const Children = lazy(() => import("./pages/Children"));
const PrayerRequests = lazy(() => import("./pages/PrayerRequests"));
const SubmitPrayer = lazy(() => import("./pages/SubmitPrayer"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Calendar = lazy(() => import("./pages/Calendar"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const BirthdayManager = lazy(() => import("./pages/BirthdayManager"));
const Notifications = lazy(() => import("./pages/Notifications"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const AddMember = lazy(() => import("./pages/AddMember"));
const PublicRegister = lazy(() => import("./pages/PublicRegister"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-black uppercase tracking-widest text-slate-400">Loading Sanctuary...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <BrowserRouter>
              <AuthProvider>
                <Toaster />
                <Sonner />
                
                <AnimatePresence mode="wait">
                  {isInitializing ? (
                    <SplashScreen key="splash" onComplete={() => setIsInitializing(false)} />
                  ) : (
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Public route */}
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/submit-prayer" element={<SubmitPrayer />} />
                        <Route path="/check-in" element={<CheckIn />} />
                        <Route path="/register" element={<PublicRegister />} />
                        
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
                              <Route path="add" element={<AddMember />} />
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
                            <Route path="/departments/reports" element={<ProtectedRoute requiredPermission="canViewReports" />}>
                              <Route index element={<DepartmentReports />} />
                            </Route>
                            <Route path="/ministers" element={<ProtectedRoute requiredPermission="canManageDepartments" />}>
                              <Route index element={<Ministers />} />
                            </Route>
                            <Route path="/family" element={<Family />} />
                            <Route path="/inventory" element={<Inventory />} />
                            <Route path="/children" element={<ProtectedRoute requiredPermission="canManageChildren" />}>
                              <Route index element={<Children />} />
                            </Route>
                            <Route path="/prayer-requests" element={<ProtectedRoute requiredPermission="canManagePrayer" />}>
                              <Route index element={<PrayerRequests />} />
                            </Route>
                            <Route path="/birthdays" element={<ProtectedRoute requiredPermission="canManageMembers" />}>
                              <Route index element={<BirthdayManager />} />
                            </Route>
                            <Route path="/notifications" element={<Notifications />} />
                          </Route>
                        </Route>
                        
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  )}
                </AnimatePresence>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
};

export default App;
