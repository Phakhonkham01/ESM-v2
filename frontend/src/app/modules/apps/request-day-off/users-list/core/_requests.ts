// supervisor-day-off/users-list/core/_requests.ts
import axios from 'axios'
import { ID } from '../../../../../../_metronic/helpers'
import { DayOffItem, DayOffStats, SupervisorInfo } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
const DAY_OFF_URL = `${API_URL}/day-off-requests`

// Helper functions
export const getEmployeeDisplayName = (item: DayOffItem): string => {
  if (item.employee_name) return item.employee_name

  if (typeof item.employee_id === 'string') {
    return item.employee_id
  }

  if (typeof item.employee_id === 'object' && item.employee_id !== null) {
    return `${item.employee_id.first_name_en || ''} ${item.employee_id.last_name_en || ''}`.trim()
  }

  return '-'
}

export const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB') // DD/MM/YYYY
}

// Get supervisor info from localStorage
export const getSupervisorInfo = (): SupervisorInfo | null => {
  try {
    const authData = localStorage.getItem('auth')
    if (!authData) return null

    const auth = JSON.parse(authData)
    const user = auth.user

    if (user.role !== 'Supervisor') {
      return null
    }

    return {
      id: user._id,
      name: user.first_name_en && user.last_name_en 
        ? `${user.first_name_en} ${user.last_name_en}`
        : user.employee_id
        ? `S-${user.employee_id}`
        : user.email || 'Supervisor'
    }
  } catch (error) {
    console.error('Get supervisor info error:', error)
    return null
  }
}

// Main API: Get day off requests for supervisor
export const getDayOffRequests = async (queryParams: string): Promise<QueryResponse<DayOffItem[]>> => {
  try {
    const supervisor = getSupervisorInfo()
    if (!supervisor) {
      throw new Error('Access denied. Only supervisors can view this page.')
    }

    // Get all requests then filter by supervisor
    const response = await axios.get(`${DAY_OFF_URL}/allusers`)
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch data')
    }

    let allRequests: DayOffItem[] = response.data.requests || []
    
    // Filter by supervisor
    const filteredRequests = allRequests.filter((req: DayOffItem) => {
      const supervisorIdValue = req.supervisor_id || ''
      const supervisorNameValue = req.supervisor_name || ''

      // Check by supervisor ID
      if (typeof supervisorIdValue === 'string' && supervisorIdValue === supervisor.id) {
        return true
      }
      
      // Check by supervisor object
      if (typeof supervisorIdValue === 'object' && supervisorIdValue._id === supervisor.id) {
        return true
      }

      // Check by supervisor name
      if (supervisor.name && supervisorNameValue.includes(supervisor.name.split(' ')[0])) {
        return true
      }

      return false
    })

    // Parse query params
    const params = new URLSearchParams(queryParams)
    const status = params.get('status')
    const month = params.get('month')
    const search = params.get('search') || ''
    const page = parseInt(params.get('page') || '1')
    const perPage = parseInt(params.get('perPage') || '10')
    const sort = params.get('sort') || 'created_at'
    const order = params.get('order') || 'desc'

    // Apply filters
    let filteredData = [...filteredRequests]

    // Filter by status
    if (status && status !== 'all') {
      filteredData = filteredData.filter(item => item.status === status)
    }

    // Filter by month
    if (month) {
      filteredData = filteredData.filter(item => {
        const itemMonth = new Date(item.start_date_time).toISOString().slice(0, 7)
        return itemMonth === month
      })
    }

    // Search
    if (search) {
      const searchLower = search.toLowerCase()
      filteredData = filteredData.filter(item => {
        const employeeName = getEmployeeDisplayName(item).toLowerCase()
        return (
          item.title.toLowerCase().includes(searchLower) ||
          employeeName.includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower)
        )
      })
    }

    // Sorting
    filteredData.sort((a, b) => {
      let aValue: any = a
      let bValue: any = b
      
      if (sort.includes('.')) {
        const keys = sort.split('.')
        aValue = keys.reduce((obj, key) => obj?.[key], a)
        bValue = keys.reduce((obj, key) => obj?.[key], b)
      } else {
        aValue = a[sort as keyof DayOffItem]
        bValue = b[sort as keyof DayOffItem]
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'desc' 
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue)
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return order === 'desc' 
          ? bValue.getTime() - aValue.getTime()
          : aValue.getTime() - bValue.getTime()
      }

      return 0
    })

    // Pagination
    const total = filteredData.length
    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage
    const data = filteredData.slice(startIndex, endIndex)

    // Calculate stats
    const stats: DayOffStats = {
      pending: filteredRequests.filter(d => d.status === 'Pending').length,
      accepted: filteredRequests.filter(d => d.status === 'Accepted').length,
      rejected: filteredRequests.filter(d => d.status === 'Rejected').length,
      total: filteredRequests.length,
    }

    return {
      data,
      payload: {
        pagination: {
          page,
          perPage,
          total,
          links: []
        },
        stats,
        supervisor
      }
    }

  } catch (error: any) {
    console.error('Get day off requests error:', error)
    throw error
  }
}

// Approve request
export const approveDayOffRequest = async (id: ID): Promise<void> => {
  try {
    const response = await axios.patch(`${DAY_OFF_URL}/${id}/status`, {
      status: 'Accepted'
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to approve request')
    }
  } catch (error: any) {
    console.error('Approve request error:', error)
    throw error
  }
}

// Reject request
export const rejectDayOffRequest = async (id: ID): Promise<void> => {
  try {
    const response = await axios.patch(`${DAY_OFF_URL}/${id}/status`, {
      status: 'Rejected'
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to reject request')
    }
  } catch (error: any) {
    console.error('Reject request error:', error)
    throw error
  }
}

// Delete day off request (if needed)
export const deleteDayOffRequest = async (id: ID): Promise<void> => {
  await axios.delete(`${DAY_OFF_URL}/${id}`)
}

// Delete multiple requests
export const deleteSelectedDayOffRequests = async (ids: ID[]): Promise<void> => {
  await Promise.all(ids.map(deleteDayOffRequest))
}