import axios from 'axios'

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8001/api'
const DEPARTMENT_URL = `${API_URL}/departments`

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

interface DepartmentResponse {
  success: boolean
  count: number
  departments: Array<{
    _id: string
    department_name: string
    department_code?: string
    [key: string]: any
  }>
}

export const getDepartments = async (): Promise<Array<{ _id: string; department_name: string }>> => {
  try {
    const response = await axiosInstance.get<DepartmentResponse>(DEPARTMENT_URL)
    
    if (response.data.success && response.data.departments) {
      return response.data.departments.map(dept => ({
        _id: dept._id,
        department_name: dept.department_name
      }))
    }
    
    return []
  } catch (error: any) {
    console.error('Error fetching departments:', error)
    // Return empty array or some default departments as fallback
    return [
      { _id: 'dept1', department_name: 'IT Department' },
      { _id: 'dept2', department_name: 'HR Department' },
      { _id: 'dept3', department_name: 'Finance Department' },
      { _id: 'dept4', department_name: 'Marketing Department' },
    ]
  }
}