import { ID, Response } from '../../../../../../_metronic/helpers'

// ✅ DayOff Model
// ✅ DayOff Model (รองรับทั้งสองแบบ)
export type DayOffRequest = {
  _id?: string
  id?: ID
  employee_name?: string
  supervisor_name?: string
  user_id: string | {
    _id: string
    first_name_en?: string
    last_name_en?: string
    email?: string
  }
  employee_id: string | {
    _id: string
    employee_id?: string
    first_name_en?: string
    last_name_en?: string
  }
  // FIX: supervisor_id เปลี่ยนเป็น string[] หรือ array ของ object หรือ string เดิม
  supervisor_id: string | string[] | {
    _id: string
    employee_id?: string
    first_name_en?: string
    last_name_en?: string
  } | {
    _id: string
    employee_id?: string
    first_name_en?: string
    last_name_en?: string
  }[]
  day_off_type: 'FULL_DAY' | 'HALF_DAY'
  start_date_time: string
  end_date_time: string
  date_off_number: number
  title: string
  status: 'Pending' | 'Accepted' | 'Rejected'
  created_at?: string
  createdAt?: string
  updatedAt?: string
}

// ฟังก์ชันสำหรับแปลง supervisor ให้เป็น array เสมอ
export const normalizeSupervisorId = (supervisorData: any): any[] => {
  if (!supervisorData) return []
  
  if (Array.isArray(supervisorData)) {
    return supervisorData
  }
  
  return [supervisorData]
}

export type DayOffQueryResponse = Response<Array<DayOffRequest>>

export const initialDayOff: DayOffRequest = {
  employee_name: '',
  supervisor_name: '',
  user_id: '',
  employee_id: '',
  supervisor_id: '',
  day_off_type: 'FULL_DAY',
  start_date_time: '',
  end_date_time: '',
  date_off_number: 1,
  title: '',
  status: 'Pending',
}

// ✅ Helper Functions
export const getEmployeeDisplayName = (d: DayOffRequest): string => {
  if (d.employee_name) return d.employee_name

  if (typeof d.employee_id === 'string') {
    return d.employee_id
  }

  if (typeof d.employee_id === 'object' && d.employee_id !== null) {
    return `${d.employee_id.first_name_en || ''} ${d.employee_id.last_name_en || ''}`.trim()
  }

  return '-'
}

export const getSupervisorName = (supervisorData: string | any): string => {
  if (!supervisorData) return 'Unknown Supervisor'

  if (typeof supervisorData === 'string') {
    if (/^[0-9a-fA-F]{24}$/.test(supervisorData)) {
      return `SPV-${supervisorData.substring(0, 6)}...`
    }
    return supervisorData
  }

  if (typeof supervisorData === 'object' && supervisorData !== null) {
    const firstName = supervisorData.first_name_en || ''
    const lastName = supervisorData.last_name_en || ''

    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }

    if (supervisorData.email) {
      return supervisorData.email.split('@')[0]
    }

    if (supervisorData._id) {
      return `SPV-${supervisorData._id.toString().substring(0, 6)}...`
    }
  }

  return 'Unknown Supervisor'
}

export const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}