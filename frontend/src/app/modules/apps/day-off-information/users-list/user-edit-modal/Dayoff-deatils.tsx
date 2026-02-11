import { FC, useEffect, useState } from 'react'
import { useListView } from '../core/ListViewProvider'
import { FormattedDayOffRequest } from '../core/_models'
import { getDayOffRequestById } from '../core/_requests'
import clsx from 'clsx'

/* -------------------- Component -------------------- */
export const DayOffRequestViewModalForm: FC = () => {
    /* -------------------- State -------------------- */
    const { itemIdForDetail, setItemIdForDetail } = useListView()
    const [request, setRequest] = useState<FormattedDayOffRequest | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /* -------------------- Effects -------------------- */
    useEffect(() => {
        if (itemIdForDetail) {
            fetchRequestDetails()
        } else {
            setRequest(null)
            setError(null)
        }
    }, [itemIdForDetail])

    /* -------------------- API Functions -------------------- */
    const fetchRequestDetails = async () => {
        if (!itemIdForDetail) return

        try {
            setLoading(true)
            setError(null)
            const data = await getDayOffRequestById(itemIdForDetail)
            setRequest(data)
        } catch (err: any) {
            setError('Unable to load request details. Please try again.')
            setRequest(null)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setItemIdForDetail(undefined)
        setRequest(null)
        setError(null)
    }

    /* -------------------- Helper Functions -------------------- */
    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A'

        const date = new Date(dateString)
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'

        const date = new Date(dateString)
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatTime = (dateString: string) => {
        if (!dateString) return 'N/A'

        const date = new Date(dateString)
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    const getStatusBadgeClass = (status?: string) => {
        if (!status) return 'badge-light-secondary'

        switch (status.toLowerCase()) {
            case 'pending': return 'badge-light-warning'
            case 'accepted': return 'badge-light-success'
            case 'rejected': return 'badge-light-danger'
            default: return 'badge-light-secondary'
        }
    }

    const getStatusIcon = (status?: string) => {
        if (!status) return 'bi-question-circle'

        switch (status.toLowerCase()) {
            case 'pending': return 'bi-clock-history'
            case 'accepted': return 'bi-check-circle'
            case 'rejected': return 'bi-x-circle'
            default: return 'bi-question-circle'
        }
    }

    const getDayOffTypeBadgeClass = (type?: 'FULL_DAY' | 'HALF_DAY') => {
        if (!type) return 'badge-light-secondary'

        switch (type) {
            case 'FULL_DAY': return 'badge-light-primary'
            case 'HALF_DAY': return 'badge-light-info'
            default: return 'badge-light-secondary'
        }
    }

    const getHalfDayPeriodText = (request: FormattedDayOffRequest) => {
        if (request.day_off_type !== 'HALF_DAY') return 'N/A'

        const startHour = new Date(request.start_date_time).getHours()
        if (startHour === 8 || startHour === 9) return 'Morning (08:30 - 12:00)'
        return 'Afternoon (13:30 - 17:00)'
    }
    const getSafeString = (value: any): string => {
        if (!value) return ''
        if (typeof value === 'string') return value
        if (typeof value === 'number') return value.toString()
        if (value instanceof Date) return value.toISOString()
        return String(value)
    }
    /* -------------------- Render -------------------- */
    if (!itemIdForDetail) {
        return null
    }

    return (
        <>
            {/* Modal Backdrop */}
            <div className="modal-backdrop fade show"></div>

            {/* Modal */}
            <div
                className="modal fade show d-block"
                tabIndex={-1}
                style={{ display: 'block' }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        handleClose()
                    }
                }}
            >
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content ">
                        {/* Modal Header */}
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="bi bi-calendar2-week me-2"></i>
                                Day Off Request Details
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={handleClose}
                                aria-label="Close"
                                disabled={loading}
                            />
                        </div>

                        {/* Modal Body */}
                        <div className="modal-body p-20">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-3 text-muted">Loading request details...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-5">
                                    <i className="bi bi-exclamation-triangle text-danger fs-1"></i>
                                    <p className="mt-3 text-danger">{error}</p>
                                    <button
                                        type="button"
                                        className="btn btn-light-primary mt-2"
                                        onClick={fetchRequestDetails}
                                    >
                                        <i className="bi bi-arrow-clockwise me-2"></i>
                                        Try Again
                                    </button>
                                </div>
                            ) : request ? (
                                <div className="card-body py-3">
                                    {/* Request Type & Status */}
                                    <div className="row mb-7">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <div className="fw-bold text-muted fs-7 mb-2">Request Type & Status</div>
                                                <div className="d-flex gap-2">
                                                    <span className={clsx('badge', getDayOffTypeBadgeClass(request.day_off_type), 'fs-6 px-3 py-2')}>
                                                        {request.day_off_type === 'FULL_DAY' ? 'Full Day' : 'Half Day'}
                                                    </span>
                                                    <span className={clsx('badge', getStatusBadgeClass(request.status), 'fs-6 px-3 py-2')}>
                                                        <i className={clsx('bi', getStatusIcon(request.status), 'me-2')}></i>
                                                        {request.status || 'Unknown Status'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="fw-bold text-muted fs-7 mb-2 pt-7">Request Date</div>
                                                <div className="fw-bold fs-5 text-gray-800">
                                                    <i className="bi bi-calendar-event me-2 text-primary"></i>
                                                    {formatDate(getSafeString(request?.created_at))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="border p-4 text-center">
                                                <div className="fw-bold text-muted fs-7 mb-2">Total Days Off</div>
                                                <div className="fw-bold fs-4 text-success">
                                                    <i className="bi bi-calendar-check me-2"></i>
                                                    {request.date_off_number} {request.date_off_number === 1 ? 'Day' : 'Days'}
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
                                                    <div className="fw-bold fs-5 text-gray-800">{request.employee_name || 'N/A'}</div>
                                                    {request.employee_email && (
                                                        <div className="text-muted fs-7">
                                                            <i className="bi bi-envelope me-1"></i>
                                                            {request.employee_email}
                                                        </div>
                                                    )}
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
                                                    <div className="fw-bold fs-5 text-gray-800">{request.supervisor_name || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </div>
                                        {request.department_name && (
                                            <div className="col-md-6">
                                                <div className="d-flex align-items-center mb-5">
                                                    <div className="symbol symbol-50px symbol-circle me-4">
                                                        <div className="symbol-label bg-light-info">
                                                            <i className="bi bi-building text-info fs-2"></i>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-muted fs-7 mb-1">Department</div>
                                                        <div className="fw-bold fs-5 text-gray-800">{request.department_name}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Time Range Section */}
                                    <div className="row mb-7">
                                        <div className="col-md-4">
                                            <div className="border rounded p-4 text-center">
                                                <div className="fw-bold text-muted fs-7 mb-2">Start Date & Time</div>
                                                <div className="fw-bold fs-6 text-gray-800 h-65px">
                                                    <i className="bi bi-clock text-success me-2"></i>
                                                    <div>{formatDate(getSafeString(request?.start_date_time))}</div>
                                                    <div className="text-muted fs-7 mt-1">{formatTime(getSafeString(request?.start_date_time))}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="border rounded p-4 text-center">
                                                <div className="fw-bold text-muted fs-7 mb-2">End Date & Time</div>
                                                <div className="fw-bold fs-6 text-gray-800 h-65px">
                                                    <i className="bi bi-clock text-danger me-2"></i>
                                                    <div>{formatDate(getSafeString(request?.end_date_time))}</div>
                                                    <div className="text-muted fs-7 mt-1">{formatTime(getSafeString(request?.end_date_time))}</div>
                                                </div>
                                            </div>
                                        </div>
                                        {request.day_off_type === 'HALF_DAY' && (
                                            <div className="col-md-4">
                                                <div className="border rounded p-4 text-center">
                                                    <div className="fw-bold text-muted fs-7 mb-2">Time Period</div>
                                                    <div className="fw-bold fs-5 text-gray-800 h-65px">
                                                        <i className="bi bi-hourglass-split me-2 text-warning"></i>
                                                        {getHalfDayPeriodText(request)}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Title Section */}
                                    {request.title && request.title !== 'Day off request' && (
                                        <div className="mb-7">
                                            <div className="fw-bold text-muted fs-7 mb-3">Reason for Request</div>
                                            <div className="card bg-light-primary border-primary border-2">
                                                <div className="card-body p-5">
                                                    <p className="text-gray-700 fs-5 mb-0">
                                                        <i className="bi bi-card-text text-gray-600 me-2"></i>
                                                        {request.title}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Timestamps */}
                                    <div className="border-top pt-5 mt-5">
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="d-flex align-items-center">
                                                    <div className="symbol symbol-40px symbol-circle me-3">
                                                        <div className="symbol-label bg-light">
                                                            <i className="bi bi-calendar-plus text-primary"></i>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-muted fs-7">Created At</div>
                                                        <div className="fw-bold fs-6 text-gray-800">
                                                            {formatDateTime(getSafeString(request?.created_at))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {request._id && (
                                                <div className="col-md-4">
                                                    <div className="d-flex align-items-center">
                                                        <div className="symbol symbol-40px symbol-circle me-3">
                                                            <div className="symbol-label bg-light">
                                                                <i className="bi bi-hash text-info"></i>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-muted fs-7">Request ID</div>
                                                            <div className="fw-bold fs-7 text-gray-800 font-monospace">
                                                                {request._id.substring(0, 8)}...
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <i className="bi bi-calendar-x text-muted fs-1"></i>
                                    <p className="mt-3 text-muted">No request data found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default DayOffRequestViewModalForm