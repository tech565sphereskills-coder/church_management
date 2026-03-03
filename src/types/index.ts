// Member types
export type MemberStatus = 'active' | 'inactive' | 'first-timer';
export type Gender = 'male' | 'female';
export type UserRole = 'admin' | 'attendance_officer' | 'viewer';

export interface Member {
  id: string;
  fullName: string;
  phone: string;
  gender: Gender;
  department: string;
  dateJoined: string;
  status: MemberStatus;
  invitedBy?: string;
  photoUrl?: string;
  email?: string;
  address?: string;
}

// Attendance types
export type ServiceType = 'sunday_service' | 'midweek_service' | 'special_program';

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  serviceDate: string;
  serviceType: ServiceType;
  timestamp: string;
  markedBy: string;
}

// User types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
}

// Stats types
export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  todayAttendance: number;
  newThisMonth: number;
  attendanceGrowth: number;
  memberGrowth: number;
}

// Chart data types
export interface AttendanceChartData {
  date: string;
  attendance: number;
  service: string;
}

export interface MemberGrowthData {
  month: string;
  newMembers: number;
  totalMembers: number;
}
