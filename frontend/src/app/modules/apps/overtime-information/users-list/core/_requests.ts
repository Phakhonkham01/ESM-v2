// src/app/modules/apps/request-ot-field-work-user/users-list/core/_requests.ts
import axios, { AxiosResponse, AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios'
import { ID, Response } from '../../../../../../_metronic/helpers'
import {
  RequestOTFieldWork,
  RequestOTFieldWorkDTO,
} from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
const REQUEST_URL = `${API_URL}/requestOTandFieldWorkRoutes`

/* =========================
   AXIOS INSTANCE CONFIGURATION
========================= */

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
})

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config
  },
  (error: AxiosError) => {
    console.error('❌ [API] Request error:', error)
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    if (error.response) {
      console.error('❌ [API] Response error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      })

      switch (error.response.status) {
        case 401:
          console.error('Unauthorized access - redirect to login')
          break
        case 403:
          console.error('Forbidden access')
          break
        case 404:
          console.error('Resource not found')
          break
        case 500:
          console.error('Internal server error')
          break
        default:
          console.error('Unhandled error status')
      }
    } else if (error.request) {
      console.error('❌ [API] No response received:', error.request)
    } else {
      console.error('❌ [API] Request setup error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

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
      errors?: Record<string, string[]>
    }
  }
  message?: string
}

interface BackendRequestsResponse {
  requests?: RequestOTFieldWork[]
  data?: RequestOTFieldWork[]
  total?: number
  count?: number
  page?: number
  limit?: number
  totalPages?: number
  success?: boolean
  message?: string
}

interface BackendRequestResponse {
  request: RequestOTFieldWork
  success?: boolean
  message?: string
}

interface CreateUpdateResponse {
  message?: string
  request: RequestOTFieldWork & { _id: string }
  success?: boolean
}

export interface Department {
  id?: ID
  _id?: string
  department_name: string
  department_code?: string
  description?: string
  status?: 'active' | 'inactive'
  created_at?: Date | string
  updated_at?: Date | string
}

export interface GetRequestsParams {
  search?: string
  year?: string
  month?: string
  department?: string
  status?: string
  userId?: string
  page?: number
  limit?: number
  sort?: string
  total?: string
  items_per_page?: string
  order?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
  title?: 'OT' | 'FIELD_WORK'
  populate?: string
}

/* =========================
   TYPE GUARDS & HELPERS
========================= */

type ValidItemsPerPage = 8 | 10 | 30 | 50 | 100
const VALID_ITEMS_PER_PAGE = [8, 10, 30, 50, 100] as const

const isValidItemsPerPage = (value: number): value is ValidItemsPerPage => {
  return VALID_ITEMS_PER_PAGE.includes(value as ValidItemsPerPage)
}

const mapRequest = (request: RequestOTFieldWork & { _id?: string }): RequestOTFieldWork => ({
  ...request,
  id: request._id || request.id,
})

// ✅ FIX: Default to 8
const normalizeItemsPerPage = (limit: number | undefined): ValidItemsPerPage => {
  if (!limit) return 8

  if (isValidItemsPerPage(limit)) {
    return limit
  }

  // Default to 8 if not a valid value
  return 8
}

const buildPaginationLinks = (
  page: number,
  totalPages: number
): Array<{ label: string; active: boolean; url: string | null; page: number | null }> => {
  const links = []

  links.push({
    label: '&laquo; Previous',
    active: false,
    url: page > 1 ? `?page=${page - 1}` : null,
    page: page > 1 ? page - 1 : null,
  })

  for (let i = 1; i <= totalPages; i++) {
    links.push({
      label: String(i),
      active: i === page,
      url: `?page=${i}`,
      page: i,
    })
  }

  links.push({
    label: 'Next &raquo;',
    active: false,
    url: page < totalPages ? `?page=${page + 1}` : null,
    page: page < totalPages ? page + 1 : null,
  })

  return links
}

const appendQueryParam = (
  params: URLSearchParams, 
  key: string, 
  value: string | number | boolean | undefined | null
) => {
  if (value !== undefined && value !== null && value !== '') {
    params.append(key, value.toString())
  }
}

const extractRequestsFromResponse = (responseData: any): RequestOTFieldWork[] => {
  if (responseData.requests && Array.isArray(responseData.requests)) {
    return responseData.requests
  }
  if (responseData.data && Array.isArray(responseData.data)) {
    return responseData.data
  }
  if (Array.isArray(responseData)) {
    return responseData
  }
  return []
}

// ✅ FIX: Correct fallbacks — total→0, page→1, limit→8
const extractPaginationInfo = (responseData: any, params?: GetRequestsParams) => {
  const total = responseData.total || responseData.count || 0
  const page = responseData.page || params?.page || 1
  const limit = responseData.limit || params?.limit || 8
  const totalPages = responseData.totalPages || Math.ceil(total / limit) || 1

  return { total, page, limit, totalPages }
}

/* =========================
   REQUEST OT/FIELD WORK REQUESTS
========================= */

/**
 * GET ALL REQUESTS with filtering and pagination
 */
export const getRequests = async (
  params?: GetRequestsParams
): Promise<Response<RequestOTFieldWork[]>> => {
  try {
    const queryParams = new URLSearchParams()

    appendQueryParam(queryParams, 'search', params?.search)
    appendQueryParam(queryParams, 'year', params?.year)
    appendQueryParam(queryParams, 'month', params?.month)
    appendQueryParam(queryParams, 'startDate', params?.startDate)
    appendQueryParam(queryParams, 'endDate', params?.endDate)
    appendQueryParam(queryParams, 'title', params?.title)

    if (params?.department &&
      params.department !== 'All Departments' &&
      params.department !== '') {
      appendQueryParam(queryParams, 'department', params.department)
    }

    if (params?.status &&
      params.status !== 'All Status' &&
      params.status !== '') {
      appendQueryParam(queryParams, 'status', params.status)
    }

    appendQueryParam(queryParams, 'userId', params?.userId)

    // ✅ FIX: Always send page and limit explicitly with defaults
    appendQueryParam(queryParams, 'page', params?.page || 1)
    appendQueryParam(queryParams, 'limit', params?.limit || 8)

    appendQueryParam(queryParams, 'sort', params?.sort)
    appendQueryParam(queryParams, 'order', params?.order)
    appendQueryParam(queryParams, 'populate', params?.populate || 'user_id')

    const queryString = queryParams.toString()
    const url = `${REQUEST_URL}${queryString ? `?${queryString}` : ''}`
    
    const response = await axiosInstance.get(url)
    
    const rawRequests = extractRequestsFromResponse(response.data)
    const requests: RequestOTFieldWork[] = rawRequests.map((r: any) => mapRequest(r))

    const { total, page, limit, totalPages } = extractPaginationInfo(response.data, params)

    return {
      data: requests,
      payload: {
        pagination: {
          page,
          items_per_page: normalizeItemsPerPage(limit),
          links: buildPaginationLinks(page, totalPages),
        },
      },
    }
  } catch (error: any) {
    console.error('❌ Get requests error:', error)

    return {
      data: [],
      payload: {
        pagination: {
          page: params?.page || 1,
          items_per_page: normalizeItemsPerPage(params?.limit),
          links: buildPaginationLinks(1, 1),
        },
      },
    }
  }
}

/**
 * GET REQUEST BY ID
 */
export const getRequestById = async (id: ID): Promise<RequestOTFieldWork> => {
  try {
    const { data }: AxiosResponse<BackendRequestResponse> = await axiosInstance.get(
      `${REQUEST_URL}/${id}?populate=user_id`
    )

    if (!data.request) {
      throw new Error('Request not found')
    }

    return mapRequest(data.request)
  } catch (error: unknown) {
    console.error(`❌ Get request ${id} error:`, error)
    throw error
  }
}

/**
 * CREATE REQUEST
 */
export const createRequest = async (
  requestData: RequestOTFieldWorkDTO
): Promise<RequestOTFieldWork> => {
  try {
    const { data }: AxiosResponse<CreateUpdateResponse> = await axiosInstance.post(
      REQUEST_URL,
      requestData
    )

    if (!data.request) {
      throw new Error('Failed to create request: No data returned')
    }

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
      ;(enhancedError as any).errors = apiError.response.data.errors
      throw enhancedError
    }

    throw error
  }
}

/**
 * UPDATE REQUEST
 */
export const updateRequest = async ({
  id,
  data: requestData,
}: {
  id: string
  data: RequestOTFieldWorkDTO
}): Promise<RequestOTFieldWork> => {
  try {
    const { data }: AxiosResponse<CreateUpdateResponse> = await axiosInstance.put(
      `${REQUEST_URL}/${id}`,
      requestData
    )

    if (!data.request) {
      throw new Error('Failed to update request: No data returned')
    }

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
      ;(enhancedError as any).errors = apiError.response.data.errors
      throw enhancedError
    }

    throw error
  }
}

/**
 * UPDATE REQUEST STATUS
 */
export const updateRequestStatus = async ({
  id,
  status,
}: {
  id: string
  status: 'Pending' | 'Accepted' | 'Rejected'
}): Promise<RequestOTFieldWork> => {
  try {
    const { data }: AxiosResponse<CreateUpdateResponse> = await axiosInstance.patch(
      `${REQUEST_URL}/${id}/status`,
      { status }
    )

    if (!data.request) {
      throw new Error('Failed to update request status: No data returned')
    }

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

/**
 * DELETE REQUEST
 */
export const deleteRequest = async (requestId: ID): Promise<void> => {
  try {
    await axiosInstance.delete(`${REQUEST_URL}/${requestId}`)
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

/**
 * DELETE MULTIPLE REQUESTS
 */
export const deleteSelectedRequests = async (
  requestIds: ID[]
): Promise<void> => {
  if (!requestIds.length) return
  
  try {
    await Promise.all(requestIds.map(deleteRequest))
  } catch (error) {
    console.error('❌ Delete selected requests error:', error)
    throw new Error('Failed to delete selected requests')
  }
}

/* =========================
   QUERY HELPERS
========================= */

export const getRequestsByUser = async (userId: string): Promise<RequestOTFieldWork[]> => {
  try {
    const response = await getRequests({ 
      userId,
      populate: 'user_id',
      limit: 8
    })
    return response.data || []
  } catch (error: unknown) {
    console.error('❌ Get requests by user error:', error)
    throw error
  }
}

export const getRequestsBySupervisor = async (supervisorId: string): Promise<RequestOTFieldWork[]> => {
  try {
    const { data }: AxiosResponse<BackendRequestsResponse> = await axiosInstance.get(
      `${REQUEST_URL}/supervisor/${supervisorId}?populate=user_id`
    )

    const requests = extractRequestsFromResponse(data)
    return requests.map(request => mapRequest(request))
  } catch (error: unknown) {
    console.error('❌ Get requests by supervisor error:', error)
    throw error
  }
}

export const getRequestsByStatus = async (
  status: 'Pending' | 'Accepted' | 'Rejected'
): Promise<RequestOTFieldWork[]> => {
  try {
    const response = await getRequests({ 
      status,
      limit: 8
    })
    return response.data || []
  } catch (error: unknown) {
    console.error('❌ Get requests by status error:', error)
    throw error
  }
}

export const getRequestsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<RequestOTFieldWork[]> => {
  try {
    const response = await getRequests({ 
      startDate, 
      endDate,
      limit: 8
    })
    return response.data || []
  } catch (error: unknown) {
    console.error('❌ Get requests by date range error:', error)
    throw error
  }
}

export const getRequestsByTitle = async (
  title: 'OT' | 'FIELD_WORK'
): Promise<RequestOTFieldWork[]> => {
  try {
    const response = await getRequests({ 
      title,
      limit: 8
    })
    return response.data || []
  } catch (error: unknown) {
    console.error('❌ Get requests by title error:', error)
    throw error
  }
}

export const getRequestsStatistics = async (params?: {
  year?: string
  month?: string
  department?: string
}): Promise<{
  total: number
  pending: number
  accepted: number
  rejected: number
  otCount: number
  fieldWorkCount: number
}> => {
  try {
    const queryParams = new URLSearchParams()
    appendQueryParam(queryParams, 'year', params?.year)
    appendQueryParam(queryParams, 'month', params?.month)
    appendQueryParam(queryParams, 'department', params?.department)
    
    const url = `${REQUEST_URL}/statistics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const { data } = await axiosInstance.get(url)
    
    return {
      total: data.total || 0,
      pending: data.pending || 0,
      accepted: data.accepted || 0,
      rejected: data.rejected || 0,
      otCount: data.otCount || 0,
      fieldWorkCount: data.fieldWorkCount || 0,
    }
  } catch (error) {
    console.error('❌ Get requests statistics error:', error)
    return {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      otCount: 0,
      fieldWorkCount: 0,
    }
  }
}

/* =========================
   DEPARTMENT FUNCTIONS
========================= */

export type DepartmentsQueryResponse = Response<Department[]>

export const getDepartments = async (): Promise<DepartmentsQueryResponse> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/departments`)
    let departments: Department[] = []

    if (response.data) {
      if (Array.isArray(response.data)) {
        departments = response.data
      } else if (response.data.data && Array.isArray(response.data.data)) {
        departments = response.data.data
      } else if (response.data.departments && Array.isArray(response.data.departments)) {
        departments = response.data.departments
      }
    }
    
    departments = departments.map(dept => ({
      ...dept,
      id: dept._id || dept.id,
    }))
    
    return { data: departments }
  } catch (error) {
    console.error('Error fetching departments:', error)
    return { data: [] }
  }
}

export const getDepartmentById = async (id: ID): Promise<Department | null> => {
  try {
    const { data } = await axiosInstance.get(`${API_URL}/departments/${id}`)
    
    if (data) {
      const department = data.department || data.data || data
      return {
        ...department,
        id: department._id || department.id,
      }
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching department ${id}:`, error)
    return null
  }
}

/* =========================
   EXPORT ALL FUNCTIONS
========================= */

export default {
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  updateRequestStatus,
  deleteRequest,
  deleteSelectedRequests,
  getRequestsByUser,
  getRequestsBySupervisor,
  getRequestsByStatus,
  getRequestsByDateRange,
  getRequestsByTitle,
  getRequestsStatistics,
  getDepartments,
  getDepartmentById,
}