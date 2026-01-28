import axios, { AxiosResponse } from 'axios'
import {EventsQueryResponse, Event, EventFormData} from './_models'
import { User, UsersQueryResponse } from './../../../user-management/users-list/core/_models'
import { ID } from '../../../../../../_metronic/helpers'

// สำหรับ Vite ใช้ import.meta.env
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8000/api'
const USER_URL = `${API_URL}/users`
const EVENT_TYPE_URL = `${API_URL}/event-types`

// สร้าง axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// ✅ เพิ่ม response interceptor เพื่อ debug
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.data)
    return response
  },
  (error) => {
    console.error(`❌ Error from ${error.config?.url}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })
    return Promise.reject(error)
  }
)

// ✅ แก้ไข request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} Request to:`, config.url)
    
    // ดึง user_id จาก localStorage
    try {
      const userKeys = ['currentUser', 'user', 'auth_user', 'auth']
      let userId = null
      
      for (const key of userKeys) {
        const userData = localStorage.getItem(key)
        if (userData) {
          try {
            const user = JSON.parse(userData)
            userId = user._id || user.id || user.userId || user.user_id
            if (userId) {
              console.log(`👤 Found user_id from ${key}:`, userId)
              break
            }
          } catch (e) {
            // ไม่ต้องทำอะไร
          }
        }
      }
      
      // ถ้าไม่มี user_id ให้ใช้ค่า default สำหรับ testing
      if (!userId) {
        userId = '65f7a8b9c1e6a4b3c8d9e0f1'
        console.warn('⚠️ No user found, using test user_id:', userId)
      }
      
      // ✅ เพิ่ม user_id ลงใน data สำหรับ POST/PUT requests
      if (config.data && (config.method === 'post' || config.method === 'put')) {
        try {
          const data = typeof config.data === 'string' 
            ? JSON.parse(config.data) 
            : config.data
          
          if (!data.user_id && !data.requesting_user_id) {
            data.user_id = userId
            config.data = JSON.stringify(data)
            console.log('📤 Added user_id to request body:', userId)
          }
        } catch (e) {
          console.warn('Failed to add user_id to request:', e)
        }
      }
      
      // ✅ สำหรับ DELETE request, เพิ่ม user_id ใน params
      if (config.method === 'delete') {
        config.params = {
          ...config.params,
          user_id: userId
        }
        console.log('📤 Added user_id to delete params:', userId)
      }
      
    } catch (error) {
      console.warn('Error in request interceptor:', error)
    }
    
    console.log('📤 Final request config:', {
      url: config.url,
      method: config.method,
      data: config.data,
      params: config.params
    })
    
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  }
)

/* =========================
   EVENT TYPE INTERFACES
========================= */
export interface EventType {
  _id?: string
  id?: string
  event_type_name: string
  event_type_color: string
  createdAt?: Date
  updatedAt?: Date
}

export interface EventTypeFormData {
  event_type_name: string
  event_type_color: string
}

export interface EventTypesQueryResponse {
  success: boolean
  count: number
  data: EventType[]
}

export interface EventTypeResponse {
  success: boolean
  message?: string
  data: EventType
}
export interface UpdateParticipationStatusData {
  user_id: string
  status: 'accepted' | 'declined'
  note?: string
}

export interface ParticipationStatusResponse {
  success: boolean
  message: string
  data: Event
}
/* =========================
   EVENT TYPE REQUESTS
========================= */

// GET ALL EVENT TYPES
export const getEventTypes = async (query?: string): Promise<EventType[]> => {
  console.log('📋 Getting all event types')
  
  try {
    const url = query ? `${EVENT_TYPE_URL}?${query}` : EVENT_TYPE_URL
    const response = await axiosInstance.get<EventTypesQueryResponse>(url)
    
    console.log('✅ Get event types response:', response.data)
    return response.data.data.map((eventType) => ({
      ...eventType,
      id: eventType._id
    }))
  } catch (error) {
    console.error('❌ Get event types error:', error)
    throw error
  }
}

// GET EVENT TYPE BY ID
export const getEventTypeById = async (id: string): Promise<EventType> => {
  console.log('🔍 Getting event type by ID:', id)
  
  try {
    const response = await axiosInstance.get<EventTypeResponse>(`${EVENT_TYPE_URL}/${id}`)
    
    console.log('✅ Get event type response:', response.data)
    return {
      ...response.data.data,
      id: response.data.data._id
    }
  } catch (error) {
    console.error(`❌ Get event type ${id} error:`, error)
    throw error
  }
}

// CREATE EVENT TYPE
export const createEventType = async (eventType: EventTypeFormData): Promise<EventType> => {
  console.log('📤 Creating event type with data:', eventType)
  
  try {
    const response = await axiosInstance.post<EventTypeResponse>(EVENT_TYPE_URL, eventType)
    
    console.log('✅ Create event type response:', response.data)
    return {
      ...response.data.data,
      id: response.data.data._id
    }
  } catch (error: any) {
    console.error('❌ Create event type error:', {
      requestData: eventType,
      response: error.response?.data,
      status: error.response?.status
    })
    throw error
  }
}

// UPDATE EVENT TYPE
export const updateEventType = async (
  id: string, 
  eventType: Partial<EventTypeFormData>
): Promise<EventType> => {
  console.log(`✏️ Updating event type ${id} with data:`, eventType)
  
  try {
    const response = await axiosInstance.put<EventTypeResponse>(
      `${EVENT_TYPE_URL}/${id}`, 
      eventType
    )
    
    console.log('✅ Update event type response:', response.data)
    return {
      ...response.data.data,
      id: response.data.data._id
    }
  } catch (error: any) {
    console.error(`❌ Update event type ${id} error:`, {
      requestData: eventType,
      response: error.response?.data,
      status: error.response?.status
    })
    throw error
  }
}

// DELETE EVENT TYPE
export const deleteEventType = async (id: string): Promise<void> => {
  console.log(`🗑️ Deleting event type ${id}`)
  
  try {
    const response = await axiosInstance.delete<EventTypeResponse>(`${EVENT_TYPE_URL}/${id}`)
    console.log('✅ Delete event type response:', response.data)
  } catch (error) {
    console.error(`❌ Delete event type ${id} error:`, error)
    throw error
  }
}

// DELETE MULTIPLE EVENT TYPES
export const deleteSelectedEventTypes = async (ids: string[]): Promise<void> => {
  console.log('🗑️ Deleting multiple event types:', ids)
  
  try {
    await Promise.all(ids.map(deleteEventType))
    console.log('✅ Successfully deleted all event types')
  } catch (error) {
    console.error('❌ Delete selected event types error:', error)
    throw error
  }
}

/* =========================
   EVENT REQUESTS
========================= */

// สำหรับ events
export const getEvents = (query: string): Promise<EventsQueryResponse> => {
  return axiosInstance
    .get(`/events?${query}`)
    .then((response) => response.data)
    .catch((error) => {
      console.error('❌ Get events error:', error)
      throw error
    })
}

export const getEventById = async (eventId: string): Promise<any> => {
  console.log('🔍 Getting event by ID:', eventId)
  
  const response = await axios.get(`${API_URL}/events/${eventId}`)
  
  console.log('✅ Get event response:', response.data)
  return response.data
}

export const createEvent = (event: EventFormData): Promise<Event> => {
  console.log('📤 Creating event with data:', event)
  
  return axiosInstance
    .post('/events', event)
    .then((response) => response.data)
    .catch((error) => {
      console.error('❌ Create event error details:', {
        requestData: event,
        response: error.response?.data,
        status: error.response?.status
      })
      throw error
    })
}

export const updateEvent = (id: string | number, event: Partial<EventFormData>): Promise<Event> => {
  console.log(`✏️ Updating event ${id} with data:`, event)
  
  return axiosInstance
    .put(`/events/${id}`, event)
    .then((response) => response.data)
    .catch((error) => {
      console.error(`❌ Update event ${id} error details:`, {
        requestData: event,
        response: error.response?.data,
        status: error.response?.status
      })
      throw error
    })
}

export const deleteEvent = (id: string | number, userId?: string): Promise<void> => {
  console.log(`🗑️ Deleting event ${id}`, userId ? `by user ${userId}` : '')
  
  const params: any = {}
  
  if (userId) {
    params.user_id = userId
  }
  
  return axiosInstance
    .delete(`/events/${id}`, { params })
    .then((response) => response.data)
    .catch((error) => {
      console.error(`❌ Delete event ${id} error:`, error)
      throw error
    })
}

export const deleteEventWithBody = (id: string | number, userId: string): Promise<void> => {
  console.log(`🗑️ Deleting event ${id} with body, user: ${userId}`)
  
  return axiosInstance
    .post(`/events/${id}/delete`, { user_id: userId })
    .then((response) => response.data)
    .catch((error) => {
      console.error(`❌ Delete event with body ${id} error:`, error)
      throw error
    })
}

export const deleteSelectedEvents = (ids: Array<string | number>, userId?: string): Promise<void> => {
  console.log(`🗑️ Deleting multiple events:`, ids)
  
  const params: any = {}
  if (userId) {
    params.user_id = userId
  }
  
  return axiosInstance
    .post('/events/delete-many', { ids }, { params })
    .then((response) => response.data)
    .catch((error) => {
      console.error('❌ Delete selected events error:', error)
      throw error
    })
}

// ✅ ใช้ updateEvent สำหรับ approve/reject
export const approveEvent = async (
  eventId: string, 
  data: { approved_by: string; comment?: string }
): Promise<any> => {
  console.log('✅ Approving event:', eventId, data)
  
  try {
    const response = await axiosInstance.put(`/events/${eventId}`, {
      status: 'approved',
      approved_by: data.approved_by,
      comment: data.comment || 'Approved'
    })
    
    console.log('✅ Approve response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Approve event error:', {
      eventId,
      requestData: data,
      response: error.response?.data,
      status: error.response?.status
    })
    throw error
  }
}

export const rejectEvent = async (
  eventId: string, 
  data: { approved_by: string; comment: string }
): Promise<any> => {
  console.log('❌ Rejecting event:', eventId, data)
  
  try {
    const response = await axiosInstance.put(`/events/${eventId}`, {
      status: 'rejected',
      approved_by: data.approved_by,
      comment: data.comment
    })
    
    console.log('✅ Reject response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Reject event error:', {
      eventId,
      requestData: data,
      response: error.response?.data,
      status: error.response?.status
    })
    throw error
  }
}

export const addParticipant = (eventId: string | number, userId: string): Promise<Event> => {
  return axiosInstance
    .post(`/events/${eventId}/participants`, { user_id: userId })
    .then((response) => response.data)
    .catch((error) => {
      console.error(`❌ Add participant ${userId} to event ${eventId} error:`, error)
      throw error
    })
}

export const removeParticipant = (eventId: string | number, userId: string): Promise<Event> => {
  return axiosInstance
    .delete(`/events/${eventId}/participants`, { data: { user_id: userId } })
    .then((response) => response.data)
    .catch((error) => {
      console.error(`❌ Remove participant ${userId} from event ${eventId} error:`, error)
      throw error
    })
}

export const getAllUsers = (): Promise<any[]> => {
  return axiosInstance
    .get('/events/users')
    .then((response) => response.data)
    .catch((error) => {
      console.error('❌ Get all users error:', error)
      throw error
    })
}

export const getUsersByRole = (role: string): Promise<any[]> => {
  return axiosInstance
    .get('/events/users/role', { params: { role } })
    .then((response) => response.data)
    .catch((error) => {
      console.error(`❌ Get users by role ${role} error:`, error)
      throw error
    })
}

export const getEventsStats = (): Promise<any> => {
  return axiosInstance
    .get('/events/stats')
    .then((response) => response.data)
    .catch((error) => {
      console.error('❌ Get events stats error:', error)
      throw error
    })
}

/* =========================
   USER REQUESTS
========================= */

const mapUser = (user: any): User => ({
  ...user,
  id: user._id,
})

export const getUsers = async (query: string): Promise<UsersQueryResponse> => {
  const { data }: AxiosResponse<User[]> = await axios.get(
    `${USER_URL}?${query}`
  )

  return {
    data: data.map(mapUser),
  }
}

export const getUserById = async (id: ID): Promise<User> => {
  const { data }: AxiosResponse<User> = await axios.get(
    `${USER_URL}/${id}`
  )

  return mapUser(data)
}

type CreateUserResponse = {
  user: User & { _id: string }
}

export const createUser = async (user: User): Promise<User> => {
  const { data }: AxiosResponse<CreateUserResponse> = await axios.post(
    USER_URL,
    user
  )

  return mapUser(data.user)
}

type UpdateUserResponse = {
  user: User & { _id: string }
}

export const updateUser = async (user: User): Promise<User> => {
  if (!user.id) {
    throw new Error('User ID is required for update')
  }

  const { data }: AxiosResponse<UpdateUserResponse> = await axios.put(
    `${USER_URL}/${user.id}`,
    user
  )

  return mapUser(data.user)
}

export const deleteUser = async (userId: ID): Promise<void> => {
  await axios.delete(`${USER_URL}/${userId}`)
  console.log("🚀 ~ deleteUser ~ axios.delete:", axios.delete)
}

export const deleteSelectedUsers = async (
  userIds: ID[]
): Promise<void> => {
  await Promise.all(userIds.map(deleteUser))
}
// ในไฟล์ _requests.ts แก้ไขฟังก์ชัน updateParticipationStatus เป็น:
export const updateParticipationStatus = async (
  eventId: string,
  data: UpdateParticipationStatusData
): Promise<ParticipationStatusResponse> => {
  console.log('🔄 Updating participation status:', eventId, data)
  
  try {
    // ✅ แก้ไข route เป็น PUT /events/:id/participation-status (ตาม backend ของคุณ)
    const response = await axiosInstance.put<ParticipationStatusResponse>(
      `/events/${eventId}/participation-status`, // แก้ไขตรงนี้
      data
    )
    
    console.log('✅ Update participation status response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Update participation status error:', {
      eventId,
      requestData: data,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url // เพิ่มเพื่อ debug
    })
    throw error
  }
}

// และแก้ไขฟังก์ชัน getParticipationStatus:
export const getParticipationStatus = async (
  eventId: string,
  userId: string
): Promise<any> => {
  console.log('🔍 Getting participation status:', eventId, userId)
  
  try {
    // ✅ แก้ไข route เป็น GET /events/:id/participation-status?user_id=xxx
    const response = await axiosInstance.get(
      `/events/${eventId}/participation-status?user_id=${userId}`
    )
    
    console.log('✅ Get participation status response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Get participation status error:', error)
    // ถ้าไม่พบ route ให้ดึงข้อมูลจาก event object แทน
    console.log('⚠️ Trying to get participation status from event...')
    throw error
  }
}

// GET PENDING PARTICIPATION REQUESTS
export const getPendingParticipationRequests = async (
  userId: string
): Promise<any> => {
  console.log('📋 Getting pending participation requests for user:', userId)
  
  try {
    const response = await axiosInstance.get(
      `/events/pending-participation?user_id=${userId}`
    )
    
    console.log('✅ Get pending requests response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Get pending requests error:', error)
    throw error
  }
}