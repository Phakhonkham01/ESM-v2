import axios from 'axios'
import { ID } from '../../../../../../_metronic/helpers'
import { User, ExistingSalary } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
const USERS_URL = `${API_URL}/users`
const SALARIES_URL = `${API_URL}/salaries`

export const getUsers = async (): Promise<{ users: User[] }> => {
  const response = await axios.get(USERS_URL)
  return response.data
}

export const getEmployeeUsers = async (): Promise<User[]> => {
  const { users } = await getUsers()
  return users.filter(user => 
    user.role.toLowerCase() === 'employee' ||
    user.role.toLowerCase() === 'พนักงาน'
  )
}

export const getExistingSalaries = async (userId: ID): Promise<ExistingSalary[]> => {
  const response = await axios.get(`${SALARIES_URL}?userId=${userId}`)
  return response.data?.salaries || []
}

export const getPrefillData = async (userId: ID, month: number, year: number) => {
  const response = await axios.get(
    `${SALARIES_URL}/prefill/${userId}`,
    { params: { month, year } }
  )
  return response.data?.data || null
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