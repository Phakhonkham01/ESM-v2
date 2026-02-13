import axios, { AxiosResponse } from 'axios'
import { ID, Response } from '../../../../../../_metronic/helpers'
import {
  DayOffRequest,
  DayOffRequestDTO,
  UpdateStatusDTO,
  FormattedDayOffRequest,
  formatDayOffRequest,
} from './_models'

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

  return userData
}

// Helper function to map day off request
const mapDayOffRequest = (request: any): DayOffRequest => {
  if (!request) {
    throw new Error('Cannot map null or undefined request')
  }
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

// GET FILTERED DAY OFF REQUESTS
export const getFilteredDayOffRequests = async (params?: {
  search?: string
  year?: string
  month?: string
  department?: string
  status?: string
  userId?: string
  page?: number
  limit?: number
}): Promise<{ data: DayOffRequest[]; pagination: any }> => {
  try {
    const queryParams = new URLSearchParams()

    if (params?.search) queryParams.append('search', params.search)
    if (params?.year) queryParams.append('year', params.year)
    if (params?.month) queryParams.append('month', params.month)
    if (params?.department && params.department !== 'All Departments') {
      queryParams.append('department', params.department)
    }
    if (params?.status && params.status !== 'All Status') {
      queryParams.append('status', params.status)
    }
    if (params?.userId) queryParams.append('userId', params.userId)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    const url = `${DAY_OFF_REQUEST_URL}/filtered${queryString ? `?${queryString}` : ''}`

    const response = await axiosInstance.get(url)

    let requests: DayOffRequest[] = []
    let pagination = {
      page: params?.page || 1,
      limit: params?.limit || 10,
      total: 0,
      totalPages: 1
    }

    if (response.data) {
      // Handle different response structures
      const rawRequests = response.data.requests || response.data.data || []
      requests = rawRequests.map((request: any) => mapDayOffRequest(request))

      pagination = {
        page: response.data.page || params?.page || 1,
        limit: response.data.limit || params?.limit || 10,
        total: response.data.total || response.data.count || rawRequests.length || 0,
        totalPages: response.data.totalPages || Math.ceil((response.data.total || rawRequests.length) / (params?.limit || 10)) || 1
      }
    }

    return {
      data: requests,
      pagination
    }
  } catch (error: any) {
    console.error('Error fetching filtered requests:', error)
    return {
      data: [],
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        total: 0,
        totalPages: 0
      }
    }
  }
}

// GET ALL DAY OFF REQUESTS (FORMATTED) - สำหรับตาราง
export const getDayOffRequestsAllUser = async (): Promise<DayOffRequestsAllUserResponse> => {
  try {
    const response = await axiosInstance.get<DayOffRequestsAllUserResponse>(`${DAY_OFF_REQUEST_URL}/allusers`)
    const formattedRequests: DayOffRequest[] = response.data.requests.map(request => {
      return mapDayOffRequest(request)
    })

    return {
      success: true,
      count: formattedRequests.length,
      requests: formattedRequests
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch day off requests')
  }
}

// GET ALL DAY OFF REQUESTS (RAW) - แก้ไขให้รองรับทั้งกรณีมี params และไม่มี
export const getAllDayOffRequests = async (params?: any): Promise<Response<DayOffRequest[]>> => {
  try {
    try {
      const response = await axiosInstance.get<DayOffRequestsAllUserResponse>(`${DAY_OFF_REQUEST_URL}/allusers`)
      const formattedData: DayOffRequest[] = response.data.requests.map(request => mapDayOffRequest(request))

      return {
        data: formattedData
      }
    } catch (allUsersError) {
      throw allUsersError
    }

  } catch (error: any) {
    return { data: [] }
  }
}

// GET DAY OFF REQUESTS BY USER
export const getDayOffRequestsByUser = async (userId: string): Promise<Response<DayOffRequest[]>> => {
  try {
    const response = await axiosInstance.get<DayOffRequestsQueryResponseData>(`${DAY_OFF_REQUEST_URL}/user/${userId}`)
    const requests = response.data.data || response.data.requests || []
    const formattedData: DayOffRequest[] = requests.map(request => mapDayOffRequest(request))
    return { data: formattedData }
  } catch (error: any) {
    return { data: [] }
  }
}

// GET DAY OFF REQUESTS FOR SUPERVISOR DASHBOARD
export const getDayOffRequestsForSupervisorDashboard = async (supervisorId: string): Promise<Response<DayOffRequest[]>> => {
  try {
    const response = await axiosInstance.get<DayOffRequestsQueryResponseData>(`${DAY_OFF_REQUEST_URL}/supervisor-dashboard/${supervisorId}`)

    const requests = response.data.data || response.data.requests || []
    const formattedData: DayOffRequest[] = requests.map(request => mapDayOffRequest(request))

    return { data: formattedData }
  } catch (error: any) {
    return { data: [] }
  }
}

// CREATE DAY OFF REQUEST
export const createDayOffRequest = async (requestData: DayOffRequestDTO & { date_off_number?: number }): Promise<DayOffRequest> => {
  try {
    const supervisorIdArray = Array.isArray(requestData.supervisor_id)
      ? requestData.supervisor_id
      : [requestData.supervisor_id]

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

    if (requestData.date_off_number !== undefined) {
      payload.date_off_number = requestData.date_off_number
    }

    const response = await axiosInstance.post<DayOffRequestResponse>(DAY_OFF_REQUEST_URL, payload, {
      timeout: 10000,
    })

    if (!response.data || (!response.data.data && !response.data.request)) {
      throw new Error('No data received from server')
    }

    const responseData = response.data.data || response.data.request
    return mapDayOffRequest(responseData)

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

    const responseData = response.data.data || response.data.request
    return mapDayOffRequest(responseData)
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
    const responseData = response.data.data || response.data.request
    if (!responseData) {
      throw new Error('Invalid response structure: missing data')
    }

    return mapDayOffRequest(responseData)

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

// GET DAY OFF REQUEST BY ID
export const getDayOffRequestById = async (id: string): Promise<FormattedDayOffRequest> => {
  try {
    const response = await axios.get(`${API_URL}/day-off-requests/${id}`)
    const data = response.data.data || response.data
    return formatDayOffRequest(data)
  } catch (error) {
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
    const response = await getDayOffRequestsByUser(employeeId)
    const requests = response.data || []
    const start = new Date(startDate)
    const end = new Date(endDate)
    const overlappingRequests = requests.filter((request) => {
      if (excludeRequestId && (request.id === excludeRequestId || request._id === excludeRequestId)) {
        return false
      }
      if (request.status !== 'Accepted' && request.status !== 'Pending') {
        return false
      }

      const requestStart = new Date(request.start_date_time)
      const requestEnd = new Date(request.end_date_time)

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