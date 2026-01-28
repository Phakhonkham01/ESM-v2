// app/modules/apps/event-management/events-list/core/_models.ts
import { ID, Response } from '../../../../../../_metronic/helpers'
import { User } from '../../../user-management/users-list/core/_models'

// ========================================
// EVENT INTERFACE (ตาม Model ของคุณ)
// ========================================
export interface Event {
  event_id?: ID
  _id?: ID // เพิ่มเผื่อรองรับ MongoDB
  id?: ID // เพิ่มเผื่อรองรับ
  user_id: string
  event_name: string
  event_type_id: ID
  person_in_charge: ID | User
  description?: string
  start_date: Date | string
  end_date: Date | string
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
export interface EventFormData {
  user_id: string
  event_name: string
  event_type_id: ID
  person_in_charge: ID
  description?: string
  start_date: Date | string
  end_date: Date | string
  comment?: string
}

// ========================================
// INITIAL VALUES
// ========================================
export const initialEvent: EventFormData = {
  user_id: undefined as unknown as string,
  event_name: '',
  event_type_id: undefined as unknown as ID,
  person_in_charge: undefined as unknown as ID,
  start_date: new Date(),
  end_date: new Date(),
  description: '',
  comment: '',
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * แปลง Event Type เป็นภาษาไทย
 */
export const getEventTypeLabel = (type?: string): string => {
  const types: Record<string, string> = {
    meeting: 'ประชุม',
    training: 'อบรม',
    'company event': 'กิจกรรมบริษัท',
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
export const getEventTypeColor = (type?: string): string => {
  const colors: Record<string, string> = {
    meeting: 'primary',
    training: 'warning',
    'company event': 'success',
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