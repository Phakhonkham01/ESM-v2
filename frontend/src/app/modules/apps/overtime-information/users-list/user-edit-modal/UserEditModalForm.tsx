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
        <i className={`bi ${
          status === 'Pending' ? 'bi-clock-history' :
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
    <div className="card">
      <div className="card-header border-0 pt-5">
        <h3 className="card-title align-items-start flex-column">
          <span className="card-label fw-bold fs-3 mb-1">Request Details</span>
          <span className="text-muted mt-1 fw-semibold fs-7">View OT/Field Work Request</span>
        </h3>
        <div className="card-toolbar">
          {getStatusBadge()}
        </div>
      </div>

      <div className="card-body py-3">
        {/* Type & Date Section */}
        <div className="row mb-7">
          <div className="col-md-6">
            <label className="fw-bold text-muted fs-7 mb-2">Request Type</label>
            <div>{getTypeBadge()}</div>
          </div>
          <div className="col-md-6">
            <label className="fw-bold text-muted fs-7 mb-2">Request Date</label>
            <div className="fw-semibold fs-6 text-gray-800">
              <i className="bi bi-calendar-event me-2 text-primary"></i>
              {requestDate}
            </div>
          </div>
        </div>

        {/* Employee Section */}
        <div className="mb-7">
          <label className="fw-bold text-muted fs-7 mb-2">Employee</label>
          <div className="d-flex align-items-center">
            <div className="symbol symbol-40px symbol-circle me-3">
              <div className="symbol-label bg-light-primary">
                <i className="bi bi-person-fill text-primary fs-4"></i>
              </div>
            </div>
            <div className="fw-semibold fs-6 text-gray-800">{employeeName}</div>
          </div>
        </div>

        {/* Supervisors Section */}
        <div className="mb-7">
          <label className="fw-bold text-muted fs-7 mb-2">Supervisor(s)</label>
          <div className="d-flex align-items-center">
            <div className="symbol symbol-40px symbol-circle me-3">
              <div className="symbol-label bg-light-success">
                <i className="bi bi-people-fill text-success fs-4"></i>
              </div>
            </div>
            <div className="fw-semibold fs-6 text-gray-800">{supervisorNames}</div>
          </div>
        </div>

        {/* Time Section */}
        <div className="row mb-7">
          <div className="col-md-4">
            <label className="fw-bold text-muted fs-7 mb-2">Start Time</label>
            <div className="fw-semibold fs-6 text-gray-800">
              <i className="bi bi-clock me-2 text-success"></i>
              {startHour}
            </div>
          </div>
          <div className="col-md-4">
            <label className="fw-bold text-muted fs-7 mb-2">End Time</label>
            <div className="fw-semibold fs-6 text-gray-800">
              <i className="bi bi-clock me-2 text-danger"></i>
              {endHour}
            </div>
          </div>
          <div className="col-md-4">
            <label className="fw-bold text-muted fs-7 mb-2">Total Hours</label>
            <div className="fw-semibold fs-6 text-primary">
              <i className="bi bi-hourglass-split me-2"></i>
              {totalHours}
            </div>
          </div>
        </div>

        {/* Fuel & Date Off Section */}
        <div className="row mb-7">
          <div className="col-md-6">
            <label className="fw-bold text-muted fs-7 mb-2">Fuel Cost</label>
            <div className="fw-semibold fs-6 text-gray-800">
              <i className="bi bi-fuel-pump me-2 text-warning"></i>
              {request.fuel?.toLocaleString() || '0'} LAK
            </div>
          </div>
          <div className="col-md-6">
            <label className="fw-bold text-muted fs-7 mb-2">Compensation Date Off</label>
            <div className="fw-semibold fs-6 text-gray-800">
              <i className="bi bi-calendar-check me-2 text-info"></i>
              {dateOff}
            </div>
          </div>
        </div>

        {/* Reason Section */}
        <div className="mb-7">
          <label className="fw-bold text-muted fs-7 mb-2">Reason</label>
          <div className="card bg-light-primary border-primary border-dashed">
            <div className="card-body p-4">
              <p className="text-gray-800 mb-0">
                {request.reason || 'No reason provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {request.description && (
          <div className="mb-7">
            <label className="fw-bold text-muted fs-7 mb-2">Additional Description</label>
            <div className="card bg-light border-dashed">
              <div className="card-body p-4">
                <p className="text-gray-700 mb-0">
                  {request.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timestamps */}
        {request.createdAt && (
          <div className="border-top pt-5 mt-5">
            <div className="row">
              <div className="col-md-6">
                <label className="fw-bold text-muted fs-8 mb-1">Created At</label>
                <div className="text-gray-600 fs-7">
                  <i className="bi bi-calendar-plus me-1"></i>
                  {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm')}
                </div>
              </div>
              {request.updatedAt && (
                <div className="col-md-6">
                  <label className="fw-bold text-muted fs-8 mb-1">Last Updated</label>
                  <div className="text-gray-600 fs-7">
                    <i className="bi bi-clock-history me-1"></i>
                    {format(new Date(request.updatedAt), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

       <div className="card-footer d-flex justify-content-end py-4 px-6">
        {onClose && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            <i className="bi bi-x-circle me-2"></i>
            Close
          </button>
        )}
      </div>
    </div>
  )
}

export { RequestOTFieldWorkViewModal }