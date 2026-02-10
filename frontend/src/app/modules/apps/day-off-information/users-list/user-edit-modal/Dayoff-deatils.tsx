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
            console.error('Error fetching request details:', err)
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
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
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
                        <div className="modal-body">
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
                                <div className="row g-6">
                                    {/* Status Badge */}
                                    <div className="col-12 mb-4">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className={clsx('badge', getStatusBadgeClass(request.status), 'fs-6 px-3 py-2')}>
                                                <i className={clsx('bi', getStatusIcon(request.status), 'me-2')}></i>
                                                {request.status || 'Unknown Status'}
                                            </span>
                                            <span className={clsx('badge', getDayOffTypeBadgeClass(request.day_off_type), 'fs-6 px-3 py-2')}>
                                                {request.day_off_type === 'FULL_DAY' ? 'Full Day' : 'Half Day'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Employee Information */}
                                    <div className="col-md-6">
                                        <div className="card card-flush bg-light mb-6">
                                            <div className="card-header">
                                                <h6 className="card-title text-gray-800 fw-bold">
                                                    <i className="bi bi-person-badge me-2"></i>
                                                    Employee Information
                                                </h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="mb-3">
                                                    <label className="text-gray-600 fw-semibold d-block mb-1">Employee Name</label>
                                                    <div className="fw-bold text-gray-800">
                                                        {request.employee_name || 'N/A'}
                                                    </div>
                                                </div>

                                                {request.employee_email && (
                                                    <div className="mb-3">
                                                        <label className="text-gray-600 fw-semibold d-block mb-1">Email</label>
                                                        <div className="text-gray-800">
                                                            <i className="bi bi-envelope me-2"></i>
                                                            {request.employee_email}
                                                        </div>
                                                    </div>
                                                )}

                                                {request.department_name && (
                                                    <div className="mb-3">
                                                        <label className="text-gray-600 fw-semibold d-block mb-1">Department</label>
                                                        <div className="text-gray-800">
                                                            <i className="bi bi-building me-2"></i>
                                                            {request.department_name}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Supervisor Information */}
                                    <div className="col-md-6">
                                        <div className="card card-flush bg-light mb-6">
                                            <div className="card-header">
                                                <h6 className="card-title text-gray-800 fw-bold">
                                                    <i className="bi bi-person-check me-2"></i>
                                                    Supervisor Information
                                                </h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="mb-3">
                                                    <label className="text-gray-600 fw-semibold d-block mb-1">Supervisor Name</label>
                                                    <div className="fw-bold text-gray-800">
                                                        {request.supervisor_name || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Request Details */}
                                    <div className="col-12">
                                        <div className="card card-flush bg-light mb-6">
                                            <div className="card-header">
                                                <h6 className="card-title text-gray-800 fw-bold">
                                                    <i className="bi bi-calendar-event me-2"></i>
                                                    Request Details
                                                </h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="row">
                                                    {/* Start Date & Time - ✅ แก้ไขตรงนี้ */}
                                                    <div className="col-md-6 mb-4">
                                                        <label className="text-gray-600 fw-semibold d-block mb-1">Start Date & Time</label>
                                                        <div className="fw-bold text-gray-800">
                                                            <div className="d-flex align-items-center">
                                                                <i className="bi bi-calendar-date text-primary me-2"></i>
                                                                <div>
                                                                    <div>{formatDate(getSafeString(request?.start_date_time))}</div>
                                                                    <div className="text-muted fs-7">
                                                                        <div>{formatTime(getSafeString(request?.start_date_time))}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* End Date & Time - ✅ แก้ไขตรงนี้ */}
                                                    <div className="col-md-6 mb-4">
                                                        <label className="text-gray-600 fw-semibold d-block mb-1">End Date & Time</label>
                                                        <div className="fw-bold text-gray-800">
                                                            <div className="d-flex align-items-center">
                                                                <i className="bi bi-calendar-date text-primary me-2"></i>
                                                                <div>
                                                                    <div>{formatDate(getSafeString(request?.end_date_time))}</div>
                                                                    <div className="text-muted fs-7">
                                                                        <div>{formatTime(getSafeString(request?.end_date_time))}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Days Information */}
                                                    <div className="col-md-6 mb-4">
                                                        <label className="text-gray-600 fw-semibold d-block mb-1">Total Days Off</label>
                                                        <div className="fw-bold text-gray-800">
                                                            <span className="badge badge-light-primary fs-6 px-3 py-2">
                                                                {request.date_off_number} {request.date_off_number === 1 ? 'day' : 'days'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Half Day Period (if applicable) */}
                                                    {request.day_off_type === 'HALF_DAY' && (
                                                        <div className="col-md-6 mb-4">
                                                            <label className="text-gray-600 fw-semibold d-block mb-1">Time Period</label>
                                                            <div className="fw-bold text-gray-800">
                                                                <span className="badge badge-light-info fs-6 px-3 py-2">
                                                                    {getHalfDayPeriodText(request)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Reason (if available) */}
                                                {request.reason && (
                                                    <div className="mt-4">
                                                        <label className="text-gray-600 fw-semibold d-block mb-2">Reason</label>
                                                        <div className="p-3 bg-white rounded border">
                                                            <p className="mb-0">{request.reason}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Title (if available) */}
                                                {request.title && request.title !== 'Day off request' && (
                                                    <div className="mt-4">
                                                        <label className="text-gray-600 fw-semibold d-block mb-2">Title</label>
                                                        <div className="text-gray-800 fw-bold">
                                                            {request.title}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metadata */}
                                    <div className="col-12">
                                        <div className="card card-flush bg-light">
                                            <div className="card-header">
                                                <h6 className="card-title text-gray-800 fw-bold">
                                                    <i className="bi bi-info-circle me-2"></i>
                                                    Additional Information
                                                </h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="row text-muted fs-7">
                                                    {request.created_at && (
                                                        <div className="col-md-6">
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="bi bi-calendar-plus me-2"></i>
                                                                <div>
                                                                    <div className="fw-semibold">Created</div>
                                                                    <div>{formatDateTime(getSafeString(request?.created_at))}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {request.updated_at && (
                                                        <div className="col-md-6">
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="bi bi-calendar-check me-2"></i>
                                                                <div>
                                                                    <div className="fw-semibold">Last Updated</div>
                                                                    <div>{formatDateTime(getSafeString(request?.updated_at))}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {request._id && (
                                                        <div className="col-12 mt-2">
                                                            <div className="d-flex align-items-center">
                                                                <i className="bi bi-hash me-2"></i>
                                                                <div>
                                                                    <div className="fw-semibold">Request ID</div>
                                                                    <div className="font-monospace fs-7">{request._id}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
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

                        {/* Modal Footer */}
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default DayOffRequestViewModalForm