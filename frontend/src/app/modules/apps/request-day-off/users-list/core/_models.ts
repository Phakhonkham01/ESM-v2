// supervisor-day-off/users-list/core/_models.ts
import {ID, Response} from '../../../../../../_metronic/helpers'

export interface User {
  _id?: string
  id?: ID
  employee_id?: string
  first_name_en?: string
  last_name_en?: string
  email?: string
  role?: string
}

export interface DayOffItem {
  _id: string
  id?: ID
  employee_name?: string
  supervisor_name?: string
  user_id: string | User
  employee_id: string | User
  supervisor_id: string | User
  day_off_type: 'FULL_DAY' | 'HALF_DAY'
  start_date_time: string
  end_date_time: string
  date_off_number: number
  title: string
  status: 'Pending' | 'Accepted' | 'Rejected'
  created_at?: string
}

export type DayOffQueryResponse = Response<Array<DayOffItem>>
export type DayOffStats = {
  pending: number
  accepted: number
  rejected: number
  total: number
}

export interface SupervisorInfo {
  id: string
  name: string
}

// สำหรับ filter
export interface DayOffQueryState {
  status?: string
  month?: string
  search?: string
}