// _models.ts - COMPLETE TYPE-SAFE VERSION

// Helper function to format request data for display
export const formatRequestOTFieldWork = (request: RequestOTFieldWork): FormattedRequestOTFieldWork => {
  console.log('🔄 ========== FORMATTING REQUEST ==========')
  console.log('🔄 Request ID:', request._id)
  
  // ✅ Extract user information
  const user = request.user_id
  const userName = typeof user === 'object' && user !== null 
    ? user.user_name || 'N/A'
    : 'N/A'
  
  const userEmail = typeof user === 'object' && user !== null 
    ? user.user_email || ''
    : ''
  
  // ✅ Extract department information from user
  let departmentName = 'N/A'
  
  if (typeof user === 'object' && user !== null) {
    const department = user.department_id
    
    console.log('🏢 Department raw:', department)
    console.log('🏢 Is Array:', Array.isArray(department))
    
    if (Array.isArray(department)) {
      console.log('🏢 Department array length:', department.length)
      
      if (department.length > 0) {
        const firstDept = department[0]
        console.log('🏢 First department:', firstDept)
        console.log('🏢 First department type:', typeof firstDept)
        
        if (typeof firstDept === 'object' && firstDept !== null) {
          console.log('🏢 Department name field:', firstDept.department_name)
          departmentName = firstDept.department_name || 'N/A'
        } else {
          departmentName = 'N/A (not populated)'
        }
      } else {
        departmentName = 'N/A (empty array)'
      }
    } else if (typeof department === 'object' && department !== null) {
      departmentName = department.department_name || 'N/A'
    } else {
      departmentName = 'N/A (no department)'
    }
  }
  
  console.log('🏢 FINAL department_name:', departmentName)
  
  // ✅ Extract supervisor information with proper typing
  const supervisors = request.supervisor_id
  let supervisorName = 'N/A'
  
  if (Array.isArray(supervisors) && supervisors.length > 0) {
    const names: string[] = [] // ✅ Explicit type for names array
    
    supervisors.forEach((sup: any) => {
      if (typeof sup === 'object' && sup !== null && 'user_name' in sup) {
        const name = sup.user_name
        if (name) {
          names.push(name)
        }
      }
    })
    
    supervisorName = names.length > 0 ? names.join(', ') : 'N/A'
  } else if (typeof supervisors === 'object' && supervisors !== null && 'user_name' in supervisors) {
    supervisorName = (supervisors as User).user_name || 'N/A'
  }
  
  // ✅ Determine status color with proper type
  const getStatusColor = (status: string): 'warning' | 'success' | 'danger' => {
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
  
  // ✅ Build formatted object with explicit typing
  const formatted: FormattedRequestOTFieldWork = {
    ...request,
    _id: request._id || request.id || '',
    user_name: userName,
    user_email: userEmail,
    department_name: departmentName,
    supervisor_name: supervisorName,
    title_label: request.title === 'OT' ? 'Overtime' : 'Field Work',
    statusColor: getStatusColor(request.status),
  }
  
  console.log('✅ Formatted department_name:', formatted.department_name)
  console.log('✅ ==========================================')
  
  return formatted
}

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
}

export interface Position {
  _id?: string
  id?: string
  position_name: string
}

export interface RequestOTFieldWork {
  _id?: string
  id?: string
  user_id: User | string
  supervisor_id?: User | User[] | string | string[]
  title: 'OT' | 'FIELD_WORK'
  date: string | Date
  start_hour: string
  end_hour: string
  fuel: number
  reason: string
  status: 'Pending' | 'Accepted' | 'Rejected'
  createdAt: string | Date
  updatedAt?: string | Date
  description?: string
  date_off?: string | Date
}

export interface FormattedRequestOTFieldWork {
  // Original fields
  _id: string
  id?: string
  user_id: User | string
  supervisor_id?: User | User[] | string | string[]
  title: 'OT' | 'FIELD_WORK'
  date: string | Date
  start_hour: string
  end_hour: string
  fuel: number
  reason: string
  status: 'Pending' | 'Accepted' | 'Rejected'
  createdAt: string | Date
  updatedAt?: string | Date
  description?: string
  date_off?: string | Date
  // Formatted fields
  user_name: string
  user_email: string
  department_name: string
  supervisor_name: string
  title_label: string
  statusColor: 'warning' | 'success' | 'danger' // ✅ Explicit union type
}

export interface RequestOTFieldWorkDTO {
  user_id: string
  supervisor_id?: string | string[]
  title: 'OT' | 'FIELD_WORK'
  date: string | Date
  start_hour: string
  end_hour: string
  fuel: number
  reason: string
  status?: 'Pending' | 'Accepted' | 'Rejected'
  description?: string
  date_off?: string | Date
}

export interface RequestOTFieldWorksQueryResponse {
  data: RequestOTFieldWork[]
}