import axios from 'axios'

// Vite uses import.meta.env instead of process.env
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8001/api'

/* ============================================================
   OT & FIELD WORK REQUESTS API
============================================================ */

export interface OTFieldWorkRequest {
  _id?: string
  user_id: string
  supervisor_id: string[]
  date: string | Date
  title: 'OT' | 'FIELD_WORK'
  start_hour: string // Format: "HH:mm"
  end_hour: string // Format: "HH:mm"
  fuel?: number
  reason?: string
  status?: 'Pending' | 'Accepted' | 'Rejected'
  created_at?: Date
}

export interface OTFieldWorkResponse {
  message?: string
  request?: OTFieldWorkRequest
  requests?: OTFieldWorkRequest[]
  count?: number
  total?: number
  pending?: number
  accepted?: number
  rejected?: number
}

// CREATE OT/Field Work Request
export const createOTFieldWorkRequest = async (
  data: Omit<OTFieldWorkRequest, '_id' | 'status' | 'created_at'>
): Promise<OTFieldWorkResponse> => {
  try {
    const response = await axios.post(`${API_URL}/requestOTandFieldWorkRoutes`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create request')
  }
}

// GET ALL OT/Field Work Requests (with filters)
export const getAllOTFieldWorkRequests = async (filters?: {
  startDate?: string
  endDate?: string
  status?: string
  title?: string
}): Promise<OTFieldWorkResponse> => {
  try {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.title) params.append('title', filters.title)

    const response = await axios.get(`${API_URL}/requestOTandFieldWorkRoutes?${params.toString()}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch requests')
  }
}

// GET OT/Field Work Requests by User
export const getOTFieldWorkRequestsByUser = async (
  userId: string
): Promise<OTFieldWorkResponse> => {
  try {
    const response = await axios.get(`${API_URL}/requestOTandFieldWorkRoutes/user/${userId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user requests')
  }
}

// GET OT/Field Work Requests by Supervisor
export const getOTFieldWorkRequestsBySupervisor = async (
  supervisorId: string
): Promise<OTFieldWorkResponse> => {
  try {
    const response = await axios.get(`${API_URL}/requestOTandFieldWorkRoutes/supervisor/${supervisorId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch supervisor requests')
  }
}

// GET OT/Field Work Request by ID
export const getOTFieldWorkRequestById = async (
  id: string
): Promise<OTFieldWorkResponse> => {
  try {
    const response = await axios.get(`${API_URL}/requestOTandFieldWorkRoutes/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch request')
  }
}

// UPDATE OT/Field Work Request Status
export const updateOTFieldWorkRequestStatus = async (
  id: string,
  status: 'Pending' | 'Accept' | 'Reject'
): Promise<OTFieldWorkResponse> => {
  try {
    const response = await axios.patch(`${API_URL}/requestOTandFieldWorkRoutes/${id}/status`, { status })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update status')
  }
}

// UPDATE OT/Field Work Request (Edit)
export const updateOTFieldWorkRequest = async (
  id: string,
  data: Partial<Omit<OTFieldWorkRequest, '_id' | 'user_id' | 'supervisor_id' | 'status' | 'created_at'>>
): Promise<OTFieldWorkResponse> => {
  try {
    const response = await axios.put(`${API_URL}/requestOTandFieldWorkRoutes/${id}`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update request')
  }
}

// DELETE OT/Field Work Request
export const deleteOTFieldWorkRequest = async (id: string): Promise<OTFieldWorkResponse> => {
  try {
    const response = await axios.delete(`${API_URL}/requestOTandFieldWorkRoutes/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete request')
  }
}

// GET OT/Field Work Request Stats
export const getOTFieldWorkRequestStats = async (): Promise<OTFieldWorkResponse> => {
  try {
    const response = await axios.get(`${API_URL}/requestOTandFieldWorkRoutes/stats`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch stats')
  }
}

/* ============================================================
   DAY OFF REQUESTS API
============================================================ */

export interface DayOffRequest {
  _id?: string
  user_id: string
  supervisor_id: string | string[] // เปลี่ยนให้รองรับทั้ง string และ array
  employee_id: string
  day_off_type: 'FULL_DAY' | 'HALF_DAY'
  start_date_time: string | Date
  end_date_time: string | Date
  date_off_number?: number
  title: string
  status?: 'Pending' | 'Accepted' | 'Rejected'
  created_at?: Date
  // Populated fields
  employee_name?: string
  employee_email?: string
  supervisor_name?: string
  supervisor_email?: string
  user_name?: string
}

export interface DayOffResponse {
  success: boolean
  message?: string
  request?: DayOffRequest
  requests?: DayOffRequest[]
  count?: number
  supervisor?: {
    id: string
    name: string
    email: string
  }
}

// CREATE Day Off Request
export const createDayOffRequest = async (
  data: Omit<DayOffRequest, '_id' | 'status' | 'created_at' | 'date_off_number'>
): Promise<DayOffResponse> => {
  try {
    console.log('🚀 Sending request to:', `${API_URL}/day-off-requests`) // เพิ่ม log
    console.log('📦 Request data:', data) // ดูข้อมูลที่ส่ง
    const response = await axios.post(`${API_URL}/day-off-requests`, data)
    return response.data
  } catch (error: any) {
    console.error('❌ Error response:', error.response?.data) // ดู error จาก backend
    throw new Error(error.response?.data?.message || 'Failed to create day off request')
  }
}

// GET ALL Day Off Requests (All Users)
export const getAllDayOffRequestsForAllUsers = async (): Promise<DayOffResponse> => {
  try {
    const response = await axios.get(`${API_URL}/day-off-requests/all`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch all day off requests')
  }
}

// GET ALL Day Off Requests
export const getAllDayOffRequests = async (): Promise<DayOffResponse> => {
  try {
    const response = await axios.get(`${API_URL}/day-off-requests`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch day off requests')
  }
}

// GET Day Off Requests by User
export const getDayOffRequestsByUser = async (userId: string): Promise<DayOffResponse> => {
  try {
    const response = await axios.get(`${API_URL}/day-off-requests/user/${userId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user day off requests')
  }
}

// GET Day Off Requests for Supervisor Dashboard
export const getDayOffRequestsForSupervisor = async (
  supervisorId: string
): Promise<DayOffResponse> => {
  try {
    const response = await axios.get(`${API_URL}/day-off-requests/supervisor/${supervisorId}`)
    return response.data
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch supervisor day off requests'
    )
  }
}

// UPDATE Day Off Request Status
export const updateDayOffRequestStatus = async (
  id: string,
  status: 'Pending' | 'Accepted' | 'Rejected'
): Promise<DayOffResponse> => {
  try {
    const response = await axios.patch(`${API_URL}/day-off-requests/${id}/status`, { status })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update status')
  }
}

// UPDATE Day Off Request (Edit - Only Pending)
export const updateDayOffRequest = async (
  id: string,
  data: Partial<Omit<DayOffRequest, '_id' | 'user_id' | 'employee_id' | 'status' | 'created_at' | 'date_off_number'>>
): Promise<DayOffResponse> => {
  try {
    const response = await axios.put(`${API_URL}/day-off-requests/${id}`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update day off request')
  }
}

// DELETE Day Off Request (Only Pending)
export const deleteDayOffRequest = async (id: string): Promise<DayOffResponse> => {
  try {
    const response = await axios.delete(`${API_URL}/day-off-requests/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete day off request')
  }
}

/* ============================================================
   HELPER FUNCTIONS
============================================================ */

// Format time to HH:mm
export const formatTimeToHHmm = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// Validate time format
export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

// Calculate date difference in days
export const calculateDateDifference = (startDate: Date, endDate: Date): number => {
  const diffTime = endDate.getTime() - startDate.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
}

// Format date for API
export const formatDateForAPI = (date: Date): string => {
  return date.toISOString()
}

// Parse date from API
export const parseDateFromAPI = (dateString: string): Date => {
  return new Date(dateString)
}
