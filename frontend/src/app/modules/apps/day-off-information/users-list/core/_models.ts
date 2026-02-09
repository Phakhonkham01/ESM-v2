// src/app/modules/_requests/models/dayoffrequest.model.ts
import { ID, Response } from '../../../../../../_metronic/helpers'
import { User } from '../../../user-management/users-list/core/_models'

// ✅ DayOffRequest Type
export interface DayOffRequest {
  _id?: string
  id?: ID
  user_id: string | User
  supervisor_id: string | string[] | User | User[]
  employee_id: string | User
  day_off_type: 'FULL_DAY' | 'HALF_DAY'
  start_date_time: Date | string
  end_date_time: Date | string
  date_off_number: number
  title: string
  status: 'Pending' | 'Accepted' | 'Rejected'
  created_at?: Date | string
  updated_at?: Date | string
}

// ✅ Formatted Request สำหรับตาราง
export interface FormattedDayOffRequest {
  _id: string
  user_id: string
  user_name: string
  employee_id: string
  employee_name: string
  employee_email: string
  supervisor_id: string | string[]
  supervisor_name: string | string[]
  supervisor_email: string | string[]
  day_off_type: 'FULL_DAY' | 'HALF_DAY'
  start_date_time: Date | string
  end_date_time: Date | string
  date_off_number: number
  title: string
  status: 'Pending' | 'Accepted' | 'Rejected'
  created_at: Date | string
  statusColor: 'warning' | 'success' | 'danger'
  day_off_type_label: string
}

// ✅ Request DTO สำหรับการสร้าง - แก้ไขเพิ่ม date_off_number
export interface DayOffRequestDTO {
  user_id: string
  supervisor_id: string | string[];
  employee_id: string
  day_off_type: 'FULL_DAY' | 'HALF_DAY'
  start_date_time: string
  end_date_time: string
  date_off_number: number  // <-- เพิ่ม property นี้
  title: string
}

// ✅ สำหรับการอัพเดตสถานะ
export interface UpdateStatusDTO {
  status: 'Pending' | 'Accepted' | 'Rejected'
}

// ✅ Query Parameters
export interface DayOffRequestQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  startDate?: string
  endDate?: string
  userId?: string
  supervisorId?: string
}

// ✅ Response Types
export type DayOffRequestsQueryResponse = Response<DayOffRequest[]>
export type DayOffRequestResponse = Response<DayOffRequest>

// ✅ Initial Values - แก้ไขเพิ่ม date_off_number
export const initialDayOffRequest: DayOffRequestDTO = {
  user_id: '',
  supervisor_id: [],
  employee_id: '',
  day_off_type: 'FULL_DAY',
  start_date_time: new Date().toISOString(),
  end_date_time: new Date().toISOString(),
  date_off_number: 0,  // <-- เพิ่ม property นี้
  title: '',
}

// ✅ Status Options สำหรับ Dropdown
export const statusOptions = [
  { value: 'Pending', label: 'Pending', color: 'warning' },
  { value: 'Accepted', label: 'Accepted', color: 'success' },
  { value: 'Rejected', label: 'Rejected', color: 'danger' },
]

// ✅ Day Off Type Options
export const dayOffTypeOptions = [
  { value: 'FULL_DAY', label: 'Full Day' },
  { value: 'HALF_DAY', label: 'Half Day' },
]

// ✅ Helper Functions
export const formatDayOffRequest = (request: DayOffRequest): FormattedDayOffRequest => {
  // Extract user info
  const extractUserInfo = (userField: any) => {
    if (!userField) {
      return { id: '', name: 'Unknown', email: '' }
    }

    if (typeof userField === 'string') {
      // ถ้าเป็น string (ObjectId) แต่ยังไม่ได้ populate
      return { id: userField, name: 'N/A', email: '' }
    }

    // ถ้าเป็น ObjectId object จาก MongoDB
    if (userField && typeof userField === 'object' && userField._bsontype === 'ObjectId') {
      return { id: userField.toString(), name: 'N/A', email: '' }
    }

    // ถ้าเป็น User object ที่ populate มาแล้ว
    if (userField && typeof userField === 'object') {
      return {
        id: userField.id || userField._id || '',
        name: userField.user_name ||
          `${userField.first_name_en || ''} ${userField.last_name_en || ''}`.trim() ||
          userField.name ||
          'Unknown',
        email: userField.user_email || userField.email || ''
      }
    }

    return { id: '', name: 'Unknown', email: '' }
  }

  // Extract employee info
  const employeeInfo = extractUserInfo(request.employee_id)

  // Extract supervisor info
  let supervisorInfo
  if (Array.isArray(request.supervisor_id)) {
    supervisorInfo = request.supervisor_id.map(sup => extractUserInfo(sup))
  } else {
    supervisorInfo = extractUserInfo(request.supervisor_id)
  }

  // Extract user info
  const userInfo = extractUserInfo(request.user_id)

  // Get status color
  const getStatusColor = (status: string): 'warning' | 'success' | 'danger' => {
    switch (status) {
      case 'Pending': return 'warning'
      case 'Accepted': return 'success'
      case 'Rejected': return 'danger'
      default: return 'warning'
    }
  }

  return {
    _id: request._id || request.id || '',
    user_id: userInfo.id,
    user_name: userInfo.name,
    employee_id: employeeInfo.id,
    employee_name: employeeInfo.name,
    employee_email: employeeInfo.email,
    supervisor_id: Array.isArray(supervisorInfo)
      ? supervisorInfo.map(s => s.id)
      : supervisorInfo.id,
    supervisor_name: Array.isArray(supervisorInfo)
      ? supervisorInfo.map(s => s.name).join(', ')
      : supervisorInfo.name,
    supervisor_email: Array.isArray(supervisorInfo)
      ? supervisorInfo.map(s => s.email).join(', ')
      : supervisorInfo.email,
    day_off_type: request.day_off_type,
    start_date_time: request.start_date_time,
    end_date_time: request.end_date_time,
    date_off_number: request.date_off_number || 0,
    title: request.title,
    status: request.status,
    created_at: request.created_at || new Date(),
    statusColor: getStatusColor(request.status),
    day_off_type_label: request.day_off_type === 'FULL_DAY' ? 'Full Day' : 'Half Day'
  }
}

// ✅ Calculate date off number
export const calculateDateOffNumber = (
  dayOffType: 'FULL_DAY' | 'HALF_DAY',
  startDate: Date,
  endDate: Date
): number => {
  if (dayOffType === 'HALF_DAY') {
    return 0.5
  }

  if (dayOffType === 'FULL_DAY') {
    const diffTime = endDate.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // inclusive
  }

  return 0
}

// ✅ Filter functions
export const filterRequestsByStatus = (
  requests: FormattedDayOffRequest[],
  status: string
): FormattedDayOffRequest[] => {
  if (!status || status === 'All') return requests
  return requests.filter(req => req.status === status)
}

export const sortRequestsByDate = (
  requests: FormattedDayOffRequest[],
  order: 'asc' | 'desc' = 'desc'
): FormattedDayOffRequest[] => {
  return [...requests].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return order === 'asc' ? dateA - dateB : dateB - dateA
  })
}