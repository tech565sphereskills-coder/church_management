export type AppRole = 'admin' | 'attendance_officer' | 'finance_officer' | 'children_officer' | 'prayer_officer' | 'viewer';

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthContextType {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: (accessToken: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isOfficer: boolean;
  isFinanceOfficer: boolean;
  isChildrenOfficer: boolean;
  isPrayerOfficer: boolean;
  canManageAttendance: boolean;
  canManageFinances: boolean;
  canManageChildren: boolean;
  canManagePrayer: boolean;
  canManageMembers: boolean;
  canManageDepartments: boolean;
  canManageCalendar: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
}

export type PermissionKey = keyof Omit<AuthContextType, 'user' | 'role' | 'loading' | 'signIn' | 'signInWithGoogle' | 'signUp' | 'signOut' | 'isAdmin' | 'isOfficer' | 'isFinanceOfficer' | 'isChildrenOfficer' | 'isPrayerOfficer'>;
