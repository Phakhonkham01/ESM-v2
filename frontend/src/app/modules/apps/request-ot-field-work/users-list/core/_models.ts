import { ID, Response } from '../../../../../../_metronic/helpers'

export type RequestData = {
  _id?: string
  id?: ID
  user_id: {
    _id: string
    email: string
    first_name_en?: string
    last_name_en?: string
    employee_id?: string
  } | string
  supervisor_id: string
  date: string
  title: 'OT' | 'FIELD_WORK'
  start_hour: string | number
  end_hour: string | number
  fuel?: number
  reason: string
  status: 'Pending' | 'Accept' | 'Reject'
  created_at?: string
}

export type RequestsQueryResponse = Response<Array<RequestData>>

export const initialRequest: RequestData = {
  user_id: '',
  supervisor_id: '',
  date: '',
  title: 'OT',
  start_hour: 0,
  end_hour: 0,
  reason: '',
  status: 'Pending',
}

// Helper functions
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export const formatHour = (hour: string | number): string => {
  if (typeof hour === 'number') {
    const hours = Math.floor(hour)
    const minutes = Math.round((hour - hours) * 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
  return hour.toString()
}

export const calculateDuration = (startHour: string | number, endHour: string | number): string => {
  const toMinutes = (time: string | number): number => {
    if (typeof time === 'number') {
      const hours = Math.floor(time)
      const minutes = Math.round((time - hours) * 60)
      return hours * 60 + minutes
    }
    return 0
  }
  const durationMinutes = toMinutes(endHour) - toMinutes(startHour)
  const durationHours = durationMinutes / 60
  return `${durationHours.toFixed(1)} hrs`
}

export const getEmployeeName = (request: RequestData): string => {
  if (typeof request.user_id === 'string') {
    return `User-${request.user_id.substring(0, 6)}...`
  }
  const firstName = request.user_id.first_name_en || ''
  const lastName = request.user_id.last_name_en || ''
  return `${firstName} ${lastName}`.trim() || request.user_id.email || 'Unknown'
}