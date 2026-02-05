// src/app/modules/apps/day-off-request/core/_requests.ts
import axios from 'axios'
import { Response } from '../../../../../../_metronic/helpers'
import {
  DayOffRequest,
  DayOffRequestDTO,
  UpdateStatusDTO,
  FormattedDayOffRequest,
} from './_models'

/* =========================
   CONFIG
========================= */

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8001/api'
const DAY_OFF_REQUEST_URL = `${API_URL}/day-off-requests`

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

const isDev = import.meta.env.DEV

/* =========================
   TYPES
========================= */

interface DayOffRequestsAllUserResponse {
  success: boolean
  count: number
  requests: FormattedDayOffRequest[]
}

interface DayOffRequestResponse {
  success: boolean
  message?: string
  data?: DayOffRequest
  request?: DayOffRequest
}

interface DayOffRequestsQueryResponseData {
  success: boolean
  count: number
  data: DayOffRequest[]
}

export interface NormalizedUser {
  _id: string
  id: string
  user_name?: string
  first_name_en?: string
  last_name_en?: string
  user_email?: string
  employee_id?: string
}

/* =========================
   HELPERS
========================= */

const ensureArray = <T>(val: T | T[] | undefined | null): T[] =>
  Array.isArray(val) ? val : val ? [val] : []

const normalizeUserData = (userData: any): NormalizedUser | null => {
  if (!userData || typeof userData !== 'object') return null

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

const mapDayOffRequest = (request: any): DayOffRequest => {
  if (!request) {
    throw new Error('mapDayOffRequest received empty request')
  }

  if (isDev) {
    console.debug('🧩 Mapping day off request:', request)
  }

  return {
    ...request,
    id: request._id || request.id,
    _id: request._id || request.id,
    user_id: normalizeUserData(request.user_id),
    employee_id: normalizeUserData(request.employee_id),
    supervisor_id: ensureArray(request.supervisor_id).map(normalizeUserData),
  }
}

const mapListResponse = (data?: any[]): DayOffRequest[] =>
  data ? data.map(mapDayOffRequest) : []

/* =========================
   API FUNCTIONS
========================= */

// ---------- TABLE (FORMATTED) ----------
export const getDayOffRequestsAllUser = async (): Promise<DayOffRequestsAllUserResponse> => {
  const res = await axiosInstance.get<DayOffRequestsAllUserResponse>(
    `${DAY_OFF_REQUEST_URL}/allusers`
  )
  return res.data
}

// ---------- RAW / QUERY ----------
export const getAllDayOffRequests = async (
  params?: any
): Promise<Response<DayOffRequest[]>> => {
  try {
    const res = await axiosInstance.get<DayOffRequestsQueryResponseData>(
      DAY_OFF_REQUEST_URL,
      { params }
    )

    return { data: mapListResponse(res.data.data) }
  } catch (err) {
    console.error('❌ getAllDayOffRequests error:', err)
    return { data: [] }
  }
}

// ---------- BY USER ----------
export const getDayOffRequestsByUser = async (
  userId: string
): Promise<Response<DayOffRequest[]>> => {
  try {
    const res = await axiosInstance.get<DayOffRequestsQueryResponseData>(
      `${DAY_OFF_REQUEST_URL}/user/${userId}`
    )
    return { data: mapListResponse(res.data.data) }
  } catch {
    return { data: [] }
  }
}

// ---------- SUPERVISOR DASHBOARD ----------
export const getDayOffRequestsForSupervisorDashboard = async (
  supervisorId: string
): Promise<Response<DayOffRequest[]>> => {
  try {
    const res = await axiosInstance.get<DayOffRequestsQueryResponseData>(
      `${DAY_OFF_REQUEST_URL}/supervisor-dashboard/${supervisorId}`
    )
    return { data: mapListResponse(res.data.data) }
  } catch {
    return { data: [] }
  }
}

// ---------- CREATE ----------
export const createDayOffRequest = async (
  requestData: DayOffRequestDTO & { date_off_number?: number }
): Promise<DayOffRequest> => {
  const payload = {
    ...requestData,
    supervisor_id: ensureArray(requestData.supervisor_id),
    status: 'Pending',
  }

  const res = await axiosInstance.post<DayOffRequestResponse>(
    DAY_OFF_REQUEST_URL,
    payload
  )

  const data = res.data.data || res.data.request
  if (!data) throw new Error('Invalid create response')

  return mapDayOffRequest(data)
}

// ---------- UPDATE STATUS ----------
export const updateDayOffRequestStatus = async (
  id: string,
  statusData: UpdateStatusDTO
): Promise<DayOffRequest> => {
  const res = await axiosInstance.patch<DayOffRequestResponse>(
    `${DAY_OFF_REQUEST_URL}/${id}/status`,
    statusData
  )

  if (!res.data.data) throw new Error('Invalid status update response')
  return mapDayOffRequest(res.data.data)
}

// ---------- UPDATE ----------
export const updateDayOffRequest = async (
  id: string,
  requestData: Partial<DayOffRequestDTO>
): Promise<DayOffRequest> => {
  const res = await axiosInstance.put<DayOffRequestResponse>(
    `${DAY_OFF_REQUEST_URL}/${id}`,
    requestData
  )

  const data = res.data.data || res.data.request
  if (!data) throw new Error('Invalid update response')

  return mapDayOffRequest(data)
}

// ---------- DELETE ----------
export const deleteDayOffRequest = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const res = await axiosInstance.delete<{ success: boolean; message: string }>(
    `${DAY_OFF_REQUEST_URL}/${id}`
  )
  return res.data
}

export const deleteSelectedDayOffRequests = async (
  ids: string[]
): Promise<{ success: boolean }> => {
  await Promise.all(ids.map(deleteDayOffRequest))
  return { success: true }
}

// ---------- GET BY ID ----------
export const getDayOffRequestById = async (id: string): Promise<DayOffRequest> => {
  const res = await axiosInstance.get<DayOffRequestResponse>(
    `${DAY_OFF_REQUEST_URL}/${id}`
  )

  if (!res.data.data) throw new Error('Request not found')
  return mapDayOffRequest(res.data.data)
}

/* =========================
   BUSINESS HELPERS
========================= */

export const checkDateOverlap = async (
  userId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
) => {
  const { data } = await getDayOffRequestsByUser(userId)
  const requests = data ?? []

  const overlappingRequests = requests.filter((req) => {
    if (excludeRequestId && req.id === excludeRequestId) return false
    if (!['Accepted', 'Pending'].includes(req.status)) return false

    const reqStart = new Date(req.start_date_time)
    const reqEnd = new Date(req.end_date_time)

    return reqStart <= reqEnd && reqEnd >= reqStart
  })

  return {
    hasOverlap: overlappingRequests.length > 0,
    overlappingRequests,
  }
}

export const validateDayOffRequestData = (data: DayOffRequestDTO) => {
  const errors: string[] = []

  if (!data.user_id) errors.push('User is required')
  if (!data.employee_id) errors.push('Employee is required')
  if (!ensureArray(data.supervisor_id).length)
    errors.push('Supervisor is required')
  if (!data.title?.trim()) errors.push('Title is required')
  if (!data.start_date_time || !data.end_date_time)
    errors.push('Date range is required')

  if (new Date(data.end_date_time) < new Date(data.start_date_time)) {
    errors.push('End date must be after start date')
  }

  return { isValid: errors.length === 0, errors }
}

/* =========================
   EXPORT SERVICE
========================= */

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
  validateDayOffRequestData,
}

export const getDayOffRequests = getAllDayOffRequests
