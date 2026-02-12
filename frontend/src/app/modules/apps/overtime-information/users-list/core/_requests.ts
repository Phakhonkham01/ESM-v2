// src/app/modules/apps/request-ot-field-work-user/users-list/core/_requests.ts
import axios, { AxiosResponse } from 'axios'
import { ID } from '../../../../../../_metronic/helpers'
import { 
  RequestOTFieldWork, 
  RequestOTFieldWorkDTO,
  RequestOTFieldWorksQueryResponse 
} from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
const REQUEST_URL = `${API_URL}/requestOTandFieldWorkRoutes`

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

/* =========================
   INTERFACES
========================= */

export interface RequestQueryResponse {
  success: boolean
  count: number
  data: RequestOTFieldWork[]
}

export interface RequestResponse {
  success: boolean
  message?: string
  data: RequestOTFieldWork
}

interface ApiErrorResponse {
  response?: {
    status?: number
    data?: {
      message?: string
    }
  }
  message?: string
}

// ✅ เพิ่ม interface สำหรับ backend response
interface BackendRequestsResponse {
  requests: RequestOTFieldWork[]
}

interface BackendRequestResponse {
  request: RequestOTFieldWork
}

/* =========================
   HELPERS
========================= */

const mapRequest = (request: RequestOTFieldWork & { _id?: string }): RequestOTFieldWork => ({
  ...request,
  id: request._id || request.id,
})

/* =========================
   REQUEST OT/FIELD WORK REQUESTS
========================= */

// GET ALL REQUESTS - ✅ UPDATED to populate user with department
export const getRequests = async (query?: string): Promise<RequestOTFieldWorksQueryResponse> => {
  try {
    const baseUrl = query ? `${REQUEST_URL}?${query}` : REQUEST_URL
    const url = baseUrl.includes('?') 
      ? `${baseUrl}&populate=user_id` 
      : `${baseUrl}?populate=user_id`
    
    const { data }: AxiosResponse<BackendRequestsResponse> = await axios.get(url)
    const requestsArray = data.requests || []
    
    return {
      data: requestsArray.map((request: RequestOTFieldWork & { _id?: string }) => 
        mapRequest(request)
      ),
    }
  } catch (error: unknown) {
    console.error('❌ Get requests error:', error)
    throw error
  }
}

// GET REQUEST BY ID - ✅ UPDATED to populate user with department
export const getRequestById = async (id: ID): Promise<RequestOTFieldWork> => {
  try {
    const { data }: AxiosResponse<BackendRequestResponse> = await axios.get(
      `${REQUEST_URL}/${id}?populate=user_id`
    )
    
    return mapRequest(data.request)
  } catch (error: unknown) {
    console.error(`❌ Get request ${id} error:`, error)
    throw error
  }
}

// CREATE REQUEST
interface CreateRequestResponse {
  message?: string
  request: RequestOTFieldWork & { _id: string }
}

export const createRequest = async (
  requestData: RequestOTFieldWorkDTO
): Promise<RequestOTFieldWork> => {
  try {
    const { data }: AxiosResponse<CreateRequestResponse> = await axios.post(
      REQUEST_URL,
      requestData
    )
    
    return mapRequest(data.request)
  } catch (error: unknown) {
    console.error('❌ Create request error:', {
      requestData,
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status
    })
    
    const apiError = error as ApiErrorResponse
    
    if (apiError.response?.data?.message) {
      const enhancedError = new Error(apiError.response.data.message)
      ;(enhancedError as any).response = apiError.response
      throw enhancedError
    }
    
    throw error
  }
}

// UPDATE REQUEST
interface UpdateRequestResponse {
  message?: string
  request: RequestOTFieldWork & { _id: string }
}

export const updateRequest = async ({
  id,
  data: requestData,
}: {
  id: string
  data: RequestOTFieldWorkDTO
}): Promise<RequestOTFieldWork> => {
  try {
    const { data }: AxiosResponse<UpdateRequestResponse> = await axios.put(
      `${REQUEST_URL}/${id}`,
      requestData
    )
    
    return mapRequest(data.request)
  } catch (error: unknown) {
    console.error(`❌ Update request ${id} error:`, {
      requestData,
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status
    })
    
    const apiError = error as ApiErrorResponse
    
    if (apiError.response?.data?.message) {
      const enhancedError = new Error(apiError.response.data.message)
      ;(enhancedError as any).response = apiError.response
      throw enhancedError
    }
    
    throw error
  }
}

// UPDATE REQUEST STATUS
export const updateRequestStatus = async ({
  id,
  status,
}: {
  id: string
  status: 'Pending' | 'Accepted' | 'Rejected'
}): Promise<RequestOTFieldWork> => {
  try {
    const { data }: AxiosResponse<UpdateRequestResponse> = await axios.patch(
      `${REQUEST_URL}/${id}/status`,
      { status }
    )
    
    return mapRequest(data.request)
  } catch (error: unknown) {
    console.error(`❌ Update request ${id} status error:`, error)
    
    const apiError = error as ApiErrorResponse
    
    if (apiError.response?.data?.message) {
      const enhancedError = new Error(apiError.response.data.message)
      ;(enhancedError as any).response = apiError.response
      throw enhancedError
    }
    
    throw error
  }
}

// DELETE REQUEST
export const deleteRequest = async (requestId: ID): Promise<void> => {
  try {
    await axios.delete(`${REQUEST_URL}/${requestId}`)
  } catch (error: unknown) {
    console.error(`❌ Delete request ${requestId} error:`, {
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status
    })
    
    const apiError = error as ApiErrorResponse
    
    if (apiError.response?.status === 404) {
      throw new Error('Request not found')
    }
    
    if (apiError.response?.data?.message) {
      throw new Error(apiError.response.data.message)
    }
    
    throw error
  }
}

// DELETE MULTIPLE REQUESTS
export const deleteSelectedRequests = async (
  requestIds: ID[]
): Promise<void> => {
  await Promise.all(requestIds.map(deleteRequest))
}

/* =========================
   QUERY HELPERS
========================= */

// GET REQUESTS BY USER - ✅ UPDATED to populate
export const getRequestsByUser = async (userId: string): Promise<RequestOTFieldWork[]> => {
  try {
    const { data }: AxiosResponse<BackendRequestsResponse> = await axios.get(
      `${REQUEST_URL}/user/${userId}?populate=user_id`
    )
    
    return (data.requests || []).map((request: RequestOTFieldWork & { _id?: string }) => 
      mapRequest(request)
    )
  } catch (error: unknown) {
    console.error('❌ Get requests by user error:', error)
    throw error
  }
}

// GET REQUESTS BY SUPERVISOR - ✅ UPDATED to populate
export const getRequestsBySupervisor = async (supervisorId: string): Promise<RequestOTFieldWork[]> => {
  try {
    const { data }: AxiosResponse<BackendRequestsResponse> = await axios.get(
      `${REQUEST_URL}/supervisor/${supervisorId}?populate=user_id`
    )
    
    return (data.requests || []).map((request: RequestOTFieldWork & { _id?: string }) => 
      mapRequest(request)
    )
  } catch (error: unknown) {
    console.error('❌ Get requests by supervisor error:', error)
    throw error
  }
}

// GET REQUESTS BY STATUS
export const getRequestsByStatus = async (
  status: 'Pending' | 'Accepted' | 'Rejected'
): Promise<RequestOTFieldWork[]> => {
  try {
    const response = await getRequests(`status=${status}`)
    return response.data || []
  } catch (error: unknown) {
    console.error('❌ Get requests by status error:', error)
    throw error
  }
}

// GET REQUESTS BY DATE RANGE
export const getRequestsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<RequestOTFieldWork[]> => {
  try {
    const response = await getRequests(`startDate=${startDate}&endDate=${endDate}`)
    return response.data || []
  } catch (error: unknown) {
    console.error('❌ Get requests by date range error:', error)
    throw error
  }
}

// GET REQUESTS BY TITLE
export const getRequestsByTitle = async (
  title: 'OT' | 'FIELD_WORK'
): Promise<RequestOTFieldWork[]> => {
  try {
    const response = await getRequests(`title=${title}`)
    return response.data || []
  } catch (error: unknown) {
    console.error('❌ Get requests by title error:', error)
    throw error
  }
}