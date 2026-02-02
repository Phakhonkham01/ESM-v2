import axios, { AxiosResponse } from 'axios'
import { ID } from '../../../../../../_metronic/helpers'
import { User, UsersQueryResponse, Department, Position } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
const USER_URL = `${API_URL}/users`
const DEPARTMENT_URL = `${API_URL}/departments`

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

/* =========================
   DEPARTMENT INTERFACES
========================= */

export interface DepartmentFormData {
  department_name: string
}

export interface DepartmentsQueryResponse {
  success: boolean
  count: number
  data: Department[]
}

export interface DepartmentResponse {
  success: boolean
  message?: string
  data: Department
}

export interface DepartmentDeleteError {
  success: false
  message: string
  userCount?: number
  users?: Array<{
    id: string
    name: string
    email: string
  }>
}

export interface PositionFormData {
  position_name: string
  department_id: string
}

export interface PositionsQueryResponse {
  success: boolean
  count: number
  data: Position[]
}

export interface PositionResponse {
  success: boolean
  message?: string
  data: Position
}

// สร้าง interface สำหรับ error response
interface ApiErrorResponse {
  response?: {
    status?: number
    data?: {
      message?: string
      userCount?: number
      users?: Array<{ id: string; name: string; email: string }>
    }
  }
  message?: string
}

/* =========================
   HELPERS
========================= */

const mapUser = (user: User & { _id?: string; department_id?: any; position_id?: any }): User => ({
  ...user,
  id: user._id || user.id,
  // แปลง department_id ถ้าเป็น object
  department_id: user.department_id 
    ? (Array.isArray(user.department_id)
        ? user.department_id.map((dept: unknown) => 
            typeof dept === 'object' && dept !== null && '_id' in dept 
              ? { 
                  ...dept as Department, 
                  id: (dept as { _id?: string; id?: string })._id || (dept as { _id?: string; id?: string }).id 
                }
              : dept
          )
        : typeof user.department_id === 'object' && user.department_id !== null && '_id' in user.department_id
          ? {
              ...user.department_id as Department,
              id: (user.department_id as { _id?: string; id?: string })._id || (user.department_id as { _id?: string; id?: string }).id
            }
          : user.department_id)
    : user.department_id,
  // แปลง position_id ถ้าเป็น object
  position_id: user.position_id
    ? (typeof user.position_id === 'object' && user.position_id !== null && '_id' in user.position_id
        ? {
            ...user.position_id as Position,
            id: (user.position_id as { _id?: string; id?: string })._id || (user.position_id as { _id?: string; id?: string }).id
          }
        : user.position_id)
    : user.position_id,
})

const mapDepartment = (department: Department & { _id?: string }): Department => ({
  ...department,
  id: department._id || department.id,
})

const mapPosition = (position: Position & { _id?: string }): Position => ({
  ...position,
  id: position._id || position.id,
})

/* =========================
   USER REQUESTS
========================= */

// GET USERS
export const getUsers = async (query: string): Promise<UsersQueryResponse> => {
  const { data }: AxiosResponse<User[]> = await axios.get(
    `${USER_URL}?${query}`
  )

  return {
    data: data.map((user: User & { _id?: string; department_id?: any; position_id?: any }) => mapUser(user)),
  }
}

// GET USER BY ID
export const getUserById = async (id: ID): Promise<User> => {
  const { data }: AxiosResponse<User> = await axios.get(
    `${USER_URL}/${id}`
  )

  return mapUser(data)
}

// CREATE USER
interface CreateUserResponse {
  user: User & { _id: string }
}

export const createUser = async (user: User): Promise<User> => {
  const { data }: AxiosResponse<CreateUserResponse> = await axios.post(
    USER_URL,
    user
  )

  return mapUser(data.user)
}

// UPDATE USER
interface UpdateUserResponse {
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

// RESET USER PASSWORD
export const resetPassword = (user_name: string, userId: ID): Promise<void> => {
  return axios.post(`${USER_URL}/${userId}`, { user_name, userId }).then((response: AxiosResponse) => response.data)
}

// DELETE USER
export const deleteUser = async (userId: ID): Promise<void> => {
  await axios.delete(`${USER_URL}/${userId}`)
  console.log("🚀 ~ deleteUser ~ axios.delete:", axios.delete)
}

// DELETE MULTIPLE USERS
export const deleteSelectedUsers = async (
  userIds: ID[]
): Promise<void> => {
  await Promise.all(userIds.map(deleteUser))
}

/* =========================
   DEPARTMENT REQUESTS
========================= */

// GET ALL DEPARTMENTS
export const getDepartments = async (query?: string): Promise<Department[]> => {
  console.log('📋 Getting all departments')
  
  try {
    const url = query ? `${DEPARTMENT_URL}?${query}` : DEPARTMENT_URL
    const response = await axiosInstance.get<DepartmentsQueryResponse>(url)
    
    console.log('✅ Get departments response:', response.data)
    return response.data.data.map((department: Department & { _id?: string }) => mapDepartment(department))
  } catch (error: unknown) {
    console.error('❌ Get departments error:', error)
    throw error
  }
}

// GET DEPARTMENT BY ID
export const getDepartmentById = async (id: string): Promise<Department> => {
  console.log('🔍 Getting department by ID:', id)
  
  try {
    const response = await axiosInstance.get<DepartmentResponse>(`${DEPARTMENT_URL}/${id}`)
    
    console.log('✅ Get department response:', response.data)
    return mapDepartment(response.data.data)
  } catch (error: unknown) {
    console.error(`❌ Get department ${id} error:`, error)
    throw error
  }
}

// CREATE DEPARTMENT
// CREATE DEPARTMENT
export const createDepartment = async (
  department: DepartmentFormData
): Promise<Department> => {
  console.log('📤 [_requests.ts] Creating department with data:', department)
  console.log('📤 [_requests.ts] DEPARTMENT_URL:', DEPARTMENT_URL)
  console.log('📤 [_requests.ts] API_URL:', API_URL)
  
  try {
    const response = await axiosInstance.post<DepartmentResponse>(
      DEPARTMENT_URL, 
      department
    )
    
    console.log('✅ [_requests.ts] Create department response:', response)
    console.log('✅ [_requests.ts] Response data:', response.data)
    console.log('✅ [_requests.ts] Response data.data:', response.data.data)
    
    const mappedDepartment = mapDepartment(response.data.data)
    console.log('✅ [_requests.ts] Mapped department:', mappedDepartment)
    
    return mappedDepartment
  } catch (error: unknown) {
    console.error('❌ [_requests.ts] Create department error:', error)
    console.error('❌ [_requests.ts] Error details:', {
      requestData: department,
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

// UPDATE DEPARTMENT
export const updateDepartment = async (
  id: string, 
  department: Partial<DepartmentFormData>
): Promise<Department> => {
  console.log(`✏️ Updating department ${id} with data:`, department)
  
  try {
    const response = await axiosInstance.put<DepartmentResponse>(
      `${DEPARTMENT_URL}/${id}`, 
      department
    )
    
    console.log('✅ Update department response:', response.data)
    return mapDepartment(response.data.data)
  } catch (error: unknown) {
    console.error(`❌ Update department ${id} error:`, {
      requestData: department,
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status
    })
    
    const apiError = error as ApiErrorResponse
    
    // Re-throw with enhanced error message
    if (apiError.response?.data?.message) {
      const enhancedError = new Error(apiError.response.data.message)
      ;(enhancedError as any).response = apiError.response
      throw enhancedError
    }
    
    throw error
  }
}

// DELETE DEPARTMENT
export const deleteDepartment = async (id: string): Promise<void> => {
  console.log(`🗑️ Deleting department ${id}`)
  
  try {
    const response = await axiosInstance.delete<DepartmentResponse>(
      `${DEPARTMENT_URL}/${id}`
    )
    console.log('✅ Delete department response:', response.data)
  } catch (error: unknown) {
    console.error(`❌ Delete department ${id} error:`, {
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status
    })
    
    // ✅ จัดการ error แบบละเอียด
    const apiError = error as ApiErrorResponse
    const status = apiError.response?.status
    const errorData = apiError.response?.data as DepartmentDeleteError
    
    // กรณีหาไม่เจอ
    if (status === 404) {
      throw new Error('Department not found')
    }
    
    // กรณีมี user ใช้งานอยู่ หรือ error อื่นๆ
    if (status === 400) {
      const message = errorData?.message || 'Cannot delete department'
      const userCount = errorData?.userCount
      const users = errorData?.users
      
      // สร้าง error object ที่มีข้อมูลเพิ่มเติม
      const enhancedError: any = new Error(message)
      enhancedError.userCount = userCount
      enhancedError.users = users
      enhancedError.response = apiError.response
      
      throw enhancedError
    }
    
    // Error อื่นๆ
    if (errorData?.message) {
      throw new Error(errorData.message)
    }
    
    throw error
  }
}

// DELETE MULTIPLE DEPARTMENTS
export const deleteSelectedDepartments = async (ids: string[]): Promise<void> => {
  console.log('🗑️ Deleting multiple departments:', ids)
  
  const errors: Array<{ id: string; error: Error }> = []
  
  for (const id of ids) {
    try {
      await deleteDepartment(id)
    } catch (error: unknown) {
      errors.push({ id, error: error as Error })
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ Some departments could not be deleted:', errors)
    
    const errorMessages = errors.map(({ id, error }: { id: string; error: Error & { userCount?: number } }) => {
      const userCount = error.userCount
      if (userCount) {
        return `Department ${id}: ${userCount} employee(s) assigned`
      }
      return `Department ${id}: ${error.message}`
    })
    
    throw new Error(`Failed to delete ${errors.length} department(s):\n${errorMessages.join('\n')}`)
  }
  
  console.log('✅ Successfully deleted all departments')
}

/* =========================
   POSITION REQUESTS
========================= */

// GET ALL POSITIONS
export const getPositions = async (query?: string): Promise<Position[]> => {
  console.log('📋 Getting all positions')
  
  try {
    const url = `${API_URL}/positions${query ? `?${query}` : ''}`
    const response = await axiosInstance.get<PositionsQueryResponse>(url)
    
    console.log('✅ Get positions response:', response.data)
    return response.data.data.map((position: Position & { _id?: string }) => mapPosition(position))
  } catch (error: unknown) {
    console.error('❌ Get positions error:', error)
    throw error
  }
}

// GET POSITION BY ID
export const getPositionById = async (id: string): Promise<Position> => {
  console.log('🔍 Getting position by ID:', id)
  
  try {
    const response = await axiosInstance.get<PositionResponse>(`${API_URL}/positions/${id}`)
    
    console.log('✅ Get position response:', response.data)
    return mapPosition(response.data.data)
  } catch (error: unknown) {
    console.error(`❌ Get position ${id} error:`, error)
    throw error
  }
}

// CREATE POSITION
export const createPosition = async (
  position: PositionFormData
): Promise<Position> => {
  console.log('📤 Creating position with data:', position)
  
  try {
    const response = await axiosInstance.post<PositionResponse>(
      `${API_URL}/positions`, 
      position
    )
    
    console.log('✅ Create position response:', response.data)
    return mapPosition(response.data.data)
  } catch (error: unknown) {
    console.error('❌ Create position error:', {
      requestData: position,
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status
    })
    
    const apiError = error as ApiErrorResponse
    
    // Re-throw with enhanced error message
    if (apiError.response?.data?.message) {
      const enhancedError = new Error(apiError.response.data.message)
      ;(enhancedError as any).response = apiError.response
      throw enhancedError
    }
    
    throw error
  }
}

// UPDATE POSITION
export const updatePosition = async (
  id: string, 
  position: Partial<PositionFormData>
): Promise<Position> => {
  console.log(`✏️ Updating position ${id} with data:`, position)
  
  try {
    const response = await axiosInstance.put<PositionResponse>(
      `${API_URL}/positions/${id}`, 
      position
    )
    
    console.log('✅ Update position response:', response.data)
    return mapPosition(response.data.data)
  } catch (error: unknown) {
    console.error(`❌ Update position ${id} error:`, {
      requestData: position,
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status
    })
    
    const apiError = error as ApiErrorResponse
    
    // Re-throw with enhanced error message
    if (apiError.response?.data?.message) {
      const enhancedError = new Error(apiError.response.data.message)
      ;(enhancedError as any).response = apiError.response
      throw enhancedError
    }
    
    throw error
  }
}

// DELETE POSITION
export const deletePosition = async (id: string): Promise<void> => {
  console.log(`🗑️ Deleting position ${id}`)
  
  try {
    const response = await axiosInstance.delete<PositionResponse>(
      `${API_URL}/positions/${id}`
    )
    console.log('✅ Delete position response:', response.data)
  } catch (error: unknown) {
    console.error(`❌ Delete position ${id} error:`, {
      response: (error as ApiErrorResponse).response?.data,
      status: (error as ApiErrorResponse).response?.status
    })
    
    // ✅ จัดการ error แบบละเอียด
    const apiError = error as ApiErrorResponse
    const status = apiError.response?.status
    
    // กรณีหาไม่เจอ
    if (status === 404) {
      throw new Error('Position not found')
    }
    
    // Error อื่นๆ
    if (apiError.response?.data?.message) {
      throw new Error(apiError.response.data.message)
    }
    
    throw error
  }
}

// GET POSITIONS BY DEPARTMENT
export const getPositionsByDepartment = async (departmentId: string): Promise<Position[]> => {
  try {
    const response = await axiosInstance.get<PositionsQueryResponse>(
      `${API_URL}/positions?department_id=${departmentId}`
    )
    return response.data.data.map((position: Position & { _id?: string }) => mapPosition(position))
  } catch (error: unknown) {
    console.error('❌ Get positions by department error:', error)
    throw error
  }
}

/* =========================
   DEPARTMENT VALIDATION HELPERS
========================= */

// Check if department name already exists
export const checkDepartmentExists = async (
  departmentName: string, 
  excludeId?: string
): Promise<boolean> => {
  try {
    const departments: Department[] = await getDepartments()
    
    return departments.some((dept: Department) => {
      const isSameName = dept.department_name.toLowerCase() === departmentName.toLowerCase()
      const isDifferentId = excludeId ? (dept._id || dept.id) !== excludeId : true
      
      return isSameName && isDifferentId
    })
  } catch (error: unknown) {
    console.error('Error checking department existence:', error)
    return false
  }
}

// Get department by name
export const getDepartmentByName = async (name: string): Promise<Department | null> => {
  try {
    const departments: Department[] = await getDepartments()
    
    return departments.find(
      (dept: Department) => dept.department_name.toLowerCase() === name.toLowerCase()
    ) || null
  } catch (error: unknown) {
    console.error('Error getting department by name:', error)
    return null
  }
}

// ✅ เพิ่มฟังก์ชันเช็คว่า department มี user ใช้งานอยู่หรือไม่
export const checkDepartmentHasUsers = async (departmentId: string): Promise<{
  hasUsers: boolean
  userCount: number
  users?: Array<{ id: string; name: string; email: string }>
}> => {
  try {
    // เรียก API เพื่อเช็คว่ามี user ไหม
    const result = await getUsers(`department_id=${departmentId}`)
    const usersData = result?.data || []
    
    return {
      hasUsers: usersData.length > 0,
      userCount: usersData.length,
      users: usersData.map((u: User) => ({
        id: u.id || '',
        name: u.user_name || '',
        email: u.user_email || ''
      }))
    }
  } catch (error: unknown) {
    console.error('Error checking department users:', error)
    return {
      hasUsers: false,
      userCount: 0,
      users: []
    }
  }
}

// ✅ เพิ่มฟังก์ชันสำหรับตรวจสอบ position name
export const checkPositionExists = async (
  positionName: string, 
  departmentId: string,
  excludeId?: string
): Promise<boolean> => {
  try {
    const positions: Position[] = await getPositionsByDepartment(departmentId)
    
    return positions.some((pos: Position) => {
      const isSameName = pos.position_name.toLowerCase() === positionName.toLowerCase()
      const isDifferentId = excludeId ? (pos._id || pos.id) !== excludeId : true
      
      return isSameName && isDifferentId
    })
  } catch (error: unknown) {
    console.error('Error checking position existence:', error)
    return false
  }
}