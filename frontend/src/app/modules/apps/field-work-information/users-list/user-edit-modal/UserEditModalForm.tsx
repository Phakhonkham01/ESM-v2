import { FC } from 'react'
import { RequestOTFieldWork } from '../core/_models'
import { format } from 'date-fns'

type Props = {
  isUserLoading: boolean
  request?: RequestOTFieldWork
  onClose?: () => void
}

interface User {
  _id?: string
  id?: string
  user_name: string
  user_email?: string
  first_name_en?: string
  last_name_en?: string
  role?: 'admin' | 'employee' | 'supervisor'
  department_id?: Department | Department[] | string | string[] | null
}

interface Department {
  _id?: string
  id?: string
  department_name: string
}

// ✅ Helper to extract user name
const extractUserName = (userData: string | User | null | undefined): string => {
  if (!userData) return 'N/A'

  if (typeof userData === 'string') return userData

  if (typeof userData === 'object' && userData !== null) {
    const user = userData as User
    return user.user_name ||
      `${user.first_name_en || ''} ${user.last_name_en || ''}`.trim() ||
      'Unknown'
  }

  return 'N/A'
}

// ✅ Helper to extract supervisor names (array support)
const extractSupervisorNames = (
  supervisorData: string | string[] | User | User[] | null | undefined
): string => {
  if (!supervisorData) return 'N/A'

  if (Array.isArray(supervisorData)) {
    const names = supervisorData
      .map(sup => extractUserName(sup))
      .filter(name => name !== 'N/A')

    return names.length > 0 ? names.join(', ') : 'N/A'
  }

  return extractUserName(supervisorData)
}

// ✅ Helper to extract department names from user object
const extractDepartmentNames = (
  user: User | string | null | undefined
): string => {
  if (!user) return 'N/A'

  // If user is a string (just ID), we can't get department name
  if (typeof user === 'string') return 'N/A'

  const department = user.department_id

  if (!department) return 'N/A'

  // If department is an array
  if (Array.isArray(department)) {
    const deptNames = department
      .map(dept => {
        if (typeof dept === 'object' && dept !== null && 'department_name' in dept) {
          return dept.department_name
        }
        return null
      })
      .filter((name): name is string => name !== null && name !== '')

    return deptNames.length > 0 ? deptNames.join(', ') : 'N/A'
  }

  // If department is a single object
  if (typeof department === 'object' && department !== null && 'department_name' in department) {
    return department.department_name || 'N/A'
  }

  // If department is just a string (ID)
  return 'N/A'
}

// ✅ Helper to format date
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A'

  try {
    const dateObj = new Date(date)
    return format(dateObj, 'dd/MM/yyyy')
  } catch {
    return 'Invalid Date'
  }
}

// ✅ Helper to format time
const formatTime = (time: string | null | undefined): string => {
  if (!time) return 'N/A'
  return time
}

const RequestOTFieldWorkViewModal: FC<Props> = ({ request, isUserLoading, onClose }) => {
  if (isUserLoading) {
    return (
      <div className="text-center py-10">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="text-muted mt-3">Loading request details...</div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="text-center py-10">
        <i className="bi bi-exclamation-triangle fs-1 text-warning mb-3"></i>
        <div className="text-muted fs-4">Request not found</div>
        {onClose && (
          <button className="btn btn-sm btn-primary mt-3" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    )
  }

  const employeeName = extractUserName(request.user_id)
  const supervisorNames = extractSupervisorNames(request.supervisor_id)
  const departmentName = extractDepartmentNames(request.user_id)
  const requestDate = formatDate(request.date)
  const startHour = formatTime(request.start_hour)
  const endHour = formatTime(request.end_hour)
  const dateOff = request.date_off ? formatDate(request.date_off) : 'Not specified'

  // Calculate hours worked
  const calculateHours = (): string => {
    if (!request.start_hour || !request.end_hour) return 'N/A'

    try {
      const [startH, startM] = request.start_hour.split(':').map(Number)
      const [endH, endM] = request.end_hour.split(':').map(Number)

      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM

      const diffMinutes = endMinutes - startMinutes
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60

      return `${hours}h ${minutes}m`
    } catch {
      return 'N/A'
    }
  }

  const totalHours = calculateHours()

  // Status badge
  const getStatusBadge = () => {
    const statusColors = {
      Pending: 'badge-warning',
      Accepted: 'badge-success',
      Rejected: 'badge-danger'
    }

    const status = request.status || 'Pending'
    const colorClass = statusColors[status as keyof typeof statusColors] || 'badge-secondary'

    return (
      <span className={`badge ${colorClass} fs-6`}>
        <i className={`bi ${status === 'Pending' ? 'bi-clock-history' :
          status === 'Accepted' ? 'bi-check-circle-fill' :
            'bi-x-circle-fill'
          } me-1`}></i>
        {status}
      </span>
    )
  }

  // Type badge
  const getTypeBadge = () => {
    const isOT = request.title === 'OT'

    return (
      <span className={`badge ${isOT ? 'badge-primary' : 'badge-info'} fs-6`}>
        <i className={`bi ${isOT ? 'bi-clock' : 'bi-briefcase'} me-1`}></i>
        {isOT ? 'Over Time (OT)' : 'Field Work'}
      </span>
    )
  }

  return (
    <div>
      <div className="card-body py-3">
        <div className="row mb-7">
          <div className="col-md-6">
            <div className="mb-3">
              <div className="fw-bold text-muted fs-7 mb-2">Request Type</div>
              <div className="d-flex gap-2">
                {getTypeBadge()}
                {getStatusBadge()}
              </div>
            </div>
            <div>
              <div className="fw-bold text-muted fs-7 mb-2 pt-7">Request Date</div>
              <div className="fw-bold fs-5 text-gray-800">
                <i className="bi bi-calendar-event me-2 text-primary"></i>
                {requestDate}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="border p-4 text-center">
              <div className="fw-bold text-muted fs-7 mb-2">Total Duration</div>
              <div className="fw-bold fs-4 text-success">
                <i className="bi bi-hourglass-split me-2"></i>
                {totalHours}
              </div>
            </div>
          </div>
        </div>

        {/* Employee & Supervisor Section */}
        <div className="row mb-5">
          <div className="col-md-6">
            <div className="d-flex align-items-center mb-5">
              <div className="symbol symbol-50px symbol-circle me-4">
                <div className="symbol-label bg-light-primary">
                  <i className="bi bi-person-fill text-primary fs-2"></i>
                </div>
              </div>
              <div>
                <div className="fw-bold text-muted fs-7 mb-1">Employee</div>
                <div className="fw-bold fs-5 text-gray-800">{employeeName}</div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="d-flex align-items-center mb-5">
              <div className="symbol symbol-50px symbol-circle me-4">
                <div className="symbol-label bg-light-success">
                  <i className="bi bi-people-fill text-success fs-2"></i>
                </div>
              </div>
              <div>
                <div className="fw-bold text-muted fs-7 mb-1">Supervisor</div>
                <div className="fw-bold fs-5 text-gray-800">{supervisorNames}</div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="d-flex align-items-center mb-5">
              <div className="symbol symbol-50px symbol-circle me-4">
                <div className="symbol-label bg-light-info">
                  <i className="bi bi-building text-info fs-2"></i>
                </div>
              </div>
              <div>
                <div className="fw-bold text-muted fs-7 mb-1">Department</div>
                <div className="fw-bold fs-5 text-gray-800">{departmentName}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Range Section */}
        <div className="row mb-7">
          <div className="col-md-4">
            <div className="border rounded p-4 text-center">
              <div className="fw-bold text-muted fs-7 mb-2">Start Time</div>
              <div className="fw-bold fs-5 text-gray-800">
                <i className="bi bi-clock text-success me-2"></i>
                {startHour}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="border rounded p-4 text-center">
              <div className="fw-bold text-muted fs-7 mb-2">End Time</div>
              <div className="fw-bold fs-5 text-gray-800">
                <i className="bi bi-clock text-danger me-2"></i>
                {endHour}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="border rounded p-4 text-center">
              <div className="fw-bold text-muted fs-7 mb-2">Fuel Cost</div>
              <div className="fw-bold fs-5 text-gray-800">
                <i className="bi bi-fuel-pump me-2 text-warning"></i>
                {request.fuel?.toLocaleString() || '0'} LAK
              </div>
            </div>
          </div>
        </div>

        {/* Reason Section */}
        <div className="mb-7">
          <div className="fw-bold text-muted fs-7 mb-3">Reason for Request</div>
          <div className="card bg-light-primary border-primary border-2">
            <div className="card-body p-5">
              <p className="text-gray-800 fs-5 mb-0">
                {request.reason || 'No reason provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {request.description && (
          <div className="mb-7">
            <div className="fw-bold text-muted fs-7 mb-3">Additional Description</div>
            <div className="card bg-light border-2">
              <div className="card-body p-5">
                <p className="text-gray-700 fs-5 mb-0">
                  <i className="bi bi-card-text text-gray-600 me-2"></i>
                  {request.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="border-top pt-5 mt-5">
          <div className="row">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <div className="symbol symbol-40px symbol-circle me-3">
                  <div className="symbol-label bg-light">
                    <i className="bi bi-calendar-plus text-primary"></i>
                  </div>
                </div>
                <div>
                  <div className="fw-bold text-muted fs-7">Created At</div>
                  <div className="fw-bold fs-6 text-gray-800">
                    {request.createdAt ? format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <div className="symbol symbol-40px symbol-circle me-3">
                  <div className="symbol-label bg-light">
                    <i className="bi bi-clock-history text-success"></i>
                  </div>
                </div>
                <div>
                  <div className="fw-bold text-muted fs-7">Last Updated</div>
                  <div className="fw-bold fs-6 text-gray-800">
                    {request.updatedAt ? format(new Date(request.updatedAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { RequestOTFieldWorkViewModal }