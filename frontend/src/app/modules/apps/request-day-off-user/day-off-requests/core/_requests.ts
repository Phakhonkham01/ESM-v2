// src/app/modules/apps/day-off-request/core/_requests.ts
import axios, { AxiosResponse } from 'axios'
import { ID, Response } from '../../../../../../_metronic/helpers'
import { DayOffRequest, DayOffRequestDTO, UpdateStatusDTO, FormattedDayOffRequest } from './_models'

// ใช้ environment variable หรือค่า default
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8001/api'
const DAY_OFF_REQUEST_URL = `${API_URL}/day-off-requests`

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Interface สำหรับ API response
interface DayOffRequestsAllUserResponse {
  success: boolean
  count: number
  requests: FormattedDayOffRequest[]
}

interface DayOffRequestResponse {
  success: boolean
  message?: string
  data: DayOffRequest
   request?: DayOffRequest  
}

interface DayOffRequestsQueryResponseData {
  success: boolean
  count: number
  data: DayOffRequest[]
}

// Helper function to normalize user data
const normalizeUserData = (userData: any): any => {
  if (!userData) return null
  
  // If it's already a populated object
  if (typeof userData === 'object' && userData !== null && !userData._bsontype) {
    return {
      _id: userData._id || userData.id,
      id: userData._id || userData.id,
      user_name: userData.user_name,
      first_name_en: userData.first_name_en,
      last_name_en: userData.last_name_en,
      user_email: userData.user_email || userData.email,
      employee_id: userData.employee_id,
    }
  }
  
  // If it's just an ID string
  return userData
}

// Helper function to map day off request
// ในไฟล์ _requests.ts
// Helper function to map day off request
const mapDayOffRequest = (request: any): DayOffRequest => {
  // ✅ ตรวจสอบว่า request มีค่าหรือไม่
  if (!request) {
    console.error('❌ mapDayOffRequest received null/undefined request')
    throw new Error('Cannot map null or undefined request')
  }
  
  console.log('🔍 Raw request data:', {
    _id: request._id,
    id: request.id,
    supervisor_id: request.supervisor_id,
    supervisor_id_type: typeof request.supervisor_id,
    is_supervisor_array: Array.isArray(request.supervisor_id),
    full_request: request  // เพิ่มเพื่อดู structure ทั้งหมด
  })
  
  // ถ้า supervisor_id เป็น array ของ ObjectId ให้แสดงรายละเอียด
  if (Array.isArray(request.supervisor_id)) {
    console.log('📋 Supervisor IDs array:', request.supervisor_id.map((item: any) => {
      if (item && typeof item === 'object') {
        return {
          type: typeof item,
          _bsontype: item._bsontype,
          toString: item.toString ? item.toString() : 'no toString',
          value: item
        }
      }
      return item
    }))
  }
  
  return {
    ...request,
    id: request._id || request.id,
    _id: request._id || request.id,
    employee_id: normalizeUserData(request.employee_id),
    supervisor_id: Array.isArray(request.supervisor_id)
      ? request.supervisor_id.map(normalizeUserData)
      : [normalizeUserData(request.supervisor_id)], // ✅ แปลงเป็น array เสมอ
    user_id: normalizeUserData(request.user_id),
  }
}

/* =========================
   DAY OFF REQUEST REQUESTS
========================= */

// GET ALL DAY OFF REQUESTS (FORMATTED) - สำหรับตาราง
// ในไฟล์ _requests.ts ฟังก์ชัน getDayOffRequestsAllUser
export const getDayOffRequestsAllUser = async (): Promise<DayOffRequestsAllUserResponse> => {
  try {
    console.log('📋 Fetching formatted day off requests from:', `${DAY_OFF_REQUEST_URL}/allusers`)
    const response = await axiosInstance.get<DayOffRequestsAllUserResponse>(`${DAY_OFF_REQUEST_URL}/allusers`)
    
    // Debug: ตรวจสอบข้อมูล supervisor ใน response ตัวแรก
    if (response.data.requests && response.data.requests.length > 0) {
      const firstRequest = response.data.requests[0]
      console.log('🔍 First request supervisor data:', {
        supervisor_id: firstRequest.supervisor_id,
        supervisor_name: firstRequest.supervisor_name,
        supervisor_email: firstRequest.supervisor_email,
        type: typeof firstRequest.supervisor_id,
        isArray: Array.isArray(firstRequest.supervisor_id)
      })
    }
    
    console.log('✅ Get all day off requests response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Get all day off requests error:', error)
    throw new Error(error.response?.data?.message || 'Failed to fetch day off requests')
  }
}

// GET ALL DAY OFF REQUESTS (RAW) - แก้ไขให้รองรับทั้งกรณีมี params และไม่มี
export const getAllDayOffRequests = async (params?: any): Promise<Response<DayOffRequest[]>> => {
  try {
    console.log('📋 Fetching raw day off requests with params:', params)
    
    // ลองใช้ endpoint /allusers ก่อน ถ้าไม่ได้ค่อยใช้ endpoint หลัก
    try {
      // พยายามใช้ /allusers endpoint ที่รู้ว่าทำงานได้
      const allUsersResponse = await axiosInstance.get<DayOffRequestsAllUserResponse>(`${DAY_OFF_REQUEST_URL}/allusers`)
      
      // แปลง formatted response เป็น raw format พร้อม normalize user data
      const rawData: DayOffRequest[] = allUsersResponse.data.requests.map(mapDayOffRequest)
      
      console.log('✅ Get day off requests response (from allusers):', { count: rawData.length })
      console.log('📝 Sample data:', rawData[0])
      return { data: rawData }
      
    } catch (allUsersError) {
      console.log('⚠️ /allusers endpoint failed, trying main endpoint...')
      
      // ถ้า /allusers ไม่ได้ ให้ลองใช้ endpoint หลักโดยไม่มี query params
      const response = await axiosInstance.get<DayOffRequestsQueryResponseData>(DAY_OFF_REQUEST_URL)
      
      const formattedResponse: Response<DayOffRequest[]> = {
        data: response.data.data ? response.data.data.map(mapDayOffRequest) : []
      }
      
      console.log('✅ Get day off requests response:', formattedResponse)
      return formattedResponse
    }
    
  } catch (error: any) {
    console.error('❌ Get day off requests error:', error)
    console.error('Error details:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url
    })
    
    // Return empty array instead of throwing error to prevent app crash
    console.warn('⚠️ Returning empty array due to error')
    return { data: [] }
  }
}

// GET DAY OFF REQUESTS BY USER
export const getDayOffRequestsByUser = async (userId: string): Promise<Response<DayOffRequest[]>> => {
  try {
    console.log(`📋 Getting day off requests for user: ${userId}`)
    const response = await axiosInstance.get<DayOffRequestsQueryResponseData>(`${DAY_OFF_REQUEST_URL}/user/${userId}`)
    
    const formattedResponse: Response<DayOffRequest[]> = {
      data: response.data.data ? response.data.data.map(mapDayOffRequest) : []
    }
    
    console.log('✅ Get user day off requests response:', formattedResponse)
    return formattedResponse
  } catch (error: any) {
    console.error('❌ Get user day off requests error:', error)
    // Return empty array instead of throwing
    return { data: [] }
  }
}

// GET DAY OFF REQUESTS FOR SUPERVISOR DASHBOARD
export const getDayOffRequestsForSupervisorDashboard = async (supervisorId: string): Promise<Response<DayOffRequest[]>> => {
  try {
    console.log(`📋 Getting supervisor dashboard requests for: ${supervisorId}`)
    const response = await axiosInstance.get<DayOffRequestsQueryResponseData>(`${DAY_OFF_REQUEST_URL}/supervisor-dashboard/${supervisorId}`)
    
    const formattedResponse: Response<DayOffRequest[]> = {
      data: response.data.data ? response.data.data.map(mapDayOffRequest) : []
    }
    
    console.log('✅ Get supervisor dashboard requests response:', formattedResponse)
    return formattedResponse
  } catch (error: any) {
    console.error('❌ Get supervisor dashboard requests error:', error)
    return { data: [] }
  }
}

// CREATE DAY OFF REQUEST
export const createDayOffRequest = async (requestData: DayOffRequestDTO): Promise<DayOffRequest> => {
  try {
    console.log('📤 Creating day off request:', requestData)
    
    const response = await axiosInstance.post<DayOffRequestResponse>(DAY_OFF_REQUEST_URL, {
      ...requestData,
      status: 'Pending'
    })
    
    console.log('✅ Create day off request response:', response.data)
    return mapDayOffRequest(response.data.data)
  } catch (error: any) {
    console.error('❌ Create day off request error:', error)
    throw new Error(error.response?.data?.message || 'Failed to create day off request')
  }
}

// UPDATE DAY OFF REQUEST STATUS
export const updateDayOffRequestStatus = async (id: string, statusData: UpdateStatusDTO): Promise<DayOffRequest> => {
  try {
    console.log(`✏️ Updating status for request ${id} to:`, statusData.status)
    
    const response = await axiosInstance.patch<DayOffRequestResponse>(
      `${DAY_OFF_REQUEST_URL}/${id}/status`,
      statusData
    )
    
    console.log('✅ Update status response:', response.data)
    return mapDayOffRequest(response.data.data)
  } catch (error: any) {
    console.error(`❌ Update status error for request ${id}:`, error)
    throw new Error(error.response?.data?.message || 'Failed to update status')
  }
}

// UPDATE DAY OFF REQUEST
export const updateDayOffRequest = async (id: string, requestData: Partial<DayOffRequestDTO>): Promise<DayOffRequest> => {
  try {
    console.log(`✏️ Updating day off request ${id}:`, requestData)
    
    const response = await axiosInstance.put<DayOffRequestResponse>(
      `${DAY_OFF_REQUEST_URL}/${id}`,
      requestData
    )
    
    console.log('✅ Update day off request full response:', response.data)
    
    // ✅ FIX: Backend ใช้ชื่อ field เป็น "request" แทน "data"
    const updatedRequest = response.data.data || response.data.request
    
    if (!updatedRequest) {
      console.error('❌ No data or request field in response:', response.data)
      throw new Error('Invalid response structure: missing data/request field')
    }
    
    console.log('📦 Data to map:', updatedRequest)
    return mapDayOffRequest(updatedRequest)
    
  } catch (error: any) {
    console.error(`❌ Update day off request error for ${id}:`, error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    throw new Error(error.response?.data?.message || error.message || 'Failed to update day off request')
  }
}

// DELETE DAY OFF REQUEST
export const deleteDayOffRequest = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`🗑️ Deleting day off request ${id}`)
    
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `${DAY_OFF_REQUEST_URL}/${id}`
    )
    
    console.log('✅ Delete day off request response:', response.data)
    return response.data
  } catch (error: any) {
    console.error(`❌ Delete day off request error for ${id}:`, error)
    throw new Error(error.response?.data?.message || 'Failed to delete day off request')
  }
}

// DELETE MULTIPLE DAY OFF REQUESTS
export const deleteSelectedDayOffRequests = async (ids: string[]): Promise<{ success: boolean }> => {
  try {
    console.log(`🗑️ Deleting multiple day off requests:`, ids)
    
    // Delete each request individually
    const deletePromises = ids.map(id => deleteDayOffRequest(id))
    await Promise.all(deletePromises)
    
    console.log('✅ Successfully deleted all requests')
    return { success: true }
  } catch (error: any) {
    console.error('❌ Error deleting multiple requests:', error)
    return { success: false }
  }
}

// GET DAY OFF REQUEST BY ID
export const getDayOffRequestById = async (id: string): Promise<DayOffRequest> => {
  try {
    console.log(`🔍 Getting day off request by ID: ${id}`)
    
    const response = await axiosInstance.get<DayOffRequestResponse>(`${DAY_OFF_REQUEST_URL}/${id}`)
    
    console.log('✅ Get day off request by ID response:', response.data)
    return mapDayOffRequest(response.data.data)
  } catch (error: any) {
    console.error(`❌ Get day off request error for ${id}:`, error)
    throw new Error(error.response?.data?.message || 'Failed to fetch day off request')
  }
}

/* =========================
   HELPER FUNCTIONS
========================= */

// Check if dates overlap with existing requests
export const checkDateOverlap = async (
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
): Promise<{ hasOverlap: boolean; overlappingRequests: DayOffRequest[] }> => {
  try {
    // เรียกข้อมูล requests ของ employee
    const response = await getDayOffRequestsByUser(employeeId)
    const requests = response.data || []
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // ตรวจสอบว่ามี request ที่ทับซ้อนกันหรือไม่
    const overlappingRequests = requests.filter((request) => {
      // ไม่นับ request ตัวเอง
      if (excludeRequestId && (request.id === excludeRequestId || request._id === excludeRequestId)) {
        return false
      }
      
      // ต้องเป็น status ที่ Approved หรือ Pending เท่านั้น
      if (request.status !== 'Accepted' && request.status !== 'Pending') {
        return false
      }
      
      const requestStart = new Date(request.start_date_time)
      const requestEnd = new Date(request.end_date_time)
      
      // ตรวจสอบว่าช่วงเวลาทับซ้อนกัน
      return (
        (start <= requestEnd && end >= requestStart) ||
        (requestStart <= end && requestEnd >= start)
      )
    })
    
    return {
      hasOverlap: overlappingRequests.length > 0,
      overlappingRequests
    }
  } catch (error) {
    console.error('Error checking date overlap:', error)
    return {
      hasOverlap: false,
      overlappingRequests: []
    }
  }
}

// Validate day off request data
export const validateDayOffRequestData = (data: DayOffRequestDTO): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!data.user_id) errors.push('User ID is required')
  if (!data.employee_id) errors.push('Employee ID is required')
  if (!data.supervisor_id || (Array.isArray(data.supervisor_id) && data.supervisor_id.length === 0)) {
    errors.push('At least one supervisor is required')
  }
  if (!data.day_off_type) errors.push('Day off type is required')
  if (!data.start_date_time) errors.push('Start date is required')
  if (!data.end_date_time) errors.push('End date is required')
  if (!data.title?.trim()) errors.push('Title is required')
  
  // Date validation
  if (data.start_date_time && data.end_date_time) {
    const startDate = new Date(data.start_date_time)
    const endDate = new Date(data.end_date_time)
    
    if (isNaN(startDate.getTime())) errors.push('Invalid start date format')
    if (isNaN(endDate.getTime())) errors.push('Invalid end date format')
    
    if (endDate < startDate) {
      errors.push('End date must be later than start date')
    }
    
    if (data.day_off_type === 'HALF_DAY' && 
        startDate.toDateString() !== endDate.toDateString()) {
      errors.push('Half day leave must be within the same day')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Export all functions as service object
export const dayOffRequestService = {
  getAllDayOffRequests,
  getDayOffRequestsAllUser,
  getDayOffRequestsByUser,
  getDayOffRequestsForSupervisorDashboard,
  createDayOffRequest,
  updateDayOffRequestStatus,
  updateDayOffRequest,
  deleteDayOffRequest,
  deleteSelectedDayOffRequests,
  getDayOffRequestById,
  checkDateOverlap,
  validateDayOffRequestData
}

// Export สำหรับ backward compatibility
export const getDayOffRequests = dayOffRequestService.getAllDayOffRequests

// Export individual functions for easier imports
export {
  getAllDayOffRequests as getDayOffRequestsQuery
}