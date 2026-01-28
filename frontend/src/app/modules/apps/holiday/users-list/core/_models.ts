// app/modules/apps/event-management/events-list/core/_models.ts
import { ID, Response } from '../../../../../../_metronic/helpers'
import { User } from '../../../user-management/users-list/core/_models'

// ========================================
// EVENT INTERFACE (ตาม Model ของคุณ)
// ========================================
export interface Holiday {
  holiday_id?: ID
  _id?: ID // เพิ่มเผื่อรองรับ MongoDB
  id?: ID // เพิ่มเผื่อรองรับ
  user_id: string
  holiday_name: string
  holiday_type: 'public' | 'private'
  start_date: Date | string
  end_date: Date | string
  total_days?: number
  googleCalendarEventId?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | string
  approvedBy?: ID | User | null
  comment?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

// ========================================
// QUERY RESPONSE TYPES
// ========================================
export type EventsQueryResponse = Response<Array<Event>>
export type EventQueryResponse = Response<Event>

// ========================================
// FORM DATA TYPE
// ========================================
export interface HolidayFormData {
  user_id: string
  holiday_name: string
  holiday_type: 'public' | 'private'
  start_date: Date | string
  end_date: Date | string
  total_days?: number
  comment?: string
}

// ========================================
// INITIAL VALUES
// ========================================
export const initialHoliday: HolidayFormData = {
  user_id: undefined as unknown as string,
  holiday_name: '',
  holiday_type: 'public',
  start_date: new Date(),
  end_date: new Date(),
  total_days: 1,
  comment: '',
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * แปลง Event Type เป็นภาษาไทย
 */
export const getHolidayTypeLabel = (type?: string): string => {
  const types: Record<string, string> = {
    public: 'public',
    private: 'private',
  }
  return types[type || ''] || type || '-'
}

/**
 * แปลง Status เป็นภาษาไทย
 */
export const getEventStatusLabel = (status?: string): string => {
  const statuses: Record<string, string> = {
    pending: 'รอการอนุมัติ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ปฏิเสธ',
    cancelled: 'ยกเลิก',
  }
  return statuses[status || ''] || status || '-'
}

/**
 * Get สีของ Event Type
 */
export const getHolidayTypeColor = (type?: string): string => {
  const colors: Record<string, string> = {
    public: 'primary',
    private: 'red',
  }
  return colors[type || ''] || 'secondary'
}

/**
 * Get สีของ Status
 */
export const getEventStatusColor = (status?: string): string => {
  const colors: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'secondary',
  }
  return colors[status || ''] || 'secondary'
}

/**
 * แปลง User object เป็น name
 */
export const getUserName = (user?: ID | User): string => {
  if (!user) return '-'
  return typeof user === 'object' ? (user.user_name || '-') : '-'
}

/**
 * Format วันที่แบบไทย
 */
export const formatThaiDate = (date?: string | Date): string => {
  if (!date) return '-'
  try {
    return new Date(date).toLocaleDateString('th-TH')
  } catch {
    return '-'
  }
}

/**
 * Format วันที่สำหรับ input[type="datetime-local"]
 */
export const formatDateForInput = (date?: string | Date): string => {
  if (!date) return ''
  try {
    const d = new Date(date)
    return d.toISOString().slice(0, 16)
  } catch {
    return ''
  }
}