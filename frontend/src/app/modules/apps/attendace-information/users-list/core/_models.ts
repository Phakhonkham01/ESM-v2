import { ID, Response } from '../../../../../../_metronic/helpers'

// ✅ ประกาศ interface สำหรับ Department
export interface Department {
  _id?: string
  id?: string
  department_name: string
  created_at?: Date
  updated_at?: Date
}

// ✅ ประกาศ interface สำหรับ Position
export interface Position {
  _id?: string
  id?: string
  position_name: string
  department_id: string | Department
  created_at?: Date
  updated_at?: Date
}

// ✅ Types สำหรับ Department และ Position
export type DepartmentIdType = 
  | string 
  | string[] 
  | Department 
  | Department[]
  | null
  | undefined

export type PositionIdType = 
  | string 
  | Position 
  | null
  | undefined

// ✅ Attendance Record Interface
export interface AttendanceRecord {
  id?: ID
  user_id: string
  date: string
  check_in: string | null
  check_out: string | null
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave'
  total_hours: number
  overtime_hours: number
  notes?: string
  created_at?: Date
  updated_at?: Date
}

// ✅ User Interface สำหรับ Attendance System
export type User = {
  id?: ID
  _id?: string
  user_id: string
  employee_id: string
  user_name: string
  user_email: string
  password?: string
  role: 'admin' | 'employee' | 'supervisor'
  department_id?: DepartmentIdType
  position_id?: PositionIdType
  leave_days: number
  used_leave_days: number
  remaining_leave_days: number
  status: 'Active' | 'Inactive' | 'On Leave'
  
  // Personal Information
  first_name_en: string
  last_name_en: string
  nickname_en?: string
  first_name_la: string
  last_name_la: string
  nickname_la?: string
  date_of_birth: string
  start_work: string
  gender: 'Male' | 'Female' | 'Other'
  
  // Salary Information
  base_salary?: number
  hourly_rate?: number
  overtime_rate?: number
  
  // Contact Information
  phone_number?: string
  address?: string
  emergency_contact?: string
  
  // Attendance Statistics
  total_working_days: number
  total_absent_days: number
  total_late_days: number
  average_working_hours: number
  last_attendance_date?: string
  
  created_at?: Date
  updated_at?: Date
}

// ✅ Attendance Summary Interface
export interface AttendanceSummary {
  user_id: string
  month: number
  year: number
  total_working_days: number
  total_present_days: number
  total_absent_days: number
  total_late_days: number
  total_leave_days: number
  total_overtime_hours: number
  average_daily_hours: number
  attendance_rate: number
}

// ✅ Leave Request Interface
export interface LeaveRequest {
  id?: ID
  user_id: string
  leave_type: 'sick_leave' | 'annual_leave' | 'personal_leave' | 'maternity_leave' | 'paternity_leave'
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  approved_by?: string
  approved_date?: string
  notes?: string
  created_at?: Date
  updated_at?: Date
}

// ✅ Overtime Request Interface
export interface OvertimeRequest {
  id?: ID
  user_id: string
  date: string
  start_time: string
  end_time: string
  total_hours: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_date?: string
  created_at?: Date
  updated_at?: Date
}

// ✅ Response Types
export type UsersQueryResponse = Response<Array<User>>
export type AttendanceQueryResponse = Response<Array<AttendanceRecord>>
export type AttendanceSummaryResponse = Response<AttendanceSummary>
export type LeaveRequestsQueryResponse = Response<Array<LeaveRequest>>
export type OvertimeQueryResponse = Response<Array<OvertimeRequest>>

// ✅ Initial Values
export const initialUser: User = {
  user_id: '',
  employee_id: '',
  user_name: '',
  user_email: '',
  role: 'employee',
  department_id: null,
  position_id: null,
  leave_days: 15,
  used_leave_days: 0,
  remaining_leave_days: 15,
  status: 'Active',
  
  // Personal Information
  first_name_en: '',
  last_name_en: '',
  nickname_en: '',
  first_name_la: '',
  last_name_la: '',
  nickname_la: '',
  date_of_birth: '',
  start_work: '',
  gender: 'Male',
  
  // Salary Information
  base_salary: 0,
  hourly_rate: 0,
  overtime_rate: 0,
  
  // Attendance Statistics
  total_working_days: 0,
  total_absent_days: 0,
  total_late_days: 0,
  average_working_hours: 0,
}

export const initialAttendance: AttendanceRecord = {
  user_id: '',
  date: new Date().toISOString().split('T')[0],
  check_in: null,
  check_out: null,
  status: 'absent',
  total_hours: 0,
  overtime_hours: 0,
}

export const initialLeaveRequest: LeaveRequest = {
  user_id: '',
  leave_type: 'annual_leave',
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date().toISOString().split('T')[0],
  total_days: 1,
  reason: '',
  status: 'pending',
}

export const initialOvertimeRequest: OvertimeRequest = {
  user_id: '',
  date: new Date().toISOString().split('T')[0],
  start_time: '18:00',
  end_time: '20:00',
  total_hours: 2,
  reason: '',
  status: 'pending',
}

// ✅ Helper Functions
export const extractDepartmentId = (departmentId: DepartmentIdType): string | string[] | null => {
  if (!departmentId) return null
  
  if (Array.isArray(departmentId)) {
    return departmentId.map(dept => 
      typeof dept === 'string' ? dept : dept._id || dept.id || ''
    ).filter(Boolean) as string[]
  }
  
  if (typeof departmentId === 'object' && departmentId !== null) {
    return departmentId._id || departmentId.id || ''
  }
  
  return departmentId as string
}

export const extractPositionId = (positionId: PositionIdType): string | null => {
  if (!positionId) return null
  
  if (typeof positionId === 'object' && positionId !== null) {
    return positionId._id || positionId.id || ''
  }
  
  return positionId as string
}

export const isDepartmentObject = (dept: unknown): dept is Department => {
  return typeof dept === 'object' && dept !== null && 'department_name' in dept
}

export const isPositionObject = (pos: unknown): pos is Position => {
  return typeof pos === 'object' && pos !== null && 'position_name' in pos
}

// ✅ Attendance Status Helper
export const getAttendanceStatusColor = (status: string): string => {
  switch (status) {
    case 'present': return 'success'
    case 'absent': return 'danger'
    case 'late': return 'warning'
    case 'half_day': return 'primary'
    case 'leave': return 'info'
    default: return 'secondary'
  }
}

export const getLeaveStatusColor = (status: string): string => {
  switch (status) {
    case 'approved': return 'success'
    case 'pending': return 'warning'
    case 'rejected': return 'danger'
    case 'cancelled': return 'secondary'
    default: return 'secondary'
  }
}

// ✅ Calculate Working Hours
export const calculateWorkingHours = (checkIn: string, checkOut: string): number => {
  if (!checkIn || !checkOut) return 0
  
  const start = new Date(`1970-01-01T${checkIn}:00`)
  const end = new Date(`1970-01-01T${checkOut}:00`)
  
  const diffMs = end.getTime() - start.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  
  return Math.max(0, diffHours)
}

// ✅ Format Date for Display
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// ✅ Get Current Month and Year
export const getCurrentMonthYear = () => {
  const now = new Date()
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  }
}