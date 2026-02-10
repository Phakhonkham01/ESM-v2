import axios from 'axios'
import { ID } from '../../../../../../_metronic/helpers'
import { User, ExistingSalary } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
const USERS_URL = `${API_URL}/users`
const SALARIES_URL = `${API_URL}/salaries`

export const getUsers = async (): Promise<User[]> => {
  const response = await axios.get(USERS_URL)
  // API returns array directly, not { users: [...] }
  return response.data
}

export const getEmployeeUsers = async (): Promise<User[]> => {
  try {
    const users = await getUsers()
    
    // Check if it's an array
    if (!Array.isArray(users)) {
      console.error('Unexpected response format from getUsers:', users)
      return []
    }
    
    return users.filter(user => 
      user.role?.toLowerCase() === 'employee'
    )
  } catch (error) {
    console.error('Error fetching employee users:', error)
    return []
  }
}

export const getExistingSalaries = async (userId: ID): Promise<ExistingSalary[]> => {
  try {
    const response = await axios.get(`${SALARIES_URL}?userId=${userId}`)
    return response.data?.salaries || []
  } catch (error) {
    console.error('Error fetching existing salaries:', error)
    return []
  }
}

export const getPrefillData = async (userId: ID, month: number, year: number) => {
  try {
    const response = await axios.get(
      `${SALARIES_URL}/prefill/${userId}`,
      { params: { month, year } }
    )
    return response.data?.data || null
  } catch (error) {
    console.error('Error fetching prefill data:', error)
    return null
  }
}

export const createSalary = async (salaryData: any) => {
  const response = await axios.post(SALARIES_URL, salaryData)
  return response.data
}

export const updateUserVacationDays = async (
  userId: ID, 
  vacation_days: number, 
  updated_by: string, 
  update_reason: string
) => {
  const response = await axios.put(
    `${USERS_URL}/${userId}/update-vacation-days`,
    { vacation_days, updated_by, update_reason }
  )
  return response.data
}