// src/app/modules/apps/day-off-request/core/_requests.ts
import axios, { AxiosResponse } from 'axios'
import { ID, Response } from '../../../../../../_metronic/helpers'
import { DayOffRequest, DayOffRequestDTO, UpdateStatusDTO, FormattedDayOffRequest } from './_models'

// ใช้ environment variable หรือค่า default
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8001/api'
const DAY_OFF_REQUEST_URL = `${API_URL}/dayoffrequests`

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
}

interface DayOffRequestsQueryResponseData {
  success: boolean
  count: number
  data: DayOffRequest[]
}

// Helper function to map day off request
const mapDayOffRequest = (request: any): DayOffRequest => {
  return {
    ...request,
    id: request._id || request.id,
    _id: request._id || request.id,
  }
}

/* =========================
   DAY OFF REQUEST REQUESTS
========================= */

// GET ALL DAY OFF REQUESTS (FORMATTED) - สำหรับตาราง
export const getDayOffRequestsAllUser = async (): Promise<DayOffRequestsAllUserResponse> => {
  try {
    console.log('📋 Fetching formatted day off requests from:', `${DAY_OFF_REQUEST_URL}/all-users`)
    const response = await axiosInstance.get<DayOffRequestsAllUserResponse>(`${DAY_OFF_REQUEST_URL}/all-users`)
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
    
    // ลองใช้ endpoint /all-users ก่อน ถ้าไม่ได้ค่อยใช้ endpoint หลัก
    let response: AxiosResponse<any>
    
    try {
      // พยายามใช้ /all-users endpoint ที่รู้ว่าทำงานได้
      const allUsersResponse = await axiosInstance.get<DayOffRequestsAllUserResponse>(`${DAY_OFF_REQUEST_URL}/all-users`)
      
      // แปลง formatted response เป็น raw format
      const rawData: DayOffRequest[] = allUsersResponse.data.requests.map((req: any) => ({
        ...req,
        id: req._id || req.id,
        _id: req._id || req.id,
      }))
      
      console.log('✅ Get day off requests response (from all-users):', { data: rawData })
      return { data: rawData }
      
    } catch (allUsersError) {
      console.log('⚠️ /all-users endpoint failed, trying main endpoint...')
      
      // ถ้า /all-users ไม่ได้ ให้ลองใช้ endpoint หลักโดยไม่มี query params
      response = await axiosInstance.get<DayOffRequestsQueryResponseData>(DAY_OFF_REQUEST_URL)
      
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
    
    console.log('✅ Update day off request response:', response.data)
    return mapDayOffRequest(response.data.data)
  } catch (error: any) {
    console.error(`❌ Update day off request error for ${id}:`, error)
    throw new Error(error.response?.data?.message || 'Failed to update day off request')
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