import { FC, useState, useEffect } from 'react'
import { KTIcon } from '../../../../../../../_metronic/helpers'
import { toast } from 'react-toastify'
import axios from 'axios'
import { 
  approveHoliday, 
  rejectHoliday,
  
} from '../../../../holiday/users-list/core/_requests'
import { 
  syncHolidayToGoogleCalendar,
  unsyncHolidayFromGoogleCalendar,
  checkGoogleCalendarStatus,
  getGoogleCalendarAuthUrl
} from '../../core/_requests'

const API_URL = import.meta.env.VITE_API_API_URL || 'http://localhost:8000/api'

type Props = {
  holidayId: string
  onClose: () => void
  currentUser: any
  onRefetch?: () => void
}

const HolidayViewModal: FC<Props> = ({ holidayId, onClose, currentUser, onRefetch }) => {
  const [holiday, setHoliday] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  // ✅ Google Calendar states
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isGoogleSynced, setIsGoogleSynced] = useState(false)

  useEffect(() => {
    const fetchHoliday = async () => {
      setLoading(true)
      try {
        const response = await axios.get(`${API_URL}/holidays/${holidayId}`)
        console.log('📋 Holiday response:', response)
        
        const holidayData = response.data.data || response.data
        setHoliday(holidayData)
        
        // ✅ ตรวจสอบว่า holiday นี้ sync แล้วหรือยัง
        setIsGoogleSynced(!!holidayData.google_calendar_event_id)
      } catch (error: any) {
        console.error('Error fetching holiday:', error)
        toast.error('Unable to load holiday details')
      } finally {
        setLoading(false)
      }
    }

    if (holidayId) {
      fetchHoliday()
    }
  }, [holidayId])

  // ✅ ตรวจสอบสถานะการเชื่อมต่อ Google Calendar
  useEffect(() => {
    const checkConnection = async () => {
      if (!currentUser?._id) return
      
      try {
        setIsCheckingConnection(true)
        const response = await checkGoogleCalendarStatus(currentUser._id)
        setIsGoogleConnected(response.connected)
        console.log('✅ Google Calendar connected:', response.connected)
      } catch (error) {
        console.error('Error checking Google connection:', error)
        setIsGoogleConnected(false)
      } finally {
        setIsCheckingConnection(false)
      }
    }

    checkConnection()
  }, [currentUser])

  // ✅ Handle Connect to Google Calendar
  const handleConnectGoogle = async () => {
    if (!currentUser?._id) {
      toast.error('User not found')
      return
    }

    try {
      const authUrl = await getGoogleCalendarAuthUrl(currentUser._id)
      window.location.href = authUrl
    } catch (error) {
      console.error('Error getting auth URL:', error)
      toast.error('Failed to connect to Google Calendar')
    }
  }

  // ✅ Handle Sync to Google Calendar
  const handleSyncToGoogle = async () => {
    if (!holiday?._id || !currentUser?._id) {
      toast.error('Missing required data')
      return
    }

    if (!isGoogleConnected) {
      const shouldConnect = window.confirm(
        'You need to connect Google Calendar first. Connect now?'
      )
      if (shouldConnect) {
        handleConnectGoogle()
      }
      return
    }

    if (isGoogleSynced) {
      toast.info('This holiday is already synced to Google Calendar')
      return
    }

    setIsSyncing(true)
    try {
      console.log('🔄 Syncing holiday to Google Calendar...', {
        holidayId: holiday._id,
        userId: currentUser._id
      })

      const response = await syncHolidayToGoogleCalendar(holiday._id, currentUser._id)
      
      toast.success('✅ Holiday synced to Google Calendar successfully!')
      
      // ✅ Refresh holiday data
      const updatedHoliday = await axios.get(`${API_URL}/holidays/${holiday._id}`)
      setHoliday(updatedHoliday.data.data || updatedHoliday.data)
      setIsGoogleSynced(true)
      
      if (onRefetch) {
        await onRefetch()
      }
    } catch (error: any) {
      console.error('❌ Sync error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to sync holiday'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsSyncing(false)
    }
  }

  // ✅ Handle Remove from Google Calendar
  const handleRemoveFromGoogle = async () => {
    if (!holiday?._id || !currentUser?._id) {
      toast.error('Missing required data')
      return
    }

    if (!isGoogleSynced) {
      toast.info('This holiday is not synced to Google Calendar')
      return
    }

    setIsSyncing(true)
    try {
      await unsyncHolidayFromGoogleCalendar(holiday._id, currentUser._id)
      
      toast.success('✅ Holiday removed from Google Calendar')
      
      // ✅ Refresh holiday data
      const updatedHoliday = await axios.get(`${API_URL}/holidays/${holiday._id}`)
      setHoliday(updatedHoliday.data.data || updatedHoliday.data)
      setIsGoogleSynced(false)
      
      if (onRefetch) {
        await onRefetch()
      }
    } catch (error: any) {
      console.error('❌ Remove error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove holiday'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleApprove = async () => {
    if (!holiday?._id || !currentUser?._id) {
      toast.error('Missing required data')
      return
    }

    setLoading(true)
    try {
      console.log('🟢 Approving holiday:', {
        holidayId: holiday._id,
        approvedBy: currentUser._id,
        comment: comment || ''
      })

      const response = await approveHoliday(holiday._id, {
        approved_by: currentUser._id,
        comment: comment.trim() || undefined
      })

      console.log('✅ Approve response:', response)
      
      toast.success('✅ Holiday approved successfully!')
      
      const updatedHoliday = await axios.get(`${API_URL}/holidays/${holiday._id}`)
      setHoliday(updatedHoliday.data.data || updatedHoliday.data)
      
      if (onRefetch) {
        await onRefetch()
      }
      
      setComment('')
    } catch (error: any) {
      console.error('❌ Error approving holiday:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to approve holiday'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!holiday?._id || !currentUser?._id) {
      toast.error('Missing required data')
      return
    }

    if (!comment.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setLoading(true)
    try {
      console.log('🔴 Rejecting holiday:', {
        holidayId: holiday._id,
        approvedBy: currentUser._id,
        comment: comment.trim()
      })

      const response = await rejectHoliday(holiday._id, {
        approved_by: currentUser._id,
        comment: comment.trim()
      })

      console.log('✅ Reject response:', response)
      
      toast.success('Holiday rejected successfully')
      
      const updatedHoliday = await axios.get(`${API_URL}/holidays/${holiday._id}`)
      setHoliday(updatedHoliday.data.data || updatedHoliday.data)
      
      if (onRefetch) {
        await onRefetch()
      }
      
      setShowRejectInput(false)
      setComment('')
    } catch (error: any) {
      console.error('❌ Error rejecting holiday:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject holiday'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (date: string | Date) => {
    try {
      return new Date(date).toLocaleString('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const formatDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleDateString('en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="badge badge-light-success px-4 py-2">
            <i className="bi bi-check-circle me-2"></i>
            <span className="fw-bold">Approved</span>
          </span>
        )
      case 'rejected':
        return (
          <span className="badge badge-light-danger px-4 py-2">
            <i className="bi bi-x-circle me-2"></i>
            <span className="fw-bold">Rejected</span>
          </span>
        )
      case 'pending':
        return (
          <span className="badge badge-light-warning px-4 py-2">
            <i className="bi bi-clock-history me-2"></i>
            <span className="fw-bold">Pending Approval</span>
          </span>
        )
      default:
        return (
          <span className="badge badge-light-dark px-4 py-2">
            <span className="fw-bold">{status || 'Unknown'}</span>
          </span>
        )
    }
  }

  const getHolidayTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; color: string }> = {
      'public': { label: 'Public Holiday', color: 'success' },
      'public holiday': { label: 'Public Holiday', color: 'success' },
      'private': { label: 'Leave Day', color: 'danger' },
      'leave day': { label: 'Leave Day', color: 'danger' }
    }
    
    const config = typeConfig[type?.toLowerCase()] || { label: type, color: 'secondary' }
    
    return (
      <span className={`badge badge-light-${config.color} fw-bold px-3 py-2`}>
        {config.label}
      </span>
    )
  }

  const isCEO = currentUser?.role === 'CEO'
  const canChangeStatus = isCEO

  if (loading && !holiday) {
    return (
      <div className="modal-content">
        <div className="modal-body">
          <div className="text-center p-10">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading holiday details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!holiday) {
    return (
      <div className="modal-content">
        <div className="modal-body">
          <div className="alert alert-danger d-flex align-items-center">
            <KTIcon iconName="cross-circle" className="fs-2x me-3" />
            <div>
              <h5 className="mb-1">Holiday not found</h5>
              <p className="mb-0">The requested holiday could not be loaded.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-content">
      {/* Header with Status */}
      <div className="modal-header border-bottom pb-6">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bolder mb-0">Holiday Details</h2>
            <div
              className="btn btn-icon btn-sm btn-light btn-active-light-primary"
              onClick={onClose}
              style={{ cursor: 'pointer' }}
            >
              <KTIcon iconName="cross" className="fs-1" />
            </div>
          </div>
          
          <div className="d-flex align-items-center justify-content-between">
            <div>{getStatusBadge(holiday.status)}</div>
            
            {/* ✅ Google Calendar Status Badge */}
            {isGoogleSynced && (
              <a
                href={`https://calendar.google.com/calendar/r`}
                target="_blank"
                rel="noopener noreferrer"
                className="badge badge-light-success d-flex align-items-center px-3 py-2"
              >
                <i className="bi bi-google me-2"></i>
                <span className="fw-bold">Synced to Google Calendar</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="modal-body scroll-y mx-5 mx-xl-15 my-7">
        {/* Holiday Information Section */}
        <div className="card card-flush mb-7">
          <div className="card-header">
            <h3 className="card-title fw-bold">
              <KTIcon iconName="calendar-tick" className="fs-2 me-2 text-primary" />
              Holiday Information
            </h3>
          </div>
          <div className="card-body pt-4">
            {/* Holiday Name */}
            <div className="row mb-6">
              <div className="col-md-4">
                <label className="fw-bold fs-6 text-gray-700 mb-2">Holiday Name</label>
              </div>
              <div className="col-md-8">
                <div className="fs-5 fw-semibold text-gray-800">{holiday.holiday_name}</div>
              </div>
            </div>

            {/* Holiday Type */}
            {holiday.holiday_type && (
              <div className="row mb-6">
                <div className="col-md-4">
                  <label className="fw-bold fs-6 text-gray-700 mb-2">Holiday Type</label>
                </div>
                <div className="col-md-8">
                  {getHolidayTypeBadge(holiday.holiday_type)}
                </div>
              </div>
            )}

            {/* Description */}
            {holiday.description && (
              <div className="row mb-6">
                <div className="col-md-4">
                  <label className="fw-bold fs-6 text-gray-700 mb-2">Description</label>
                </div>
                <div className="col-md-8">
                  <div className="fs-6 text-gray-700 bg-light rounded p-3">
                    {holiday.description}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Date Section */}
        <div className="card card-flush mb-7">
          <div className="card-header">
            <h3 className="card-title fw-bold">
              <KTIcon iconName="calendar-8" className="fs-2 me-2 text-primary" />
              Date Range
            </h3>
          </div>
          <div className="card-body pt-4">
            <div className="row">
              {/* Start Date */}
              <div className="col-md-6 mb-6">
                <div className="d-flex align-items-center mb-3">
                  <div className="symbol symbol-40px me-4">
                    <div className="symbol-label bg-light-primary">
                      <KTIcon iconName="calendar" className="text-primary fs-2" />
                    </div>
                  </div>
                  <div>
                    <div className="fw-bold fs-6 text-gray-700">Start Date</div>
                    <div className="fw-semibold fs-5 text-gray-800">
                      {formatDate(holiday.start_date)}
                    </div>
                  </div>
                </div>
              </div>

              {/* End Date */}
              <div className="col-md-6 mb-6">
                <div className="d-flex align-items-center mb-3">
                  <div className="symbol symbol-40px me-4">
                    <div className="symbol-label bg-light-danger">
                      <KTIcon iconName="calendar" className="text-danger fs-2" />
                    </div>
                  </div>
                  <div>
                    <div className="fw-bold fs-6 text-gray-700">End Date</div>
                    <div className="fw-semibold fs-5 text-gray-800">
                      {formatDate(holiday.end_date)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="col-12">
                <div className="alert alert-light-info d-flex align-items-center">
                  <KTIcon iconName="time" className="fs-2 text-info me-3" />
                  <div>
                    <div className="fw-bold">Duration</div>
                    <div>
                      {Math.ceil((new Date(holiday.end_date).getTime() - new Date(holiday.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* People Section */}
        <div className="card card-flush mb-7">
          <div className="card-header">
            <h3 className="card-title fw-bold">
              <KTIcon iconName="people" className="fs-2 me-2 text-primary" />
              Requester information
            </h3>
          </div>
          <div className="card-body pt-4">
            {/* Created By */}
            <div className="row mb-6">
              <div className="col-md-4">
                <label className="fw-bold fs-6 text-gray-700 mb-2">Created By</label>
              </div>
              <div className="col-md-8">
                <div className="d-flex align-items-center">
                  <div className="symbol symbol-45px me-3">
                    <div className="symbol-label bg-light-info">
                      <KTIcon iconName="user" className="text-info fs-2" />
                    </div>
                  </div>
                  <div>
                    <div className="fw-semibold fs-5 text-gray-800">
                      {holiday.user_id?.user_name || holiday.created_by?.user_name || 'Unknown'}
                    </div>
                    <div className="text-muted">
                      {holiday.user_id?.user_email || holiday.created_by?.user_email || 'No email'}
                    </div>
                    {(holiday.user_id?.role || holiday.created_by?.role) && (
                      <span className="badge badge-light-info mt-1">
                        {holiday.user_id?.role || holiday.created_by?.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Created At */}
            {holiday.createdAt && (
              <div className="row mb-6">
                <div className="col-md-4">
                  <label className="fw-bold fs-6 text-gray-700 mb-2">Created At</label>
                </div>
                <div className="col-md-8">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-calendar-plus fs-3 text-primary me-3"></i>
                    <div className="text-gray-700">
                      {formatDateTime(holiday.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Approved/Rejected By */}
            {holiday.approved_by && (
              <div className="row">
                <div className="col-md-4">
                  <label className="fw-bold fs-6 text-gray-700 mb-2">
                    {holiday.status === 'approved' ? 'Approved By' : 'Rejected By'}
                  </label>
                </div>
                <div className="col-md-8">
                  <div className="d-flex align-items-center">
                    <div className="symbol symbol-45px me-3">
                      <div className={`symbol-label ${holiday.status === 'approved' ? 'bg-light-success' : 'bg-light-danger'}`}>
                        {holiday.status === 'approved' ? (
                          <KTIcon iconName="check-circle" className="text-success fs-2" />
                        ) : (
                          <KTIcon iconName="cross-circle" className="text-danger fs-2" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="fw-semibold fs-5 text-gray-800">
                        {typeof holiday.approved_by === 'object' 
                          ? holiday.approved_by.user_name || 'Unknown'
                          : holiday.approved_by}
                      </div>
                      {typeof holiday.approved_by === 'object' && holiday.approved_by.user_email && (
                        <div className="text-muted">{holiday.approved_by.user_email}</div>
                      )}
                      {holiday.approved_by?.role && (
                        <span className="badge badge-light-info mt-1">{holiday.approved_by.role}</span>
                      )}
                      {holiday.updatedAt && (
                        <div className="text-muted fs-7 mt-1">
                          <i className="bi bi-clock me-1"></i>
                          {formatDateTime(holiday.updatedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comment Section */}
        {holiday.comment && (
          <div className="card card-flush mb-7">
            <div className="card-header">
              <h3 className="card-title fw-bold">
                <KTIcon iconName="message-text-2" className="fs-2 me-2 text-primary" />
                Comment
              </h3>
            </div>
            <div className="card-body pt-4">
              <div className="alert alert-secondary mb-0">
                <div className="d-flex">
                  <KTIcon iconName="comment" className="fs-2 text-secondary me-3" />
                  <div>
                    <div className="fw-bold mb-2 card-title">Comment from {holiday.status === 'approved' ? 'Approver' : 'Rejector'}</div>
                    <div className="fs-6 card-title">{holiday.comment}</div>
                    {holiday.updatedAt && (
                      <div className="text-muted fs-7 mt-2">
                        <i className="bi bi-clock me-1"></i>
                        Updated: {formatDateTime(holiday.updatedAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Google Calendar Section */}
        <div className="card card-flush mb-7">
          <div className="card-header">
            <h3 className="card-title fw-bold">
              <i className="bi bi-google fs-2 me-2 text-primary"></i>
              Google Calendar Integration
            </h3>
          </div>
          <div className="card-body pt-4">
            {isCheckingConnection ? (
              <div className="text-center py-5">
                <span className="spinner-border spinner-border-sm me-2"></span>
                Checking connection...
              </div>
            ) : !isGoogleConnected ? (
              // ❌ Not Connected
              <div className="alert alert-warning d-flex align-items-center">
                <i className="bi bi-exclamation-triangle fs-2x me-3"></i>
                <div className="flex-grow-1">
                  <h5 className="mb-1">Google Calendar Not Connected</h5>
                  <p className="mb-3">Connect your Google Calendar to sync holidays automatically.</p>
                  <button 
                    className="btn btn-warning"
                    onClick={handleConnectGoogle}
                  >
                    <i className="bi bi-google me-2"></i>
                    Connect Google Calendar
                  </button>
                </div>
              </div>
            ) : isGoogleSynced ? (
              // ✅ Already Synced
              <div className="alert alert-success d-flex align-items-center">
                <i className="bi bi-check-circle fs-2x me-3"></i>
                <div className="flex-grow-1">
                  <h5 className="mb-1">Holiday Synced</h5>
                  <p className="mb-3">This holiday is synced with your Google Calendar.</p>
                  <div className="d-flex gap-2">
                    <a
                      href={`https://calendar.google.com/calendar/r`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-success"
                    >
                      <i className="bi bi-box-arrow-up-right me-2"></i>
                      Open in Google Calendar
                    </a>
                    <button
                      className="btn btn-sm btn-light-danger"
                      onClick={handleRemoveFromGoogle}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Removing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-trash me-2"></i>
                          Remove from Google Calendar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // 🔄 Ready to Sync
              <div className="alert alert-info d-flex align-items-center">
                <i className="bi bi-info-circle fs-2x me-3"></i>
                <div className="flex-grow-1">
                  <h5 className="mb-1">Ready to Sync</h5>
                  <p className="mb-3">
                    Sync this holiday to your Google Calendar to receive notifications.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={handleSyncToGoogle}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-upload me-2"></i>
                        Sync to Google Calendar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ℹ️ Info about holiday type */}
            <div className="mt-4 p-3 bg-light rounded">
              <div className="d-flex align-items-start">
                <i className="bi bi-info-circle text-primary me-2 mt-1"></i>
                <div>
                  <div className="fw-bold mb-1">Holiday Type</div>
                  <div className="text-muted fs-7">
                    This is a {getHolidayTypeBadge(holiday.holiday_type)} and will appear as an 
                    all-day event in your Google Calendar.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CEO-Only Actions Section */}
        {canChangeStatus && (
          <div className="card card-flush mb-7">
            <div className="card-header">
              <h3 className="card-title fw-bold">
                <KTIcon iconName="shield-tick" className="fs-2 me-2 text-primary" />
                Update Holiday Status
              </h3>
            </div>
            <div className="card-body pt-4">
              {/* Comment/Reason Input */}
              <div className="mb-6">
                <label className="fw-bold fs-6 text-gray-700 mb-3 d-flex align-items-center">
                  <KTIcon iconName="edit" className="fs-2 text-primary me-2" />
                  {showRejectInput ? 'Reason for Rejection (Required)' : 'Comment (Optional)'}
                </label>
                <textarea
                  className="form-control form-control-solid"
                  rows={3}
                  placeholder={showRejectInput ? 'Please provide a reason for rejection...' : 'Add a comment if needed...'}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-3">
                {!showRejectInput ? (
                  <>
                    {/* Approve Button */}
                    <button
                      type="button"
                      className="btn btn-success flex-fill d-flex align-items-center justify-content-center"
                      onClick={handleApprove}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <KTIcon iconName="check" className="fs-2 me-2" />
                          <span className="fw-bold">{holiday.status === 'approved' ? 'Re-Approve' : 'Approve'}</span>
                        </>
                      )}
                    </button>
                    
                    {/* Reject Button */}
                    <button
                      type="button"
                      className="btn btn-danger flex-fill d-flex align-items-center justify-content-center"
                      onClick={() => setShowRejectInput(true)}
                      disabled={loading}
                    >
                      <KTIcon iconName="cross-circle" className="fs-2 me-2" />
                      <span className="fw-bold">{holiday.status === 'rejected' ? 'Re-Reject' : 'Reject'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-light flex-fill"
                      onClick={() => {
                        setShowRejectInput(false)
                        setComment('')
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger flex-fill d-flex align-items-center justify-content-center"
                      onClick={handleReject}
                      disabled={loading || !comment.trim()}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <KTIcon iconName="shield-cross" className="fs-2 me-2" />
                          Confirm Rejection
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="modal-footer border-top">
        <button
          type="button"
          className="btn btn-light"
          onClick={onClose}
          disabled={loading || isSyncing}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export { HolidayViewModal }