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
const mapDayOffRequest = (request: any): DayOffRequest => {
  // ✅ ตรวจสอบว่า request มีค่าหรือไม่
  if (!request) {
    throw new Error('Cannot map null or undefined request')
  }

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
export const getDayOffRequestsAllUser = async (): Promise<DayOffRequestsAllUserResponse> => {
  try {
    const response = await axiosInstance.get<DayOffRequestsAllUserResponse>(`${DAY_OFF_REQUEST_URL}/allusers`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch day off requests')
  }
}

// GET ALL DAY OFF REQUESTS (RAW) - แก้ไขให้รองรับทั้งกรณีมี params และไม่มี
export const getAllDayOffRequests = async (params?: any): Promise<Response<DayOffRequest[]>> => {
  try {
    // ลองใช้ endpoint /allusers ก่อน ถ้าไม่ได้ค่อยใช้ endpoint หลัก
    try {
      // พยายามใช้ /allusers endpoint ที่รู้ว่าทำงานได้
      const allUsersResponse = await axiosInstance.get<DayOffRequestsAllUserResponse>(`${DAY_OFF_REQUEST_URL}/allusers`)

      // แปลง formatted response เป็น raw format พร้อม normalize user data
      const rawData: DayOffRequest[] = allUsersResponse.data.requests.map(mapDayOffRequest)
      return { data: rawData }

    } catch (allUsersError) {
      const response = await axiosInstance.get<DayOffRequestsQueryResponseData>(DAY_OFF_REQUEST_URL)

      const formattedResponse: Response<DayOffRequest[]> = {
        data: response.data.data ? response.data.data.map(mapDayOffRequest) : []
      }
      return formattedResponse
    }

  } catch (error: any) {
    // Return empty array instead of throwing error to prevent app crash
    console.warn('⚠️ Returning empty array due to error')
    return { data: [] }
  }
}

// GET DAY OFF REQUESTS BY USER
export const getDayOffRequestsByUser = async (userId: string): Promise<Response<DayOffRequest[]>> => {
  try {
    const response = await axiosInstance.get<DayOffRequestsQueryResponseData>(`${DAY_OFF_REQUEST_URL}/user/${userId}`)

    const formattedResponse: Response<DayOffRequest[]> = {
      data: response.data.data ? response.data.data.map(mapDayOffRequest) : []
    }
    return formattedResponse
  } catch (error: any) {
    return { data: [] }
  }
}

// GET DAY OFF REQUESTS FOR SUPERVISOR DASHBOARD
export const getDayOffRequestsForSupervisorDashboard = async (supervisorId: string): Promise<Response<DayOffRequest[]>> => {
  try {
    const response = await axiosInstance.get<DayOffRequestsQueryResponseData>(`${DAY_OFF_REQUEST_URL}/supervisor-dashboard/${supervisorId}`)

    const formattedResponse: Response<DayOffRequest[]> = {
      data: response.data.data ? response.data.data.map(mapDayOffRequest) : []
    }
    return formattedResponse
  } catch (error: any) {
    return { data: [] }
  }
}

// CREATE DAY OFF REQUEST
export const createDayOffRequest = async (requestData: DayOffRequestDTO & { date_off_number?: number }): Promise<DayOffRequest> => {
  try {
    // แปลง supervisor_id ให้เป็น array เสมอ
    const supervisorIdArray = Array.isArray(requestData.supervisor_id)
      ? requestData.supervisor_id
      : [requestData.supervisor_id];

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

    // เพิ่ม timeout และเพิ่ม error handling
    const response = await axiosInstance.post<DayOffRequestResponse>(DAY_OFF_REQUEST_URL, payload, {
      timeout: 10000, // 10 seconds timeout
    })

    // ตรวจสอบว่า response.data.data มีค่าหรือไม่
    if (!response.data || !response.data.data) {
      // ถ้าไม่มี data แต่มี request ใน response (กรณี backend ใช้ชื่อ field ต่างกัน)
      if (response.data?.request) {
        const mappedRequest = mapDayOffRequest(response.data.request)
        return mappedRequest
      }

      // ถ้า response มาปกติแต่ไม่มี data field
      if (response.data && typeof response.data === 'object') {
        // ลอง map response.data ตรงๆ
        const mappedRequest = mapDayOffRequest(response.data)
        return mappedRequest
      }

      throw new Error('No data received from server')
    }

    return mapDayOffRequest(response.data.data)
  } catch (error: any) {
    if (error.response) {
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
      throw new Error('No response from server. Please check your connection.')
    } else {
      throw new Error(error.message || 'Failed to create day off request')
    }
  }
}

// UPDATE DAY OFF REQUEST STATUS
export const updateDayOffRequestStatus = async (id: string, statusData: UpdateStatusDTO): Promise<DayOffRequest> => {
  try {
    const response = await axiosInstance.patch<DayOffRequestResponse>(
      `${DAY_OFF_REQUEST_URL}/${id}/status`,
      statusData
    )

    return mapDayOffRequest(response.data.data)
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update status')
  }
}

// UPDATE DAY OFF REQUEST
export const updateDayOffRequest = async (id: string, requestData: Partial<DayOffRequestDTO>): Promise<DayOffRequest> => {
  try {
    const response = await axiosInstance.put<DayOffRequestResponse>(
      `${DAY_OFF_REQUEST_URL}/${id}`,
      requestData
    )

    // ✅ FIX: Backend ใช้ชื่อ field เป็น "request" แทน "data"
    const updatedRequest = response.data.data || response.data.request

    if (!updatedRequest) {
      throw new Error('Invalid response structure: missing data/request field')
    }

    return mapDayOffRequest(updatedRequest)

  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to update day off request')
  }
}

// DELETE DAY OFF REQUEST
export const deleteDayOffRequest = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `${DAY_OFF_REQUEST_URL}/${id}`
    )

    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete day off request')
  }
}

// DELETE MULTIPLE DAY OFF REQUESTS
export const deleteSelectedDayOffRequests = async (ids: string[]): Promise<{ success: boolean }> => {
  try {
    // Delete each request individually
    const deletePromises = ids.map(id => deleteDayOffRequest(id))
    await Promise.all(deletePromises)
    return { success: true }
  } catch (error: any) {
    return { success: false }
  }
}

export const getDayOffRequestById = async (id: string): Promise<FormattedDayOffRequest> => {
  try {
    // ใช้ endpoint หลักสำหรับดึงข้อมูลโดย ID
    const response = await axiosInstance.get(`${DAY_OFF_REQUEST_URL}/${id}`);

    // ดึงข้อมูล request จาก response
    let requestData = response.data.data || response.data.request || response.data;

    if (!requestData) {
      throw new Error('No request data found');
    }

    // Ensure proper ID structure
    if (!requestData._id && !requestData.id) {
      requestData._id = id;
    }

    // Ensure supervisor_id is properly formatted
    let supervisorId = requestData.supervisor_id;
    if (supervisorId) {
      if (Array.isArray(supervisorId)) {
        // Extract IDs from supervisor objects if needed
        supervisorId = supervisorId.map((sup: any) => {
          if (sup && typeof sup === 'object') {
            return sup._id || sup.id || sup;
          }
          return sup;
        });
      }
    }

    // Ensure employee_id is string
    let employeeId = requestData.employee_id;
    if (employeeId && typeof employeeId === 'object') {
      employeeId = employeeId._id || employeeId.id || '';
    }

    const formattedRequest: FormattedDayOffRequest = {
      ...requestData,
      _id: requestData._id || requestData.id,
      id: requestData._id || requestData.id,
      employee_id: employeeId,
      supervisor_id: supervisorId,
      employee_name: requestData.employee_name || 'N/A',
      employee_email: requestData.employee_email || '',
      supervisor_name: requestData.supervisor_name || 'N/A',
      department_name: requestData.department_name || 'N/A',
      user_name: requestData.user_name || 'N/A',
      status: requestData.status || 'Pending'
    };

    return formattedRequest;

  } catch (error: any) {
    throw new Error(`Failed to fetch request ${id}: ${error.message || 'Unknown error'}`);
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
