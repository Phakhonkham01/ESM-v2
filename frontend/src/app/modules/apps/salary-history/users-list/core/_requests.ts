import axios, { AxiosResponse } from 'axios'
import { ID } from '../../../../../../_metronic/helpers'
import { SalaryData, SalariesQueryResponse } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
const SALARY_URL = `${API_URL}/salaries`

export const getSalaries = async (query: string): Promise<SalariesQueryResponse> => {
  const { data }: AxiosResponse<{ salaries: SalaryData[] }> = await axios.get(`${SALARY_URL}?${query}`)
  return { data: data.salaries || [] }
}

export const getSalaryById = async (id: ID): Promise<SalaryData> => {
  const { data }: AxiosResponse<{ salary: SalaryData }> = await axios.get(`${SALARY_URL}/${id}`)
  return data.salary
}

export const deleteSalary = async (id: ID): Promise<void> => {
  await axios.delete(`${SALARY_URL}/${id}`)
}

export const updateSalaryStatus = async (id: ID, status: string): Promise<void> => {
  await axios.put(`${SALARY_URL}/${id}/status`, { status })
}

export const sendSalaryEmail = async (salaryId: ID, emailData: any): Promise<any> => {
  const { data } = await axios.post(`${SALARY_URL}/${salaryId}/send-email`, emailData)
  return data
}