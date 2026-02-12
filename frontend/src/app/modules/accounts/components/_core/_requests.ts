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
    console.log('🚀 Sending request to:', `${API_URL}/day-off-requests`)
    console.log('📦 Request data:', data)
    const response = await axios.post(`${API_URL}/day-off-requests`, data)
    return response.data
  } catch (error: any) {
    console.error('❌ Error response:', error.response?.data)
    throw new Error(error.response?.data?.message || 'Failed to create day off request')
  }
}

// GET ALL Day Off Requests (All Users)
export const getAllDayOffRequestsForAllUsers = async (): Promise<DayOffResponse> => {
  try {
    const response = await axios.get(`${API_URL}/day-off-requests/allusers`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch all day off requests')
  }
}

// GET ALL Day Off Requests (with filters)
export const getAllDayOffRequests = async (filters?: {
  startDate?: string
  endDate?: string
  status?: string
}): Promise<DayOffResponse> => {
  try {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.status) params.append('status', filters.status)

    const response = await axios.get(`${API_URL}/day-off-requests/allrequests?${params.toString()}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch day off requests')
  }
}

// GET Day Off Request by ID
export const getDayOffRequestById = async (id: string): Promise<DayOffResponse> => {
  try {
    const response = await axios.get(`${API_URL}/day-off-requests/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch day off request')
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

// CHECK Day Off Conflict
export const checkDayOffConflict = async (params: {
  employee_id: string
  date?: string
  start_date?: string
  end_date?: string
  exclude_id?: string
}): Promise<{
  success: boolean
  has_conflict: boolean
  conflict_count: number
  conflicts: any[]
  message: string
}> => {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append('employee_id', params.employee_id)
    if (params.date) queryParams.append('date', params.date)
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)
    if (params.exclude_id) queryParams.append('exclude_id', params.exclude_id)

    const response = await axios.get(`${API_URL}/day-off-requests/check-conflict?${queryParams.toString()}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to check conflict')
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

// GET Day Off Request Stats
export const getDayOffRequestStats = async (): Promise<{
  success: boolean
  stats: {
    total: number
    byStatus: {
      pending: number
      accepted: number
      rejected: number
    }
    byType: {
      fullDay: number
      halfDay: number
    }
  }
}> => {
  try {
    const response = await axios.get(`${API_URL}/day-off-requests/stats`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch stats')
  }
}

/* ============================================================
   SATURDAY/SUNDAY REQUESTS API
============================================================ */

export interface SatSunRequest {
  _id?: string
  user_id: string
  supervisor_id: string[]
  employee_id: string
  day_choice: 'Saturday' | 'Sunday'
  day_off_type: 'Full day' | 'Half day'
  start_date_time: string | Date
  end_date_time: string | Date
  date_off_number?: number
  description?: string
  status?: 'Pending' | 'Accepted' | 'Rejected'
  created_at?: Date
  // Populated fields
  employee_name?: string
  employee_email?: string
  supervisor_name?: string
  supervisor_email?: string
  user_name?: string
}

export interface SatSunResponse {
  success: boolean
  message?: string
  request?: SatSunRequest
  requests?: SatSunRequest[]
  count?: number
  remaining_leave_days?: number
  supervisor?: {
    id: string
    name: string
    email: string
    department?: any
    position?: any
  }
}

// CREATE Saturday/Sunday Request
export const createSatSunRequest = async (
  data: Omit<SatSunRequest, '_id' | 'status' | 'created_at' | 'date_off_number'>
): Promise<SatSunResponse> => {
  try {
    console.log('🚀 Sending Sat/Sun request to:', `${API_URL}/sat-sun-requests`)
    console.log('📦 Request data:', data)
    const response = await axios.post(`${API_URL}/sat-sun-requests`, data)
    return response.data
  } catch (error: any) {
    console.error('❌ Error response:', error.response?.data)
    throw new Error(error.response?.data?.message || 'Failed to create Saturday/Sunday request')
  }
}

// GET ALL Saturday/Sunday Requests (All Users)
export const getAllSatSunRequestsForAllUsers = async (): Promise<SatSunResponse> => {
  try {
    const response = await axios.get(`${API_URL}/sat-sun-requests/allusers`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch all Saturday/Sunday requests')
  }
}

// GET ALL Saturday/Sunday Requests (with filters)
export const getAllSatSunRequests = async (filters?: {
  startDate?: string
  endDate?: string
  status?: string
  day_choice?: 'Saturday' | 'Sunday'
}): Promise<SatSunResponse> => {
  try {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.day_choice) params.append('day_choice', filters.day_choice)

    const response = await axios.get(`${API_URL}/sat-sun-requests/allrequests?${params.toString()}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch Saturday/Sunday requests')
  }
}

// GET Saturday/Sunday Request by ID
export const getSatSunRequestById = async (id: string): Promise<SatSunResponse> => {
  try {
    const response = await axios.get(`${API_URL}/sat-sun-requests/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch Saturday/Sunday request')
  }
}

// GET Saturday/Sunday Requests by User
export const getSatSunRequestsByUser = async (userId: string): Promise<SatSunResponse> => {
  try {
    const response = await axios.get(`${API_URL}/sat-sun-requests/user/${userId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user Saturday/Sunday requests')
  }
}

// GET Saturday/Sunday Requests for Supervisor Dashboard
export const getSatSunRequestsForSupervisor = async (
  supervisorId: string
): Promise<SatSunResponse> => {
  try {
    const response = await axios.get(`${API_URL}/sat-sun-requests/supervisor/${supervisorId}`)
    return response.data
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch supervisor Saturday/Sunday requests'
    )
  }
}

// CHECK Saturday/Sunday Conflict
export const checkSatSunConflict = async (params: {
  employee_id: string
  date?: string
  start_date?: string
  end_date?: string
  exclude_id?: string
}): Promise<{
  success: boolean
  has_conflict: boolean
  conflict_count: number
  conflicts: any[]
  message: string
}> => {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append('employee_id', params.employee_id)
    if (params.date) queryParams.append('date', params.date)
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)
    if (params.exclude_id) queryParams.append('exclude_id', params.exclude_id)

    const response = await axios.get(`${API_URL}/sat-sun-requests/check-conflict?${queryParams.toString()}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to check Saturday/Sunday conflict')
  }
}

// UPDATE Saturday/Sunday Request Status
export const updateSatSunRequestStatus = async (
  id: string,
  status: 'Pending' | 'Accepted' | 'Rejected'
): Promise<SatSunResponse> => {
  try {
    const response = await axios.patch(`${API_URL}/sat-sun-requests/${id}/status`, { status })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update Saturday/Sunday status')
  }
}

// UPDATE Saturday/Sunday Request (Edit - Only Pending)
export const updateSatSunRequest = async (
  id: string,
  data: Partial<Omit<SatSunRequest, '_id' | 'user_id' | 'employee_id' | 'status' | 'created_at' | 'date_off_number'>>
): Promise<SatSunResponse> => {
  try {
    const response = await axios.put(`${API_URL}/sat-sun-requests/${id}`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update Saturday/Sunday request')
  }
}

// DELETE Saturday/Sunday Request (Only Pending)
export const deleteSatSunRequest = async (id: string): Promise<SatSunResponse> => {
  try {
    const response = await axios.delete(`${API_URL}/sat-sun-requests/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete Saturday/Sunday request')
  }
}

// GET Saturday/Sunday Request Stats
export const getSatSunRequestStats = async (): Promise<{
  success: boolean
  stats: {
    total: number
    byStatus: {
      pending: number
      accepted: number
      rejected: number
    }
    byDay: {
      saturday: number
      sunday: number
    }
    byType: {
      fullDay: number
      halfDay: number
    }
  }
}> => {
  try {
    const response = await axios.get(`${API_URL}/sat-sun-requests/stats`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch Saturday/Sunday stats')
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

// Get next Saturday date
export const getNextSaturday = (): Date => {
  const today = new Date()
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7
  const nextSaturday = new Date(today)
  nextSaturday.setDate(today.getDate() + daysUntilSaturday)
  nextSaturday.setHours(8, 30, 0, 0)
  return nextSaturday
}

// Get next Sunday date
export const getNextSunday = (): Date => {
  const today = new Date()
  const daysUntilSunday = (7 - today.getDay()) % 7 || 7
  const nextSunday = new Date(today)
  nextSunday.setDate(today.getDate() + daysUntilSunday)
  nextSunday.setHours(8, 30, 0, 0)
  return nextSunday
}

// Check if date is Saturday
export const isSaturday = (date: Date): boolean => {
  return date.getDay() === 6
}

// Check if date is Sunday
export const isSunday = (date: Date): boolean => {
  return date.getDay() === 0
}

// Validate Saturday/Sunday date
export const validateSatSunDate = (date: Date, dayChoice: 'Saturday' | 'Sunday'): boolean => {
  if (dayChoice === 'Saturday') {
    return isSaturday(date)
  } else {
    return isSunday(date)
  }
}

// Create morning half-day time range (08:30 - 12:00)
export const createMorningHalfDay = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date)
  start.setHours(8, 30, 0, 0)
  
  const end = new Date(date)
  end.setHours(12, 0, 0, 0)
  
  return { start, end }
}

// Create afternoon half-day time range (13:30 - 17:00)
export const createAfternoonHalfDay = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date)
  start.setHours(13, 30, 0, 0)
  
  const end = new Date(date)
  end.setHours(17, 0, 0, 0)
  
  return { start, end }
}

// Create full day time range (08:30 - 17:00)
export const createFullDay = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date)
  start.setHours(8, 30, 0, 0)
  
  const end = new Date(date)
  end.setHours(17, 0, 0, 0)
  
  return { start, end }
}