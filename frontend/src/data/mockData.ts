import { Member, AttendanceRecord, DashboardStats, AttendanceChartData, MemberGrowthData } from '@/types';

export const mockMembers: Member[] = [
  {
    id: '1',
    fullName: 'Adebayo Ogunlesi',
    phone: '+234 801 234 5678',
    gender: 'male',
    department: 'Choir',
    dateJoined: '2023-01-15',
    status: 'active',
  },
  {
    id: '2',
    fullName: 'Chioma Nwosu',
    phone: '+234 802 345 6789',
    gender: 'female',
    department: 'Ushering',
    dateJoined: '2023-02-20',
    status: 'active',
  },
  {
    id: '3',
    fullName: 'Emmanuel Okoro',
    phone: '+234 803 456 7890',
    gender: 'male',
    department: 'Media',
    dateJoined: '2023-03-10',
    status: 'active',
  },
  {
    id: '4',
    fullName: 'Funke Adeyemi',
    phone: '+234 804 567 8901',
    gender: 'female',
    department: 'Children',
    dateJoined: '2023-04-05',
    status: 'first-timer',
    invitedBy: 'Chioma Nwosu',
  },
  {
    id: '5',
    fullName: 'Gbenga Afolabi',
    phone: '+234 805 678 9012',
    gender: 'male',
    department: 'Protocol',
    dateJoined: '2023-05-12',
    status: 'active',
  },
  {
    id: '6',
    fullName: 'Halima Bello',
    phone: '+234 806 789 0123',
    gender: 'female',
    department: 'Welfare',
    dateJoined: '2023-06-18',
    status: 'inactive',
  },
  {
    id: '7',
    fullName: 'Ibrahim Yusuf',
    phone: '+234 807 890 1234',
    gender: 'male',
    department: 'Technical',
    dateJoined: '2023-07-22',
    status: 'active',
  },
  {
    id: '8',
    fullName: 'Joy Eze',
    phone: '+234 808 901 2345',
    gender: 'female',
    department: 'Prayer',
    dateJoined: '2023-08-30',
    status: 'active',
  },
  {
    id: '9',
    fullName: 'Kunle Bakare',
    phone: '+234 809 012 3456',
    gender: 'male',
    department: 'Evangelism',
    dateJoined: '2024-01-05',
    status: 'first-timer',
  },
  {
    id: '10',
    fullName: 'Lara Okonkwo',
    phone: '+234 810 123 4567',
    gender: 'female',
    department: 'Drama',
    dateJoined: '2024-01-20',
    status: 'active',
  },
];

export const mockTodayAttendance: AttendanceRecord[] = [
  {
    id: 'a1',
    memberId: '1',
    memberName: 'Adebayo Ogunlesi',
    serviceDate: new Date().toISOString().split('T')[0],
    serviceType: 'sunday_service',
    timestamp: new Date().toISOString(),
    markedBy: 'admin',
  },
  {
    id: 'a2',
    memberId: '2',
    memberName: 'Chioma Nwosu',
    serviceDate: new Date().toISOString().split('T')[0],
    serviceType: 'sunday_service',
    timestamp: new Date().toISOString(),
    markedBy: 'admin',
  },
  {
    id: 'a3',
    memberId: '3',
    memberName: 'Emmanuel Okoro',
    serviceDate: new Date().toISOString().split('T')[0],
    serviceType: 'sunday_service',
    timestamp: new Date().toISOString(),
    markedBy: 'admin',
  },
];

export const mockDashboardStats: DashboardStats = {
  totalMembers: 245,
  activeMembers: 198,
  todayAttendance: 156,
  newThisMonth: 12,
  attendanceGrowth: 8.5,
  memberGrowth: 4.2,
};

export const mockWeeklyAttendance: AttendanceChartData[] = [
  { date: 'Week 1', attendance: 142, service: 'Sunday' },
  { date: 'Week 2', attendance: 158, service: 'Sunday' },
  { date: 'Week 3', attendance: 135, service: 'Sunday' },
  { date: 'Week 4', attendance: 168, service: 'Sunday' },
  { date: 'Week 5', attendance: 156, service: 'Sunday' },
];

export const mockMonthlyAttendance: AttendanceChartData[] = [
  { date: 'Jan', attendance: 520, service: 'All' },
  { date: 'Feb', attendance: 580, service: 'All' },
  { date: 'Mar', attendance: 610, service: 'All' },
  { date: 'Apr', attendance: 590, service: 'All' },
  { date: 'May', attendance: 640, service: 'All' },
  { date: 'Jun', attendance: 680, service: 'All' },
];

export const mockMemberGrowth: MemberGrowthData[] = [
  { month: 'Jan', newMembers: 8, totalMembers: 210 },
  { month: 'Feb', newMembers: 12, totalMembers: 222 },
  { month: 'Mar', newMembers: 6, totalMembers: 228 },
  { month: 'Apr', newMembers: 10, totalMembers: 238 },
  { month: 'May', newMembers: 5, totalMembers: 243 },
  { month: 'Jun', newMembers: 2, totalMembers: 245 },
];

export const departments = [
  'Choir',
  'Ushering',
  'Media',
  'Children',
  'Protocol',
  'Welfare',
  'Technical',
  'Prayer',
  'Evangelism',
  'Drama',
  'Youth',
  'Men',
  'Women',
  'Teens',
];

export const serviceTypes = [
  { value: 'sunday_service', label: 'Sunday Service' },
  { value: 'midweek_service', label: 'Midweek Service' },
  { value: 'special_program', label: 'Special Program' },
];
