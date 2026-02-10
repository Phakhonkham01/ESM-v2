import { ID, Response } from '../../../../_metronic/helpers'

export type SalaryData = {
  _id: string
  id?: ID
  user_id: {
    _id: string
    first_name_en: string
    last_name_en: string
    email: string
    role?: string
    department_id?: {
      _id: string
      name: string
    }
    position_id?: {
      _id: string
      name: string
    }
  }
  month: number
  year: number
  base_salary: number
  ot_amount: number
  ot_hours?: number
  ot_details?: any[]
  weekday_ot_hours?: number
  weekend_ot_hours?: number
  weekday_ot_amount?: number
  weekend_ot_amount?: number
  bonus: number
  commission: number
  fuel_costs: number
  money_not_spent_on_holidays: number
  other_income: number
  office_expenses: number
  social_security: number
  working_days: number
  day_off_days: number
  remaining_vacation_days: number
  net_salary: number
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  created_by: {
    first_name_en: string
    last_name_en: string
  }
  notes?: string
  payment_date: string
  created_at: string
  updated_at: string
  cut_off_pay_days?: number
  cut_off_pay_amount?: number
}

export type SalariesQueryResponse = Response<Array<SalaryData>>

// Helper functions
export const getMonthName = (monthNum: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[monthNum - 1] || ''
}

export const formatCurrency = (amount: number): string => {
  return `฿${amount.toLocaleString()}`
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        color: 'badge-light-warning',
        icon: 'time',
        label: 'Pending'
      }
    case 'approved':
      return {
        color: 'badge-light-success',
        icon: 'check-circle',
        label: 'Approved'
      }
    case 'paid':
      return {
        color: 'badge-light-primary',
        icon: 'dollar',
        label: 'Paid'
      }
    case 'cancelled':
      return {
        color: 'badge-light-danger',
        icon: 'cross-circle',
        label: 'Cancelled'
      }
    default:
      return {
        color: 'badge-light-secondary',
        icon: 'question',
        label: 'Unknown'
      }
  }
}