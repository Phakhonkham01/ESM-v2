import axios, { AxiosResponse } from 'axios'
import { ID, Response } from '../../../../../../_metronic/helpers'
import { 
  DayOffRequest, 
  DayOffRequestDTO, 
  UpdateStatusDTO, 
  FormattedDayOffRequest,
  formatDayOffRequest,
  extractUserInfo
} from './_models'

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
  requests: DayOffRequest[]
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
  requests?: DayOffRequest[]
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
      department_id: userData.department_id,
      position_id: userData.position_id,
    }
  }

  // If it's just an ID string
  return userData
}

// Helper function to map day off request
const mapDayOffRequest = (request: any): DayOffRequest => {
  // ✅ ตรวจสอบว่า request มีค่าหรือไม่
  if (!request) {
    console.error('❌ mapDayOffRequest received null/undefined request')
    throw new Error('Cannot map null or undefined request')
  }

  console.log('🔍 Raw request data for mapping:', {
    _id: request._id,
    id: request.id,
    supervisor_id: request.supervisor_id,
    supervisor_id_type: typeof request.supervisor_id,
    is_supervisor_array: Array.isArray(request.supervisor_id),
  })

  // ใช้ formatDayOffRequest เพื่อแปลงเป็น FormattedDayOffRequest ก่อน
  const formatted = formatDayOffRequest(request)
  
  return {
    ...request,
    ...formatted,
    id: request._id || request.id,
    _id: request._id || request.id,
    employee_id: normalizeUserData(request.employee_id),
    supervisor_id: Array.isArray(request.supervisor_id)
      ? request.supervisor_id.map(normalizeUserData)
      : [normalizeUserData(request.supervisor_id)],
    user_id: normalizeUserData(request.user_id),
  }
}

/* =========================
   DAY OFF REQUEST REQUESTS
========================= */

// GET ALL DAY OFF REQUESTS (FORMATTED) - สำหรับตาราง
export const getDayOffRequestsAllUser = async (): Promise<DayOffRequestsAllUserResponse> => {
  try {
    console.log('📋 Fetching formatted day off requests from:', `${DAY_OFF_REQUEST_URL}/allusers`)
    const response = await axiosInstance.get<DayOffRequestsAllUserResponse>(`${DAY_OFF_REQUEST_URL}/allusers`)

    // ✅ FORMAT DATA: แปลงข้อมูลดิบเป็น FormattedDayOffRequest
    const formattedRequests: DayOffRequest[] = response.data.requests.map(request => {
      return mapDayOffRequest(request)
    })

    console.log('✅ Get all day off requests response:', {
      count: formattedRequests.length,
      sample: formattedRequests[0]
    })

    return {
      success: true,
      count: formattedRequests.length,
      requests: formattedRequests
    }
  } catch (error: any) {
    console.error('❌ Get all day off requests error:', error)
    throw new Error(error.response?.data?.message || 'Failed to fetch day off requests')
  }
}

// GET ALL DAY OFF REQUESTS (RAW) - แก้ไขให้รองรับทั้งกรณีมี params และไม่มี
export const getAllDayOffRequests = async (params?: any): Promise<Response<DayOffRequest[]>> => {
  try {
    console.log('📋 Fetching raw day off requests with params:', params)

    try {
      // พยายามใช้ /allusers endpoint
      const response = await axiosInstance.get<DayOffRequestsAllUserResponse>(`${DAY_OFF_REQUEST_URL}/allusers`)

      const formattedData: DayOffRequest[] = response.data.requests.map(request => mapDayOffRequest(request))

      console.log('✅ Get day off requests response:', { 
        count: formattedData.length,
        sample: formattedData[0] 
      })

      return { 
        data: formattedData 
      }

    } catch (allUsersError) {
      console.log('⚠️ /allusers endpoint failed, trying main endpoint...')
      throw allUsersError
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

    const requests = response.data.data || response.data.requests || []
    const formattedData: DayOffRequest[] = requests.map(request => mapDayOffRequest(request))

    console.log('✅ Get user day off requests response:', {
      count: formattedData.length,
      sample: formattedData[0]
    })

    return { data: formattedData }
  } catch (error: any) {
    console.error('❌ Get user day off requests error:', error)
    return { data: [] }
  }
}

// GET DAY OFF REQUESTS FOR SUPERVISOR DASHBOARD
export const getDayOffRequestsForSupervisorDashboard = async (supervisorId: string): Promise<Response<DayOffRequest[]>> => {
  try {
    console.log(`📋 Getting supervisor dashboard requests for: ${supervisorId}`)
    const response = await axiosInstance.get<DayOffRequestsQueryResponseData>(`${DAY_OFF_REQUEST_URL}/supervisor-dashboard/${supervisorId}`)

    const requests = response.data.data || response.data.requests || []
    const formattedData: DayOffRequest[] = requests.map(request => mapDayOffRequest(request))

    console.log('✅ Get supervisor dashboard requests response:', {
      count: formattedData.length,
      sample: formattedData[0]
    })

    return { data: formattedData }
  } catch (error: any) {
    console.error('❌ Get supervisor dashboard requests error:', error)
    return { data: [] }
  }
}

// CREATE DAY OFF REQUEST
export const createDayOffRequest = async (requestData: DayOffRequestDTO & { date_off_number?: number }): Promise<DayOffRequest> => {
  try {
    console.log('📤 Creating day off request with data:', JSON.stringify(requestData, null, 2))

    // แปลง supervisor_id ให้เป็น array เสมอ
    const supervisorIdArray = Array.isArray(requestData.supervisor_id)
      ? requestData.supervisor_id
      : [requestData.supervisor_id]

    console.log('🔍 Converted supervisor_id to array:', supervisorIdArray)

    const payload: any = {
      user_id: requestData.user_id,
      employee_id: requestData.employee_id,
      supervisor_id: supervisorIdArray,
      day_off_type: requestData.day_off_type,
      start_date_time: requestData.start_date_time,
      end_date_time: requestData.end_date_time,
      title: requestData.title,
      status: 'Pending'
    }

    // เพิ่ม date_off_number ถ้ามี
    if (requestData.date_off_number !== undefined) {
      payload.date_off_number = requestData.date_off_number
    }

    console.log('📦 Final payload to send:', JSON.stringify(payload, null, 2))
    console.log('🚀 Sending to:', DAY_OFF_REQUEST_URL)

    const response = await axiosInstance.post<DayOffRequestResponse>(DAY_OFF_REQUEST_URL, payload, {
      timeout: 10000,
    })

    console.log('✅ Create day off request success:', {
      status: response.status,
      data: response.data
    })

    // ตรวจสอบว่ามี data ใน response หรือไม่
    if (!response.data || (!response.data.data && !response.data.request)) {
      console.error('❌ No data in response:', response.data)
      throw new Error('No data received from server')
    }

    const responseData = response.data.data || response.data.request
    return mapDayOffRequest(responseData)

  } catch (error: any) {
    console.error('❌ Create day off request error details:')

    if (error.response) {
      console.error('🔴 Response status:', error.response.status)
      console.error('🔴 Response data:', error.response.data)
      
      let errorMessage = 'Failed to create day off request'
      if (error.response.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response.data?.errors) {
        const errors = error.response.data.errors
        errorMessage = errors.map((err: any) => `${err.field}: ${err.message}`).join(', ')
      }

      throw new Error(errorMessage)
    } else if (error.request) {
      console.error('🔴 No response received:', error.request)
      throw new Error('No response from server. Please check your connection.')
    } else {
      console.error('🔴 Error setting up request:', error.message)
      throw new Error(error.message || 'Failed to create day off request')
    }
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
    
    const responseData = response.data.data || response.data.request
    return mapDayOffRequest(responseData)
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

    const responseData = response.data.data || response.data.request

    if (!responseData) {
      console.error('❌ No data in response:', response.data)
      throw new Error('Invalid response structure: missing data')
    }

    return mapDayOffRequest(responseData)

  } catch (error: any) {
    console.error(`❌ Update day off request error for ${id}:`, error)
    console.error('Error response:', error.response?.data)
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
export const getDayOffRequestById = async (id: string): Promise<FormattedDayOffRequest> => {
  try {
    const response = await axios.get(`${API_URL}/day-off-requests/${id}`)
    const data = response.data.data || response.data

    // ใช้ formatDayOffRequest เพื่อแปลงข้อมูล
    return formatDayOffRequest(data)
  } catch (error) {
    console.error('Error fetching day off request:', error)
    throw error
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