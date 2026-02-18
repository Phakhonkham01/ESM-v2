// src/app/modules/apps/request-ot-field-work-user/users-list/core/_requests.ts
import axios, { AxiosResponse } from 'axios'
import { ID, Response } from '../../../../../../_metronic/helpers'
import {
  RequestOTFieldWork,
  RequestOTFieldWorkDTO,
} from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
const REQUEST_URL = `${API_URL}/requestOTandFieldWorkRoutes`

const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized access')
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
    }
  }
  message?: string
}

interface BackendRequestsResponse {
  requests: RequestOTFieldWork[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

interface BackendRequestResponse {
  request: RequestOTFieldWork
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

// ✅ Unified PaginatedResponse — total and totalPages moved inside pagination (matches day-off pattern)
export interface PaginatedResponse<T> extends Response<T> {
  payload?: {
    pagination?: {
      page: number
      items_per_page: 8 | 10 | 30 | 50 | 100
      links: Array<{ label: string; active: boolean; url: string | null; page: number | null }>
      total: number
      totalPages: number
    }
  }
}

/* =========================
   HELPERS
========================= */

const VALID_PAGE_SIZES = [8, 10, 30, 50, 100] as const
type PageSize = typeof VALID_PAGE_SIZES[number]

// ✅ Default to 8 — mirrors backend default
const normalizeItemsPerPage = (limit: number | undefined): PageSize => {
  if (!limit) return 8
  if ((VALID_PAGE_SIZES as readonly number[]).includes(limit)) {
    return limit as PageSize
  }
  // Find closest valid value instead of always falling back to 8
  return VALID_PAGE_SIZES.reduce((prev, curr) =>
    Math.abs(curr - limit) < Math.abs(prev - limit) ? curr : prev
  )
}

const mapRequest = (request: RequestOTFieldWork & { _id?: string }): RequestOTFieldWork => {
  // Prefer _id (MongoDB) over id to avoid ambiguity
  const id = request._id || request.id
  return { ...request, id }
}

const buildPaginationLinks = (
  page: number,
  totalPages: number
): Array<{ label: string; active: boolean; url: string | null; page: number | null }> => {
  const links = []

  // Previous
  links.push({
    label: '&laquo; Previous',
    active: false,
    url: page > 1 ? `?page=${page - 1}` : null,
    page: page > 1 ? page - 1 : null,
  })

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    links.push({
      label: String(i),
      active: i === page,
      url: `?page=${i}`,
      page: i,
    })
  }

  // Next
  links.push({
    label: 'Next &raquo;',
    active: false,
    url: page < totalPages ? `?page=${page + 1}` : null,
    page: page < totalPages ? page + 1 : null,
  })

  return links
}

/* =========================
   REQUEST OT/FIELD WORK REQUESTS
========================= */

export const getRequests = async (params?: {
  search?: string
  year?: string
  month?: string
  startDate?: string
  endDate?: string
  department?: string
  status?: string
  userId?: string
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}): Promise<PaginatedResponse<RequestOTFieldWork[]>> => {
  try {
    const queryParams = new URLSearchParams()

    const appendIfValid = (key: string, value: string | number | undefined | null) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString())
      }
    }

    appendIfValid('search', params?.search)
    appendIfValid('year', params?.year)
    appendIfValid('month', params?.month)
    appendIfValid('startDate', params?.startDate)
    appendIfValid('endDate', params?.endDate)
    appendIfValid('userId', params?.userId)
    appendIfValid('sort', params?.sort)
    appendIfValid('order', params?.order)

    if (params?.department &&
      params.department !== 'All Departments' &&
      params.department !== '') {
      appendIfValid('department', params.department)
    }

    if (params?.status &&
      params.status !== 'All Status' &&
      params.status !== '') {
      appendIfValid('status', params.status)
    }

    // ✅ Normalize limit ONCE — keep this value consistent throughout
    const limit = normalizeItemsPerPage(params?.limit)
    appendIfValid('page', params?.page)
    appendIfValid('limit', limit)

    queryParams.append('populate', 'user_id')

    const queryString = queryParams.toString()
    const url = `${REQUEST_URL}${queryString ? `?${queryString}` : ''}`

    const response = await axiosInstance.get(url)
    const rawRequests = response.data.requests || response.data.data || []
    const requests: RequestOTFieldWork[] = rawRequests.map((r: any) => mapRequest(r))

    const total      = response.data.total || response.data.count || rawRequests.length || 0
    const page       = response.data.page  || params?.page || 1

    // ✅ Give precedence to server's returned limit if present, otherwise use our normalized value
    const finalLimit = response.data.limit
      ? normalizeItemsPerPage(response.data.limit)
      : limit

    const totalPages = response.data.totalPages || Math.ceil(total / finalLimit) || 1

    return {
      data: requests,
      payload: {
        pagination: {
          page,
          items_per_page: finalLimit,
          links: buildPaginationLinks(page, totalPages),
          total,
          totalPages,
        },
      },
    }
  } catch (error: any) {
    console.error('❌ Get requests error:', error)
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    })

    const page  = params?.page || 1
    const limit = normalizeItemsPerPage(params?.limit)

    return {
      data: [],
      payload: {
        pagination: {
          page,
          items_per_page: limit,
          links: buildPaginationLinks(1, 1),
          total: 0,
          totalPages: 1,
        },
      },
    }
  }
}

// GET REQUEST BY ID
export const getRequestById = async (id: ID): Promise<RequestOTFieldWork> => {
  try {
    const { data }: AxiosResponse<BackendRequestResponse> = await axiosInstance.get(
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
    const { data }: AxiosResponse<CreateRequestResponse> = await axiosInstance.post(
      REQUEST_URL,
      requestData
    )
    return mapRequest(data.request)
  } catch (error: unknown) {
    console.error('❌ Create request error:', {
      requestData,
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status,
    })

    const apiError = error as ApiErrorResponse
    if (apiError.response?.data?.message) {
      const enhancedError = new Error(apiError.response.data.message)
        ; (enhancedError as any).response = apiError.response
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
    const { data }: AxiosResponse<UpdateRequestResponse> = await axiosInstance.put(
      `${REQUEST_URL}/${id}`,
      requestData
    )
    return mapRequest(data.request)
  } catch (error: unknown) {
    console.error(`❌ Update request ${id} error:`, {
      requestData,
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status,
    })

    const apiError = error as ApiErrorResponse
    if (apiError.response?.data?.message) {
      const enhancedError = new Error(apiError.response.data.message)
        ; (enhancedError as any).response = apiError.response
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
    const { data }: AxiosResponse<UpdateRequestResponse> = await axiosInstance.patch(
      `${REQUEST_URL}/${id}/status`,
      { status }
    )
    return mapRequest(data.request)
  } catch (error: unknown) {
    console.error(`❌ Update request ${id} status error:`, error)

    const apiError = error as ApiErrorResponse
    if (apiError.response?.data?.message) {
      const enhancedError = new Error(apiError.response.data.message)
        ; (enhancedError as any).response = apiError.response
      throw enhancedError
    }

    throw error
  }
}

// DELETE REQUEST
export const deleteRequest = async (requestId: ID): Promise<void> => {
  try {
    await axiosInstance.delete(`${REQUEST_URL}/${requestId}`)
  } catch (error: unknown) {
    console.error(`❌ Delete request ${requestId} error:`, {
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status,
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

// DELETE MULTIPLE REQUESTS — uses allSettled to avoid silent partial failures
export interface DeleteResult {
  id: ID
  success: boolean
  error?: string
}

export const deleteSelectedRequests = async (requestIds: ID[]): Promise<DeleteResult[]> => {
  const results = await Promise.allSettled(requestIds.map((id) => deleteRequest(id)))

  return results.map((result, index) => ({
    id: requestIds[index],
    success: result.status === 'fulfilled',
    error: result.status === 'rejected' ? (result.reason as Error)?.message : undefined,
  }))
}

/* =========================
   QUERY HELPERS
========================= */

export const getRequestsByUser = async (userId: string): Promise<RequestOTFieldWork[]> => {
  try {
    const { data }: AxiosResponse<BackendRequestsResponse> = await axiosInstance.get(
      `${REQUEST_URL}/user/${userId}?populate=user_id`
    )
    return (data.requests || []).map((r: RequestOTFieldWork & { _id?: string }) => mapRequest(r))
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
    return (data.requests || []).map((r: RequestOTFieldWork & { _id?: string }) => mapRequest(r))
  } catch (error: unknown) {
    console.error('❌ Get requests by supervisor error:', error)
    throw error
  }
}

export const getRequestsByStatus = async (
  status: 'Pending' | 'Accepted' | 'Rejected'
): Promise<RequestOTFieldWork[]> => {
  try {
    const response = await getRequests({ status })
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
    const response = await getRequests({ startDate, endDate })
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
    const response = await getRequests({ search: title })
    return response.data || []
  } catch (error: unknown) {
    console.error('❌ Get requests by title error:', error)
    throw error
  }
}

/* =========================
   DEPARTMENTS
========================= */

export type DepartmentsQueryResponse = Response<Department[]>

export const getDepartments = async (): Promise<DepartmentsQueryResponse> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/departments`)
    let departments: Department[] = []

    if (response.data) {
      if (Array.isArray(response.data)) {
        departments = response.data
      } else if (Array.isArray(response.data.data)) {
        departments = response.data.data
      } else if (Array.isArray(response.data.departments)) {
        departments = response.data.departments
      }
    }

    return { data: departments }
  } catch (error) {
    console.error('Error fetching departments:', error)
    return { data: [] }
  }
}