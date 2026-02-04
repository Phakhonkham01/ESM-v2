import axios, { AxiosResponse } from 'axios'
import { ID } from '../../../../../../_metronic/helpers'
import { RequestData, RequestsQueryResponse } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
const REQUEST_URL = `${API_URL}/requestOTandFieldWorkRoutes`

export const getRequestsBySupervisor = async (supervisorId: ID): Promise<RequestsQueryResponse> => {
  const { data }: AxiosResponse<{ requests: RequestData[] }> = 
    await axios.get(`${REQUEST_URL}/supervisor/${supervisorId}`)
  return { data: data.requests || [] }
}

export const updateRequestStatus = async (id: ID, status: 'Accepted' | 'Rejected'): Promise<void> => {
  await axios.put(`${REQUEST_URL}/${id}/status`, { status })
}

