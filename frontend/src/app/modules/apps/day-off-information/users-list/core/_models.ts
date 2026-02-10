// src/app/modules/_requests/models/dayoffrequest.model.ts
import { ID, Response } from '../../../../../../_metronic/helpers'
import { User } from '../../../user-management/users-list/core/_models'

// ✅ Base DayOffRequest Type
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
  reason?: string
  created_at?: Date | string
  updated_at?: Date | string
}

// ✅ Formatted Request สำหรับตาราง - EXTENDS DayOffRequest
export interface FormattedDayOffRequest extends DayOffRequest {
  _id: string
  user_name: string
  employee_name: string
  employee_email: string
  supervisor_name: string | string[]
  supervisor_email?: string | string[]
  department_name: any
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
  date_off_number: number
  title: string
  reason?: string
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

// ✅ Initial Values
export const initialDayOffRequest: DayOffRequestDTO = {
  user_id: '',
  supervisor_id: [],
  employee_id: '',
  day_off_type: 'FULL_DAY',
  start_date_time: new Date().toISOString(),
  end_date_time: new Date().toISOString(),
  date_off_number: 0,
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
      return { id: userField, name: 'N/A', email: '' }
    }

    if (userField && typeof userField === 'object' && userField._bsontype === 'ObjectId') {
      return { id: userField.toString(), name: 'N/A', email: '' }
    }

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

  // สร้าง department name จาก supervisor หรือ employee info
  const getDepartmentName = (): string | string[] => {
    // ตัวอย่าง: ถ้ามี department data ให้ดึงจากที่นี่
    // ตอนนี้ใช้ supervisor IDs เป็น placeholder
    if (Array.isArray(supervisorInfo)) {
      return supervisorInfo.map(s => s.id)
    }
    return supervisorInfo.id
  }

  const formatted: FormattedDayOffRequest = {
    // คัดลอก properties จาก DayOffRequest
    ...request,
    _id: request._id || request.id || '',
    id: request.id || request._id,
    
    // เพิ่ม formatted properties
    user_name: userInfo.name,
    employee_name: employeeInfo.name,
    employee_email: employeeInfo.email,
    supervisor_name: Array.isArray(supervisorInfo)
      ? supervisorInfo.map(s => s.name).join(', ')
      : supervisorInfo.name,
    supervisor_email: Array.isArray(supervisorInfo)
      ? supervisorInfo.map(s => s.email).join(', ')
      : supervisorInfo.email,
    department_name: getDepartmentName(),
    statusColor: getStatusColor(request.status),
    day_off_type_label: request.day_off_type === 'FULL_DAY' ? 'Full Day' : 'Half Day'
  }

  return formatted
}