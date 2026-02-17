import axios, { AxiosResponse } from 'axios'
import { ID } from '../../../../../../_metronic/helpers'
import {
  SatSunRequest,
  SatSunRequestStatus,
  DayChoice,
  DayOffType,
  extractUserId,
  extractSupervisorIds,
} from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
const SAT_SUN_URL = `${API_URL}/sat-sun-requests`

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/* ============================================================
   INTERFACES — Request / Response Shapes (ตรงกับ Backend)
============================================================ */

export interface SatSunRequestFormData {
  user_id: string
  supervisor_id: string[]       // ✅ array ของ supervisor
  employee_id: string
  day_choice: DayChoice
  day_off_type: DayOffType
  start_date_time: string       // ISO string
  end_date_time: string         // ISO string
  description?: string
}

export interface SatSunRequestUpdateData {
  day_choice: DayChoice
  day_off_type: DayOffType
  start_date_time: string
  end_date_time: string
  supervisor_id: string[]
  description?: string
}

// ── Response wrappers ──────────────────────────────────────

export interface SatSunRequestResponse {
  success: boolean
  message?: string
  request: SatSunRequest
  remaining_leave_days?: number
}

export interface SatSunRequestListResponse {
  success: boolean
  count: number
  requests: SatSunRequest[]
}

export interface SatSunRequestDetailResponse {
  success: boolean
  data: SatSunRequest
}

export interface SatSunRequestDeleteResponse {
  success: boolean
  message: string
}

export interface SatSunRequestStatusUpdateResponse {
  success: boolean
  message: string
  request: SatSunRequest
}

// ── Supervisor Dashboard ───────────────────────────────────

export interface SupervisorInfo {
  id: string
  name: string
  email: string
  department?: { _id: string; department_name: string }
  position?: { _id: string; position_name: string }
}

export interface SatSunSupervisorDashboardResponse {
  success: boolean
  supervisor: SupervisorInfo
  count: number
  requests: SatSunRequest[]
}

// ── Conflict Check ─────────────────────────────────────────

export interface ConflictItem {
  id: string
  day_choice: DayChoice
  day_off_type: DayOffType
  start_date: string
  end_date: string
  status: SatSunRequestStatus
  date_off_number: number
  employee_name: string
  employee_department: string
  employee_position: string
}

export interface SatSunConflictResponse {
  success: boolean
  has_conflict: boolean
  conflict_count: number
  conflicts: ConflictItem[]
  message: string
}

// ── Stats ──────────────────────────────────────────────────

export interface SatSunStats {
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

export interface SatSunStatsResponse {
  success: boolean
  stats: SatSunStats
}

// ── Filter params ──────────────────────────────────────────

export interface SatSunFilterParams {
  startDate?: string
  endDate?: string
  status?: SatSunRequestStatus
  day_choice?: DayChoice
}

export interface SatSunConflictParams {
  employee_id: string
  exclude_id?: string
  /** ใช้กับ Half day — ส่ง date เดี่ยว */
  date?: string
  /** ใช้กับ Full day — ส่งคู่กับ end_date */
  start_date?: string
  end_date?: string
}

// ── API Error ──────────────────────────────────────────────

interface ApiErrorResponse {
  response?: {
    status?: number
    data?: { message?: string; available_days?: number; requested_days?: number }
  }
  message?: string
}

/* ============================================================
   HELPER — map _id → id
============================================================ */

const mapRequest = (req: SatSunRequest & { _id?: string }): SatSunRequest => ({
  ...req,
  id: req._id || req.id,
})

/* ============================================================
   HELPER — build error with server message
============================================================ */

const throwEnhancedError = (error: unknown): never => {
  const apiError = error as ApiErrorResponse
  const serverMessage = apiError.response?.data?.message

  if (serverMessage) {
    const enhancedError: any = new Error(serverMessage)
    enhancedError.response = apiError.response
    throw enhancedError
  }

  throw error
}

/* ============================================================
   1. CREATE SAT-SUN REQUEST
   POST /sat-sun-requests
============================================================ */

export const createSatSunRequest = async (
  formData: SatSunRequestFormData
): Promise<SatSunRequest> => {
  console.log('📤 Creating Saturday/Sunday request:', formData)

  try {
    const response: AxiosResponse<SatSunRequestResponse> =
      await axiosInstance.post(SAT_SUN_URL, formData)

    console.log('✅ Created request:', response.data)
    return mapRequest(response.data.request as SatSunRequest & { _id?: string })
  } catch (error: unknown) {
    console.error('❌ Create sat-sun request error:', {
      requestData: formData,
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status,
    })
    return throwEnhancedError(error)
  }
}

/* ============================================================
   2. GET ALL REQUESTS (All Users — Admin)
   GET /sat-sun-requests/allusers
============================================================ */

export const getSatSunRequestsAllUser = async (): Promise<SatSunRequest[]> => {
  console.log('📋 Fetching all Saturday/Sunday requests')

  try {
    const response: AxiosResponse<SatSunRequestListResponse> =
      await axiosInstance.get(`${SAT_SUN_URL}/allusers`)

    console.log(`✅ Found ${response.data.count} requests`)
    return response.data.requests.map((r) =>
      mapRequest(r as SatSunRequest & { _id?: string })
    )
  } catch (error: unknown) {
    console.error('❌ Get all sat-sun requests error:', error)
    throw error
  }
}

/* ============================================================
   3. GET REQUEST BY ID
   GET /sat-sun-requests/:id
============================================================ */

export const getSatSunRequestById = async (
  id: ID
): Promise<SatSunRequest> => {
  console.log(`🔍 Fetching Saturday/Sunday request: ${id}`)

  try {
    const response: AxiosResponse<SatSunRequestDetailResponse> =
      await axiosInstance.get(`${SAT_SUN_URL}/${id}`)

    console.log('✅ Found request:', response.data)
    return mapRequest(response.data.data as SatSunRequest & { _id?: string })
  } catch (error: unknown) {
    console.error(`❌ Get sat-sun request by ID (${id}) error:`, error)
    throw error
  }
}

/* ============================================================
   4. GET ALL REQUESTS WITH FILTERS (Admin)
   GET /sat-sun-requests/allrequests?startDate=&endDate=&status=&day_choice=
============================================================ */

export const getAllSatSunRequests = async (
  filters?: SatSunFilterParams
): Promise<SatSunRequest[]> => {
  console.log('📋 Fetching all Saturday/Sunday requests with filters:', filters)

  try {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.day_choice) params.append('day_choice', filters.day_choice)

    const url = `${SAT_SUN_URL}/allrequests${params.toString() ? `?${params}` : ''}`
    const response: AxiosResponse<SatSunRequestListResponse> =
      await axiosInstance.get(url)

    console.log(`✅ Found ${response.data.count} requests`)
    return response.data.requests.map((r) =>
      mapRequest(r as SatSunRequest & { _id?: string })
    )
  } catch (error: unknown) {
    console.error('❌ Get all filtered sat-sun requests error:', error)
    throw error
  }
}

/* ============================================================
   5. GET REQUESTS FOR SUPERVISOR DASHBOARD
   GET /sat-sun-requests/supervisor/:supervisorId
============================================================ */

export const getSatSunRequestsForSupervisor = async (
  supervisorId: string
): Promise<SatSunSupervisorDashboardResponse> => {
  console.log(`📋 Fetching requests for supervisor: ${supervisorId}`)

  try {
    const response: AxiosResponse<SatSunSupervisorDashboardResponse> =
      await axiosInstance.get(`${SAT_SUN_URL}/supervisor/${supervisorId}`)

    console.log(`✅ Found ${response.data.count} requests for supervisor`)
    return {
      ...response.data,
      requests: response.data.requests.map((r) =>
        mapRequest(r as SatSunRequest & { _id?: string })
      ),
    }
  } catch (error: unknown) {
    console.error(`❌ Get supervisor (${supervisorId}) requests error:`, error)
    throw error
  }
}

/* ============================================================
   6. GET REQUESTS BY USER (Employee view)
   GET /sat-sun-requests/user/:userId
============================================================ */

export const getSatSunRequestsByUser = async (
  userId: string
): Promise<SatSunRequest[]> => {
  console.log(`📋 Fetching Saturday/Sunday requests for user: ${userId}`)

  try {
    const response: AxiosResponse<SatSunRequestListResponse> =
      await axiosInstance.get(`${SAT_SUN_URL}/user/${userId}`)

    console.log(`✅ Found ${response.data.count} requests for user`)
    return response.data.requests.map((r) =>
      mapRequest(r as SatSunRequest & { _id?: string })
    )
  } catch (error: unknown) {
    console.error(`❌ Get user (${userId}) sat-sun requests error:`, error)
    throw error
  }
}

/* ============================================================
   7. UPDATE REQUEST STATUS (Supervisor / Admin)
   PATCH /sat-sun-requests/:id/status
============================================================ */

export const updateSatSunRequestStatus = async (
  id: ID,
  status: SatSunRequestStatus
): Promise<SatSunRequest> => {
  console.log(`🔄 Updating request ${id} → status: ${status}`)

  try {
    const response: AxiosResponse<SatSunRequestStatusUpdateResponse> =
      await axiosInstance.patch(`${SAT_SUN_URL}/${id}/status`, { status })

    console.log('✅ Updated status:', response.data.message)
    return mapRequest(response.data.request as SatSunRequest & { _id?: string })
  } catch (error: unknown) {
    console.error(`❌ Update status (${id}) error:`, {
      status,
      response: (error as ApiErrorResponse).response?.data,
    })
    return throwEnhancedError(error)
  }
}

/* ============================================================
   8. EDIT REQUEST (Only when Pending)
   PUT /sat-sun-requests/:id
============================================================ */

export const updateSatSunRequest = async (
  id: ID,
  updateData: SatSunRequestUpdateData
): Promise<SatSunRequest> => {
  console.log(`✏️ Updating Saturday/Sunday request ${id}:`, updateData)

  try {
    const response: AxiosResponse<SatSunRequestResponse> =
      await axiosInstance.put(`${SAT_SUN_URL}/${id}`, updateData)

    console.log('✅ Updated request:', response.data)
    return mapRequest(response.data.request as SatSunRequest & { _id?: string })
  } catch (error: unknown) {
    console.error(`❌ Update sat-sun request (${id}) error:`, {
      updateData,
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status,
    })
    return throwEnhancedError(error)
  }
}

/* ============================================================
   9. DELETE REQUEST (Only when Pending)
   DELETE /sat-sun-requests/:id
============================================================ */

export const deleteSatSunRequest = async (id: ID): Promise<void> => {
  console.log(`🗑️ Deleting Saturday/Sunday request: ${id}`)

  try {
    const response: AxiosResponse<SatSunRequestDeleteResponse> =
      await axiosInstance.delete(`${SAT_SUN_URL}/${id}`)

    console.log('✅ Deleted request:', response.data.message)
  } catch (error: unknown) {
    console.error(`❌ Delete sat-sun request (${id}) error:`, {
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status,
    })

    const apiError = error as ApiErrorResponse
    const status = apiError.response?.status

    if (status === 404) throw new Error('Request not found')
    if (status === 400) {
      throw new Error(
        apiError.response?.data?.message || 'Only pending requests can be deleted'
      )
    }

    return throwEnhancedError(error)
  }
}

/* ============================================================
   10. DELETE MULTIPLE REQUESTS
============================================================ */

export const deleteSelectedSatSunRequests = async (ids: ID[]): Promise<void> => {
  console.log('🗑️ Deleting multiple Saturday/Sunday requests:', ids)

  const errors: Array<{ id: ID; error: Error }> = []

  for (const id of ids) {
    try {
      await deleteSatSunRequest(id)
    } catch (error: unknown) {
      errors.push({ id, error: error as Error })
    }
  }

  if (errors.length > 0) {
    console.error('❌ Some requests could not be deleted:', errors)
    const messages = errors.map(({ id, error }) => `Request ${id}: ${error.message}`)
    throw new Error(
      `Failed to delete ${errors.length} request(s):\n${messages.join('\n')}`
    )
  }

  console.log('✅ Successfully deleted all selected requests')
}

/* ============================================================
   11. CHECK CONFLICT
   GET /sat-sun-requests/check-conflict?employee_id=&date=&...
============================================================ */

export const checkSatSunConflict = async (
  params: SatSunConflictParams
): Promise<SatSunConflictResponse> => {
  console.log('🔍 Checking Saturday/Sunday conflicts:', params)

  try {
    const query = new URLSearchParams()
    query.append('employee_id', params.employee_id)
    if (params.exclude_id) query.append('exclude_id', params.exclude_id)

    // Half day — ส่ง date เดี่ยว
    if (params.date) {
      query.append('date', params.date)
    }
    // Full day — ส่ง start_date + end_date
    else if (params.start_date && params.end_date) {
      query.append('start_date', params.start_date)
      query.append('end_date', params.end_date)
    }

    const response: AxiosResponse<SatSunConflictResponse> =
      await axiosInstance.get(`${SAT_SUN_URL}/check-conflict?${query}`)

    console.log(
      `✅ Conflict check: ${response.data.has_conflict ? 'CONFLICT FOUND' : 'No conflict'}`
    )
    return response.data
  } catch (error: unknown) {
    console.error('❌ Check conflict error:', error)
    throw error
  }
}

/* ============================================================
   12. GET STATS (Admin)
   GET /sat-sun-requests/stats
============================================================ */

export const getSatSunStats = async (): Promise<SatSunStats> => {
  console.log('📊 Fetching Saturday/Sunday stats')

  try {
    const response: AxiosResponse<SatSunStatsResponse> =
      await axiosInstance.get(`${SAT_SUN_URL}/stats`)

    console.log('✅ Stats:', response.data.stats)
    return response.data.stats
  } catch (error: unknown) {
    console.error('❌ Get sat-sun stats error:', error)
    throw error
  }
}

/* ============================================================
   CONVENIENCE HELPERS
============================================================ */

/**
 * แปลง SatSunRequest object → SatSunRequestFormData (ใช้ตอน edit)
 * ดึง ID จาก populated field ออกมาให้อัตโนมัติ
 */
export const toFormData = (req: SatSunRequest): SatSunRequestFormData => ({
  user_id: extractUserId(req.user_id) ?? '',
  supervisor_id: extractSupervisorIds(req.supervisor_id),
  employee_id: extractUserId(req.employee_id) ?? '',
  day_choice: req.day_choice,
  day_off_type: req.day_off_type,
  start_date_time:
    req.start_date_time instanceof Date
      ? req.start_date_time.toISOString()
      : req.start_date_time,
  end_date_time:
    req.end_date_time instanceof Date
      ? req.end_date_time.toISOString()
      : req.end_date_time,
  description: req.description ?? '',
})