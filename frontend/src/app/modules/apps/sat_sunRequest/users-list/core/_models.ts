import { ID, Response } from '../../../../../../_metronic/helpers'
import { User } from '../../../user-management/users-list/core/_models'

// =========================================
// 🔷 Enum-like types
// =========================================

export type DayChoice = 'Saturday' | 'Sunday'
export type DayOffType = 'Full day' | 'Half day'
export type SatSunRequestStatus = 'Pending' | 'Accepted' | 'Rejected'

// =========================================
// 🔷 Populated sub-documents
// =========================================

export type PopulatedDepartment = {
  _id: string
  department_name: string
}

export type PopulatedPosition = {
  _id: string
  position_name: string
}

/**
 * department_id อาจมาเป็น object, array ของ object, หรือ string
 * ขึ้นกับว่า MongoDB populate ทำงานยังไงใน document นั้น
 */
export type PopulatedEmployee = User & {
  department_id?: PopulatedDepartment | PopulatedDepartment[] | string | string[]
  position_id?: PopulatedPosition | PopulatedPosition[] | string | string[]
}

// =========================================
// 🔷 Core Interface
// =========================================

export type SatSunRequest = {
  id?: ID
  _id?: string

  user_id: string | PopulatedEmployee | null | undefined
  supervisor_id: string[] | PopulatedEmployee[] | null | undefined
  employee_id: string | PopulatedEmployee | null | undefined

  day_choice: DayChoice
  day_off_type: DayOffType
  start_date_time: string | Date
  end_date_time: string | Date
  date_off_number: number
  description?: string
  status: SatSunRequestStatus
  created_at?: string | Date
  created_at_local?: string | Date
  start_date_time_local?: string | Date
  end_date_time_local?: string | Date
}

export type SatSunRequestQueryResponse = Response<Array<SatSunRequest>>

export const initialSatSunRequest: SatSunRequest = {
  user_id: null,
  supervisor_id: [],
  employee_id: null,
  day_choice: 'Saturday',
  day_off_type: 'Full day',
  start_date_time: '',
  end_date_time: '',
  date_off_number: 1,
  description: '',
  status: 'Pending',
  created_at: '',
}

// =========================================
// 🔷 Type Guards
// =========================================

export const isPopulatedEmployee = (
  value: string | PopulatedEmployee | null | undefined
): value is PopulatedEmployee =>
  typeof value === 'object' && value !== null && 'user_email' in value

/** รองรับทั้ง object เดี่ยว และ array[0] */
const isDeptObject = (v: unknown): v is PopulatedDepartment =>
  typeof v === 'object' && v !== null && 'department_name' in v

const isPosObject = (v: unknown): v is PopulatedPosition =>
  typeof v === 'object' && v !== null && 'position_name' in v

// =========================================
// 🔷 Safe field extractors
// =========================================

/** ดึง department_name — รองรับ object / array / string */
export const getDepartmentName = (
  emp: PopulatedEmployee | null | undefined
): string => {
  if (!emp) return 'N/A'
  const raw = emp.department_id

  // array เช่น [ { _id, department_name } ]
  if (Array.isArray(raw)) {
    const first = raw[0]
    if (isDeptObject(first)) return first.department_name || 'N/A'
    return 'N/A'
  }

  // plain object
  if (isDeptObject(raw)) return raw.department_name || 'N/A'

  return 'N/A'
}

/** ดึง position_name — รองรับ object / array / string */
export const getPositionName = (
  emp: PopulatedEmployee | null | undefined
): string => {
  if (!emp) return 'N/A'
  const raw = emp.position_id

  if (Array.isArray(raw)) {
    const first = raw[0]
    if (isPosObject(first)) return first.position_name || 'N/A'
    return 'N/A'
  }

  if (isPosObject(raw)) return raw.position_name || 'N/A'

  return 'N/A'
}

/** ดึง full name */
export const getEmployeeFullName = (
  emp: PopulatedEmployee | null | undefined
): string => {
  if (!emp) return '-'
  return `${emp.first_name_en || ''} ${emp.last_name_en || ''}`.trim() || '-'
}

/** Extract ID จาก relation field */
export const extractUserId = (
  user: string | PopulatedEmployee | null | undefined
): string | null => {
  if (!user) return null
  if (typeof user === 'object') return (user.id as string) || (user.id as string) || null
  return user
}

export const extractSupervisorIds = (
  supervisors: string[] | PopulatedEmployee[] | null | undefined
): string[] => {
  if (!supervisors || supervisors.length === 0) return []
  return supervisors
    .map((s) =>
      typeof s === 'object' ? (s.id as string) || (s.id as string) || '' : s
    )
    .filter(Boolean) as string[]
}

// =========================================
// 🔷 Display helpers
// =========================================

export const getSatSunStatusBadgeClass = (status: SatSunRequestStatus): string => {
  switch (status) {
    case 'Accepted': return 'badge-light-success'
    case 'Rejected': return 'badge-light-danger'
    case 'Pending':
    default:         return 'badge-light-warning'
  }
}

export const formatDateOffNumber = (value: number): string =>
  value === 0.5 ? 'Half day (0.5)' : `Full day (${value})`