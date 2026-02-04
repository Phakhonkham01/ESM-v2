// src/app/modules/_requests/models/requestOTFieldWork.model.ts
import {ID, Response} from '../../../../../../_metronic/helpers'
import { User } from '../../../user-management/users-list/core/_models'

// ✅ RequestOTFieldWork Type
export interface RequestOTFieldWork {
  _id?: string
  id?: ID
  user_id: string | User
  supervisor_id: string | string[] | User | User[]
  date: Date | string
  title: 'OT' | 'FIELD_WORK'
  start_hour: string
  end_hour: string
  fuel: number
  date_off?: Date | string | null
  description?: string
  reason: string
  status: 'Pending' | 'Accepted' | 'Rejected'
  createdAt?: Date | string
  updatedAt?: Date | string
}

// ✅ Formatted Request สำหรับตาราง
export interface FormattedRequestOTFieldWork {
  _id: string
  user_id: string
  user_name: string
  user_email: string
  supervisor_id: string | string[]
  supervisor_name: string | string[]
  supervisor_email: string | string[]
  date: Date | string
  title: 'OT' | 'FIELD_WORK'
  title_label: string
  start_hour: string
  end_hour: string
  fuel: number
  date_off?: Date | string | null
  description?: string
  reason: string
  status: 'Pending' | 'Accepted' | 'Rejected'
  createdAt: Date | string
  statusColor: 'warning' | 'success' | 'danger'
}

// ✅ Request DTO สำหรับการสร้าง
export interface RequestOTFieldWorkDTO {
  user_id: string
  supervisor_id: string[]
  date: string
  title: 'OT' | 'FIELD_WORK'
  start_hour: string
  end_hour: string
  fuel: number
  date_off?: string | null
  description?: string
  reason: string
}

// ✅ สำหรับการอัพเดตสถานะ
export interface UpdateStatusDTO {
  status: 'Pending' | 'Accepted' | 'Rejected'
}

// ✅ Query Parameters
export interface RequestOTFieldWorkQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  startDate?: string
  endDate?: string
  userId?: string
  supervisorId?: string
  title?: 'OT' | 'FIELD_WORK'
}

// ✅ Response Types
export type RequestOTFieldWorksQueryResponse = Response<RequestOTFieldWork[]>
export type RequestOTFieldWorkResponse = Response<RequestOTFieldWork>

// ✅ Initial Values
export const initialRequestOTFieldWork: RequestOTFieldWorkDTO = {
  user_id: '',
  supervisor_id: [],
  date: new Date().toISOString().split('T')[0],
  title: 'OT',
  start_hour: '08:00',
  end_hour: '17:00',
  fuel: 0,
  date_off: null,
  description: '',
  reason: '',
}

// ✅ Status Options สำหรับ Dropdown
export const statusOptions = [
  { value: 'Pending', label: 'Pending', color: 'warning' },
  { value: 'Accepted', label: 'Accepted', color: 'success' },
  { value: 'Rejected', label: 'Rejected', color: 'danger' },
]

// ✅ Title Options
export const titleOptions = [
  { value: 'OT', label: 'Over Time (OT)' },
  { value: 'FIELD_WORK', label: 'Field Work' },
]

// ✅ Helper Functions
export const formatRequestOTFieldWork = (request: RequestOTFieldWork): FormattedRequestOTFieldWork => {
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

  // Extract user info
  const userInfo = extractUserInfo(request.user_id)
  
  // Extract supervisor info
  let supervisorInfo
  if (Array.isArray(request.supervisor_id)) {
    supervisorInfo = request.supervisor_id.map(sup => extractUserInfo(sup))
  } else {
    supervisorInfo = extractUserInfo(request.supervisor_id)
  }

  // Get status color
  const getStatusColor = (status: string): 'warning' | 'success' | 'danger' => {
    switch (status) {
      case 'Pending': return 'warning'
      case 'Accepted': return 'success'
      case 'Rejected': return 'danger'
      default: return 'warning'
    }
  }

  // Get title label
  const getTitleLabel = (title: 'OT' | 'FIELD_WORK'): string => {
    return title === 'OT' ? 'Over Time (OT)' : 'Field Work'
  }

  return {
    _id: request._id || request.id || '',
    user_id: userInfo.id,
    user_name: userInfo.name,
    user_email: userInfo.email,
    supervisor_id: Array.isArray(supervisorInfo) 
      ? supervisorInfo.map(s => s.id) 
      : supervisorInfo.id,
    supervisor_name: Array.isArray(supervisorInfo)
      ? supervisorInfo.map(s => s.name).join(', ')
      : supervisorInfo.name,
    supervisor_email: Array.isArray(supervisorInfo)
      ? supervisorInfo.map(s => s.email).join(', ')
      : supervisorInfo.email,
    date: request.date,
    title: request.title,
    title_label: getTitleLabel(request.title),
    start_hour: request.start_hour,
    end_hour: request.end_hour,
    fuel: request.fuel || 0,
    date_off: request.date_off,
    description: request.description,
    reason: request.reason,
    status: request.status,
    createdAt: request.createdAt || new Date(),
    statusColor: getStatusColor(request.status),
  }
}

// ✅ Calculate work hours
export const calculateWorkHours = (startHour: string, endHour: string): number => {
  const [startH, startM] = startHour.split(':').map(Number)
  const [endH, endM] = endHour.split(':').map(Number)
  
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  
  const diffMinutes = endMinutes - startMinutes
  return Math.max(0, diffMinutes / 60) // Return hours
}

// ✅ Validate time format
export const isValidTimeFormat = (time: string): boolean => {
  return /^\d{2}:\d{2}$/.test(time)
}

// ✅ Filter functions
export const filterRequestsByStatus = (
  requests: FormattedRequestOTFieldWork[],
  status: string
): FormattedRequestOTFieldWork[] => {
  if (!status || status === 'All') return requests
  return requests.filter(req => req.status === status)
}

export const filterRequestsByTitle = (
  requests: FormattedRequestOTFieldWork[],
  title: string
): FormattedRequestOTFieldWork[] => {
  if (!title || title === 'All') return requests
  return requests.filter(req => req.title === title)
}

export const sortRequestsByDate = (
  requests: FormattedRequestOTFieldWork[],
  order: 'asc' | 'desc' = 'desc'
): FormattedRequestOTFieldWork[] => {
  return [...requests].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return order === 'asc' ? dateA - dateB : dateB - dateA
  })
}

// ✅ Validation
export const validateRequestOTFieldWork = (request: Partial<RequestOTFieldWorkDTO>): string[] => {
  const errors: string[] = []
  
  if (!request.user_id) errors.push('User is required')
  if (!request.supervisor_id || request.supervisor_id.length === 0) {
    errors.push('At least one supervisor is required')
  }
  if (!request.date) errors.push('Date is required')
  if (!request.title) errors.push('Title is required')
  if (!request.start_hour) errors.push('Start hour is required')
  else if (!isValidTimeFormat(request.start_hour)) {
    errors.push('Invalid start hour format (HH:mm)')
  }
  if (!request.end_hour) errors.push('End hour is required')
  else if (!isValidTimeFormat(request.end_hour)) {
    errors.push('Invalid end hour format (HH:mm)')
  }
  if (request.fuel !== undefined && request.fuel < 0) {
    errors.push('Fuel must be >= 0')
  }
  if (!request.reason || request.reason.trim().length < 3) {
    errors.push('Reason must be at least 3 characters')
  }
  if (request.description && request.description.length > 500) {
    errors.push('Description must not exceed 500 characters')
  }
  
  return errors
}