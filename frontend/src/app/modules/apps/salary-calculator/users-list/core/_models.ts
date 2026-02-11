import { Response } from '../../../../../../_metronic/helpers'

// Interface for users
export interface User {
  _id: string
  first_name_en: string
  last_name_en: string
  email: string
  role: string
  status: string
  base_salary?: number
  department_id?: Array<{
    _id: string
    department_name?: string
    name?: string
  }> | {
    _id: string
    department_name?: string
    name?: string
  }
  position_id?: {
    _id: string
    position_name?: string
    name?: string
  }
  leave_days?: number
  created_at?: string
  date_of_birth?: string
}

// Interface for existing salaries
export interface ExistingSalary {
  _id: string
  month: number
  year: number
  status: string
  net_salary: number
}

export interface SalarySummaryStats {
  totalUsers: number
  activeUsers: number
  totalBaseSalary: number
}

// Query Response Type
export type UsersQueryResponse = Response<Array<User>>

// Helper functions
export const getDepartmentName = (user: User): string => {
  if (!user.department_id) {
    return '-'
  }
  
  if (Array.isArray(user.department_id)) {
    if (user.department_id.length === 0) {
      return '-'
    }
    
    const department = user.department_id[0]
    if (!department || typeof department !== 'object') {
      return '-'
    }
    
    if (department.department_name) {
      return department.department_name
    }
    if (department.name) {
      return department.name
    }
    return '-'
  } else {
    const department = user.department_id
    if (department.department_name) {
      return department.department_name
    }
    if (department.name) {
      return department.name
    }
    return '-'
  }
}

export const getPositionName = (user: User): string => {
  if (!user.position_id) {
    return '-'
  }
  
  const position = user.position_id
  if (position.position_name) {
    return position.position_name
  }
  if (position.name) {
    return position.name
  }
  return '-'
}

export const formatCurrency = (amount: number | undefined) => {
  if (!amount) return '-'
  return amount.toLocaleString('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  })
}

export const getMonthName = (month: number) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1] || ''
}

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Active':
      return 'badge-light-success'
    case 'Inactive':
      return 'badge-light-danger'
    default:
      return 'badge-light-secondary'
  }
}

export const getRoleBadge = () => {
  return 'badge-light-primary'
}