import axios, { AxiosResponse } from 'axios'
import { ID } from '../../../../../../_metronic/helpers'
import { DayOffRequest, DayOffQueryResponse } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
const DAY_OFF_URL = `${API_URL}/day-off-requests`

// ✅ GET ALL DAY OFF REQUESTS
export const getDayOffRequests = async (query: string): Promise<DayOffQueryResponse> => {
  const { data }: AxiosResponse<{ success: boolean; requests: DayOffRequest[] }> = 
    await axios.get(`${DAY_OFF_URL}/allusers?${query}`)

  return {
    data: data.requests || [],
  }
}

// ✅ GET DAY OFF BY ID
export const getDayOffById = async (id: ID): Promise<DayOffRequest> => {
  const { data }: AxiosResponse<{ success: boolean; requests: DayOffRequest[] }> = 
    await axios.get(`${DAY_OFF_URL}/allusers`)

  const found = data.requests.find(
    (item) => (item._id || item.id) === id
  )

  if (!found) {
    throw new Error('Day off request not found')
  }

  return found
}
// ✅ APPROVE DAY OFF
export const approveDayOff = async (id: ID): Promise<void> => {
  await axios.patch(`${DAY_OFF_URL}/${id}/status`, { status: 'Accepted' })
}

// ✅ REJECT DAY OFF
export const rejectDayOff = async (id: ID): Promise<void> => {
  await axios.patch(`${DAY_OFF_URL}/${id}/status`, { status: 'Rejected' })
}

// ✅ DELETE DAY OFF
export const deleteDayOff = async (id: ID): Promise<void> => {
  await axios.delete(`${DAY_OFF_URL}/${id}`)
}

// ✅ DELETE MULTIPLE
export const deleteSelectedDayOffs = async (ids: ID[]): Promise<void> => {
  await Promise.all(ids.map(deleteDayOff))
}