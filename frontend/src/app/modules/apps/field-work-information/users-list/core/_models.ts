// _models.ts - COMPLETE TYPE-SAFE VERSION

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface User {
  _id?: string
  id?: string
  user_name: string
  user_email: string
  department_id?: Department | Department[] | string | string[] | null
  position_id?: Position | string | null
  first_name_en?: string
  last_name_en?: string
  nickname_en?: string
  first_name_la?: string
  last_name_la?: string
  nickname_la?: string
}

export interface Department {
  _id?: string
  id?: string
  department_name: string
  department_code?: string
  description?: string
}

export interface Position {
  _id?: string
  id?: string
  position_name: string
  position_code?: string
}

// Status type for reuse
export type RequestStatus = 'Pending' | 'Accepted' | 'Rejected'
export type RequestTitle = 'OT' | 'FIELD_WORK'
export type StatusColor = 'warning' | 'success' | 'danger'

export interface RequestOTFieldWork {
  _id?: string
  id?: string
  user_id: User | string
  supervisor_id?: User | User[] | string | string[]
  title: RequestTitle
  date: string | Date
  start_hour: string
  end_hour: string
  fuel: number
  reason: string
  status: RequestStatus
  createdAt: string | Date
  updatedAt?: string | Date
  description?: string
  date_off?: string | Date
}

export interface FormattedRequestOTFieldWork extends RequestOTFieldWork {
  // Override with formatted fields
  _id: string
  user_name: string
  user_email: string
  department_name: string
  supervisor_name: string
  title_label: string
  statusColor: StatusColor
}

export interface RequestOTFieldWorkDTO {
  user_id: string
  supervisor_id?: string | string[]
  title: RequestTitle
  date: string | Date
  start_hour: string
  end_hour: string
  fuel: number
  reason: string
  status?: RequestStatus
  description?: string
  date_off?: string | Date
}

export interface RequestOTFieldWorksQueryResponse {
  data: RequestOTFieldWork[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

// ============================================
// TYPE GUARDS
// ============================================

export const isUserObject = (user: any): user is User => {
  return user && typeof user === 'object' && 'user_name' in user
}

export const isDepartmentObject = (dept: any): dept is Department => {
  return dept && typeof dept === 'object' && 'department_name' in dept
}

export const isDepartmentArray = (dept: any): dept is Department[] => {
  return Array.isArray(dept) && dept.every(item => isDepartmentObject(item))
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getUserName = (user: User | string | undefined): string => {
  if (!user) return 'N/A'
  if (typeof user === 'string') return 'N/A (ID only)'
  return user.user_name || 'N/A'
}

const getUserEmail = (user: User | string | undefined): string => {
  if (!user) return ''
  if (typeof user === 'string') return ''
  return user.user_email || ''
}

const getDepartmentName = (user: User | string | undefined): string => {
  if (!user || typeof user === 'string') return 'N/A'
  
  const department = user.department_id
  if (!department) return 'N/A'
  
  // Handle array of departments
  if (Array.isArray(department)) {
    if (department.length === 0) return 'N/A'
    
    const firstDept = department[0]
    if (firstDept && typeof firstDept === 'object') {
      return (firstDept as Department).department_name || 'N/A'
    }
    return 'N/A'
  }
  
  // Handle single department object
  if (typeof department === 'object') {
    return (department as Department).department_name || 'N/A'
  }
  
  // Handle department ID string
  return 'N/A (ID only)'
}

const getSupervisorName = (supervisors: User | User[] | string | string[] | undefined): string => {
  if (!supervisors) return 'N/A'
  
  const names: string[] = []
  
  // Handle array of supervisors
  if (Array.isArray(supervisors)) {
    supervisors.forEach((sup: any) => {
      if (sup && typeof sup === 'object' && 'user_name' in sup) {
        const name = (sup as User).user_name
        if (name) names.push(name)
      }
    })
    return names.length > 0 ? names.join(', ') : 'N/A'
  }
  
  // Handle single supervisor object
  if (typeof supervisors === 'object' && 'user_name' in supervisors) {
    return (supervisors as User).user_name || 'N/A'
  }
  
  // Handle supervisor ID string
  return 'N/A (ID only)'
}

export const getStatusColor = (status: RequestStatus): StatusColor => {
  switch (status) {
    case 'Pending':
      return 'warning'
    case 'Accepted':
      return 'success'
    case 'Rejected':
      return 'danger'
    default:
      return 'warning'
  }
}

export const getTitleLabel = (title: RequestTitle): string => {
  return title === 'OT' ? 'Overtime' : 'Field Work'
}

// ============================================
// MAIN FORMATTING FUNCTION
// ============================================

export const formatRequestOTFieldWork = (request: RequestOTFieldWork): FormattedRequestOTFieldWork => {
  const user = request.user_id
  
  // Get formatted values using helper functions
  const userName = getUserName(user)
  const userEmail = getUserEmail(user)
  const departmentName = getDepartmentName(user)
  const supervisorName = getSupervisorName(request.supervisor_id)
  
  const formatted: FormattedRequestOTFieldWork = {
    ...request,
    _id: request._id || request.id || '',
    user_name: userName,
    user_email: userEmail,
    department_name: departmentName,
    supervisor_name: supervisorName,
    title_label: getTitleLabel(request.title),
    statusColor: getStatusColor(request.status),
  }
  
  return formatted
}

// ============================================
// ARRAY FORMATTING FUNCTION
// ============================================

export const formatRequestOTFieldWorkArray = (
  requests: RequestOTFieldWork[]
): FormattedRequestOTFieldWork[] => {
  return requests.map(formatRequestOTFieldWork)
}