import {ID, Response} from '../../../../../../_metronic/helpers'

// ✅ ประกาศ interface ก่อน
export interface Department {
  _id?: string
  id?: string
  department_name: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Position {
  _id?: string
  id?: string
  position_name: string
  department_id: string | Department
  createdAt?: Date
  updatedAt?: Date
}

// ✅ ประกาศ Type หลังจาก interface
export type DepartmentIdType = 
  | string 
  | string[] 
  | Department 
  | Department[]
  | null
  | undefined

export type PositionIdType = 
  | string 
  | Position 
  | null
  | undefined

// ✅ ตอนนี้สามารถใช้ DepartmentIdType และ PositionIdType ได้แล้ว
export type User = {
  id?: ID
  user_name: string
  user_email: string
  password?: string
  role: 'admin' | 'employee' | 'supervisor'
  department_id?: DepartmentIdType
  leave_days: number
  status: 'Active' | 'Inactive' | 'On Leave'
  // ฟิลด์ใหม่ที่เพิ่ม
  first_name_en: string
  last_name_en: string
  nickname_en?: string
  first_name_la: string
  last_name_la: string
  nickname_la?: string
  date_of_birth: string
  start_work: string
  gender: 'male' | 'female' | 'other'
  position_id?: PositionIdType
  base_salary?: number
  createdAt?: string
  updatedAt?: string
}

export type UsersQueryResponse = Response<Array<User>>

export const initialUser: User = {
  user_name: '',
  user_email: '',
  role: 'employee',
  department_id: null,
  leave_days: 15,
  status: 'Active',
  // ค่าเริ่มต้นสำหรับฟิลด์ใหม่
  first_name_en: '',
  last_name_en: '',
  nickname_en: '',
  first_name_la: '',
  last_name_la: '',
  nickname_la: '',
  date_of_birth: '',
  start_work: '',
  gender: 'male',
  position_id: null,
  base_salary: 0,
  createdAt:'',
  updatedAt:''
}

// Helper functions สำหรับการแปลง type
export const extractDepartmentId = (departmentId: DepartmentIdType): string | string[] | null => {
  if (!departmentId) return null
  
  if (Array.isArray(departmentId)) {
    return departmentId.map(dept => 
      typeof dept === 'string' ? dept : dept._id || dept.id || ''
    ).filter(Boolean) as string[]
  }
  
  if (typeof departmentId === 'object' && departmentId !== null) {
    return departmentId._id || departmentId.id || ''
  }
  
  return departmentId as string
}

export const extractPositionId = (positionId: PositionIdType): string | null => {
  if (!positionId) return null
  
  if (typeof positionId === 'object' && positionId !== null) {
    return positionId._id || positionId.id || ''
  }
  
  return positionId as string
}

export const isDepartmentObject = (dept: unknown): dept is Department => {
  return typeof dept === 'object' && dept !== null && 'department_name' in dept
}

export const isPositionObject = (pos: unknown): pos is Position => {
  return typeof pos === 'object' && pos !== null && 'position_name' in pos
}