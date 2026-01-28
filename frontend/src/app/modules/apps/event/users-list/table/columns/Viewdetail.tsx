import { FC, useState, useEffect } from 'react'
import { KTIcon } from '../../../../../../../_metronic/helpers'
import { 
  getEventById, 
  approveEvent, 
  rejectEvent,
  checkGoogleCalendarStatus,
  getGoogleCalendarAuthUrl,
  syncEventToGoogleCalendar,
  unsyncEventFromGoogleCalendar
} from '../../core/_requests'
import { toast } from 'react-toastify'
import { useQueryResponse } from '../../core/QueryResponseProvider'

type Props = {
  eventId: string
  onClose: () => void
  currentUser: any
}

const ViewDetailModal: FC<Props> = ({ eventId, onClose, currentUser }) => {
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const { refetch } = useQueryResponse()

  // ✅ Google Calendar states
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isGoogleSynced, setIsGoogleSynced] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true)
      try {
        const response = await getEventById(eventId)
        console.log('📋 Event response:', response)
        
        const eventData = response.data || response
        setEvent(eventData)
        
        // ✅ ตรวจสอบว่า event นี้ sync แล้วหรือยัง
        setIsGoogleSynced(!!eventData.google_calendar_event_id)
        
      } catch (error: any) {
        console.error('Error fetching event:', error)
        toast.error('Unable to load event details')
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

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
    if (!event?._id || !currentUser?._id) {
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
      toast.info('This event is already synced to Google Calendar')
      return
    }

    setIsSyncing(true)
    try {
      console.log('🔄 Syncing event to Google Calendar...', {
        eventId: event._id,
        userId: currentUser._id
      })

      const response = await syncEventToGoogleCalendar(event._id, currentUser._id)
      
      toast.success('✅ Event synced to Google Calendar successfully!')
      
      // ✅ Refresh event data
      const updatedEvent = await getEventById(event._id)
      setEvent(updatedEvent.data || updatedEvent)
      setIsGoogleSynced(true)
      
      await refetch()
    } catch (error: any) {
      console.error('❌ Sync error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to sync event'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsSyncing(false)
    }
  }

  // ✅ Handle Remove from Google Calendar
  const handleRemoveFromGoogle = async () => {
    if (!event?._id || !currentUser?._id) {
      toast.error('Missing required data')
      return
    }

    if (!isGoogleSynced) {
      toast.info('This event is not synced to Google Calendar')
      return
    }

    // const confirmed = window.confirm(
    //   'Are you sure you want to remove this event from Google Calendar?'
    // )
    // if (!confirmed) return

    setIsSyncing(true)
    try {
      await unsyncEventFromGoogleCalendar(event._id, currentUser._id)
      
      toast.success('✅ Event removed from Google Calendar')
      
      // ✅ Refresh event data
      const updatedEvent = await getEventById(event._id)
      setEvent(updatedEvent.data || updatedEvent)
      setIsGoogleSynced(false)
      
      await refetch()
    } catch (error: any) {
      console.error('❌ Remove error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove event'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleApprove = async () => {
    if (!event?._id || !currentUser?._id) {
      toast.error('Missing required data')
      return
    }

    setLoading(true)
    try {
      console.log('🟢 Approving event:', {
        eventId: event._id,
        approvedBy: currentUser._id,
        comment: comment || ''
      })

      const response = await approveEvent(event._id, {
        approved_by: currentUser._id,
        comment: comment.trim() || undefined
      })

      console.log('✅ Approve response:', response)
      
      toast.success('✅ Event approved successfully!')
      
      const updatedEvent = await getEventById(event._id)
      setEvent(updatedEvent.data || updatedEvent)
      
      await refetch()
      
      setComment('')
    } catch (error: any) {
      console.error('❌ Error approving event:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to approve event'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!event?._id || !currentUser?._id) {
      toast.error('Missing required data')
      return
    }

    if (!comment.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    if (!window.confirm('Are you sure you want to reject this event?')) {
      return
    }

    setLoading(true)
    try {
      console.log('🔴 Rejecting event:', {
        eventId: event._id,
        approvedBy: currentUser._id,
        comment: comment.trim()
      })

      const response = await rejectEvent(event._id, {
        approved_by: currentUser._id,
        comment: comment.trim()
      })

      console.log('✅ Reject response:', response)
      
      toast.success('Event rejected successfully')
      
      const updatedEvent = await getEventById(event._id)
      setEvent(updatedEvent.data || updatedEvent)
      
      await refetch()
      
      setShowRejectInput(false)
      setComment('')
    } catch (error: any) {
      console.error('❌ Error rejecting event:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject event'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (date: string | Date) => {
    try {
      return new Date(date).toLocaleString('th-TH', {
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

  const formatTime = (date: string | Date) => {
    try {
      return new Date(date).toLocaleTimeString('en', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid time'
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
      case 'draft':
        return (
          <span className="badge badge-light-secondary px-4 py-2">
            <i className="bi bi-file-earmark me-2"></i>
            <span className="fw-bold">Draft</span>
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

  // ✅ Helper: แสดง participation status badge
  const getParticipationStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return (
          <span className="badge badge-success badge-sm">
            <i className="bi bi-check-circle me-1"></i>
            Accepted
          </span>
        )
      case 'pending':
        return (
          <span className="badge badge-warning badge-sm">
            <i className="bi bi-clock me-1"></i>
            Pending
          </span>
        )
      case 'declined':
        return (
          <span className="badge badge-danger badge-sm">
            <i className="bi bi-x-circle me-1"></i>
            Declined
          </span>
        )
      case 'not_required':
        return (
          <span className="badge badge-secondary badge-sm">
            <i className="bi bi-dash-circle me-1"></i>
            Not Required
          </span>
        )
      default:
        return (
          <span className="badge badge-light badge-sm">
            {status || 'Unknown'}
          </span>
        )
    }
  }

  // ✅ เฉพาะ CEO เท่านั้นที่สามารถเปลี่ยน status ได้
  const isCEO = currentUser?.role === 'CEO'
  const canChangeStatus = isCEO

  if (loading && !event) {
    return (
      <div className="modal-content">
        <div className="modal-body">
          <div className="text-center p-10">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading event details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="modal-content">
        <div className="modal-body">
          <div className="alert alert-danger d-flex align-items-center">
            <KTIcon iconName="cross-circle" className="fs-2x me-3" />
            <div>
              <h5 className="mb-1">Event not found</h5>
              <p className="mb-0">The requested event could not be loaded.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ✅ นับจำนวน participants ในแต่ละสถานะ
  const participantStats = {
    total: event.person_in_charge?.length || 0,
    accepted: event.person_in_charge?.filter((p: any) => 
      (p.participation_status || 'not_required').toLowerCase() === 'accepted'
    ).length || 0,
    pending: event.person_in_charge?.filter((p: any) => 
      (p.participation_status || 'not_required').toLowerCase() === 'pending'
    ).length || 0,
    declined: event.person_in_charge?.filter((p: any) => 
      (p.participation_status || 'not_required').toLowerCase() === 'declined'
    ).length || 0,
    not_required: event.person_in_charge?.filter((p: any) => 
      (p.participation_status || 'not_required').toLowerCase() === 'not_required'
    ).length || 0,
  }

  return (
    <div className="modal-content">
      {/* Header with Status */}
      <div className="modal-header border-bottom pb-6">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bolder mb-0">Event Details</h2>
            <div
              className="btn btn-icon btn-sm btn-light btn-active-light-primary"
              onClick={onClose}
              style={{ cursor: 'pointer' }}
            >
              <KTIcon iconName="cross" className="fs-1" />
            </div>
          </div>
          
          <div className="d-flex align-items-center justify-content-between">
            <div>{getStatusBadge(event.status)}</div>
            
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
        {/* Event Information Section */}
        <div className="card card-flush mb-7">
          <div className="card-header">
            <h3 className="card-title fw-bold">
              <KTIcon iconName="information-2" className="fs-2 me-2 text-primary" />
              Event Information
            </h3>
          </div>
          <div className="card-body pt-4">
            {/* Event Name */}
            <div className="row mb-6">
              <div className="col-md-4">
                <label className="fw-bold fs-6 text-gray-700 mb-2">Event Name</label>
              </div>
              <div className="col-md-8">
                <div className="fs-5 fw-semibold text-gray-800">{event.event_name}</div>
              </div>
            </div>

            {/* Event Type */}
            {event.event_type_id && (
              <div className="row mb-6">
                <div className="col-md-4">
                  <label className="fw-bold fs-6 text-gray-700 mb-2">Event Type</label>
                </div>
                <div className="col-md-8">
                  <div className="fs-6">
                    {typeof event.event_type_id === 'object' ? (
                      <div className="d-flex align-items-center">
                        <div 
                          className="badge fw-bolder px-3 py-2 me-2"
                          style={{ 
                            backgroundColor: event.event_type_id.event_type_color || '#6c757d',
                            color: '#fff'
                          }}
                        >
                          {event.event_type_id.event_type_name || 'Unknown'}
                        </div>
                        {event.event_type_id.event_type_color && (
                          <span 
                            className="badge badge-circle" 
                            style={{ 
                              backgroundColor: event.event_type_id.event_type_color,
                              width: '12px',
                              height: '12px'
                            }}
                          ></span>
                        )}
                      </div>
                    ) : (
                      <span className="badge badge-light-primary">{event.event_type_id}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="row mb-6">
                <div className="col-md-4">
                  <label className="fw-bold fs-6 text-gray-700 mb-2">Description</label>
                </div>
                <div className="col-md-8">
                  <div className="fs-6 text-gray-700 bg-light rounded p-3">
                    {event.description}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Date & Time Section */}
        <div className="card card-flush mb-7">
          <div className="card-header">
            <h3 className="card-title fw-bold">
              <KTIcon iconName="calendar-8" className="fs-2 me-2 text-primary" />
              Date & Time
            </h3>
          </div>
          <div className="card-body pt-4">
            <div className="row">
              {/* Start Date */}
              <div className="col-md-6 mb-6">
                <div className="d-flex align-items-center mb-3">
                  <div className="symbol symbol-40px me-4">
                    <div className="symbol-label bg-light-primary">
                      <KTIcon iconName="clock" className="text-primary fs-2" />
                    </div>
                  </div>
                  <div>
                    <div className="fw-bold fs-6 text-gray-700">Start Time</div>
                    <div className="fw-semibold fs-5 text-gray-800">
                      {formatDate(event.start_date)} • {formatTime(event.start_date)}
                    </div>
                  </div>
                </div>
              </div>

              {/* End Date */}
              <div className="col-md-6 mb-6">
                <div className="d-flex align-items-center mb-3">
                  <div className="symbol symbol-40px me-4">
                    <div className="symbol-label bg-light-danger">
                      <KTIcon iconName="clock" className="text-danger fs-2" />
                    </div>
                  </div>
                  <div>
                    <div className="fw-bold fs-6 text-gray-700">End Time</div>
                    <div className="fw-semibold fs-5 text-gray-800">
                      {formatDate(event.end_date)} • {formatTime(event.end_date)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ People Section แสดงทั้งหมดรวมถึง declined */}
        <div className="card card-flush mb-7">
          <div className="card-header">
            <h3 className="card-title fw-bold">
              <KTIcon iconName="people" className="fs-2 me-2 text-primary" />
              People Involved
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
                      {event.user_id?.user_name || 'Unknown'}
                    </div>
                    <div className="text-muted">
                      {event.user_id?.user_email || 'No email'}
                      {event.user_id?.role && (
                        <span className="badge badge-light-info ms-2">{event.user_id.role}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ Participants Summary */}
            {event.person_in_charge && event.person_in_charge.length > 0 && (
              <>
                {/* Stats Summary */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="alert alert-light d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <span className="fw-bold">Participants Summary:</span>
                      </div>
                      <div className="d-flex gap-3">
                        <div className="text-center">
                          <div className="fs-4 fw-bold text-success">{participantStats.accepted}</div>
                          <div className="fs-7 text-muted">Accepted</div>
                        </div>
                        <div className="text-center">
                          <div className="fs-4 fw-bold text-warning">{participantStats.pending}</div>
                          <div className="fs-7 text-muted">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="fs-4 fw-bold text-danger">{participantStats.declined}</div>
                          <div className="fs-7 text-muted">Declined</div>
                        </div>
                        <div className="text-center">
                          <div className="fs-4 fw-bold text-secondary">{participantStats.not_required}</div>
                          <div className="fs-7 text-muted">Not Required</div>
                        </div>
                        <div className="text-center">
                          <div className="fs-4 fw-bold text-dark">{participantStats.total}</div>
                          <div className="fs-7 text-muted">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ✅ Participants List - แสดงทั้งหมด */}
                <div className="row mb-6">
                  <div className="col-md-4">
                    <label className="fw-bold fs-6 text-gray-700 mb-2">
                      All Participants ({participantStats.total})
                    </label>
                  </div>
                  <div className="col-md-8">
                    <div className="d-flex flex-column gap-3">
                      {event.person_in_charge.map((person: any, index: number) => {
                        const participationStatus = person.participation_status || 'not_required'
                        const statusLower = participationStatus.toLowerCase()
                        const userName = person.user_id?.user_name || person.user_name || 'Unknown'
                        const userEmail = person.user_id?.user_email || person.user_email

                        // ✅ กำหนดสีและไอคอนตามสถานะ
                        const getStatusColor = () => {
                          switch (statusLower) {
                            case 'accepted':
                              return { bg: 'bg-light-success', icon: 'check-circle', iconColor: 'text-success' }
                            case 'pending':
                              return { bg: 'bg-light-warning', icon: 'clock', iconColor: 'text-warning' }
                            case 'declined':
                              return { bg: 'bg-light-danger', icon: 'x-circle', iconColor: 'text-danger' }
                            case 'not_required':
                            default:
                              return { bg: 'bg-light-secondary', icon: 'dash-circle', iconColor: 'text-secondary' }
                          }
                        }

                        const statusConfig = getStatusColor()

                        return (
                          <div 
                            key={person._id || person.id || index} 
                            className={`d-flex align-items-center justify-content-between p-3 rounded ${statusConfig.bg}`}
                            style={{ 
                              opacity: statusLower === 'declined' ? 0.8 : 1,
                              borderLeft: `4px solid ${
                                statusLower === 'accepted' ? '#28a745' : 
                                statusLower === 'pending' ? '#ffc107' : 
                                statusLower === 'declined' ? '#dc3545' : 
                                '#6c757d'
                              }`
                            }}
                          >
                            <div className="d-flex align-items-center">
                              <div className="symbol symbol-40px me-3">
                                <div className="symbol-label bg-white">
                                  <KTIcon 
                                    iconName={statusConfig.icon as any} 
                                    className={`fs-2 ${statusConfig.iconColor}`}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="fw-semibold fs-6">{userName}</div>
                                {userEmail && (
                                  <div className="text-muted fs-7">{userEmail}</div>
                                )}
                                {person.note && (
                                  <div className="text-muted fs-7 mt-1">
                                    <i className="bi bi-chat-left-text me-1"></i>
                                    Note: {person.note}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="d-flex flex-column align-items-end">
                              {getParticipationStatusBadge(participationStatus)}
                              {person.responded_at && (
                                <div className="text-muted fs-7 mt-1">
                                  <i className="bi bi-clock-history me-1"></i>
                                  {formatDateTime(person.responded_at)}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ✅ แสดงข้อความถ้าไม่มี participants */}
            {(!event.person_in_charge || event.person_in_charge.length === 0) && (
              <div className="alert alert-light d-flex align-items-center">
                <KTIcon iconName="information" className="fs-2  me-3 text-primary" />
                <div>
                  <div className="fw-bold card-title">No Participants</div>
                  <div className='card-title'>This event has no participants assigned.</div>
                </div>
              </div>
            )}

            {/* Approved/Rejected By */}
            {event.approved_by && (
              <div className="row">
                <div className="col-md-4">
                  <label className="fw-bold fs-6 text-gray-700 mb-2">
                    {event.status === 'approved' ? 'Approved By' : 'Rejected By'}
                  </label>
                </div>
                <div className="col-md-8">
                  <div className="d-flex align-items-center">
                    <div className="symbol symbol-45px me-3">
                      <div className={`symbol-label ${event.status === 'approved' ? 'bg-light-success' : 'bg-light-danger'}`}>
                        {event.status === 'approved' ? (
                          <KTIcon iconName="check-circle" className="text-success fs-2" />
                        ) : (
                          <KTIcon iconName="cross-circle" className="text-danger fs-2" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="fw-semibold fs-5 text-gray-800">
                        {typeof event.approved_by === 'object' 
                          ? event.approved_by.user_name || 'Unknown'
                          : event.approved_by}
                      </div>
                      {typeof event.approved_by === 'object' && event.approved_by.user_email && (
                        <div className="text-muted">{event.approved_by.user_email}</div>
                      )}
                      {event.approved_by?.role && (
                        <div className="text-muted fs-7">
                          Role: <span className="badge badge-light-info">{event.approved_by.role}</span>
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
        {event.comment && (
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
                    <div className="fw-bold mb-2 card-title">Comment from {event.status === 'approved' ? 'Approver' : 'Rejector'}</div>
                    <div className="fs-6 card-title">{event.comment}</div>
                    {event.updatedAt && (
                      <div className="text-muted fs-7 mt-2">
                        <i className="bi bi-clock me-1"></i>
                        Updated: {formatDateTime(event.updatedAt)}
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
                  <p className="mb-3">Connect your Google Calendar to sync events automatically.</p>
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
                  <h5 className="mb-1">Event Synced</h5>
                  <p className="mb-3">This event is synced with your Google Calendar.</p>
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
                    Sync this event to your Google Calendar to receive notifications and updates.
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

            {/* ℹ️ Info about attendees */}
            {event.person_in_charge && event.person_in_charge.length > 0 && (
              <div className="mt-4 p-3 bg-light rounded">
                <div className="d-flex align-items-start">
                  <i className="bi bi-info-circle text-primary me-2 mt-1"></i>
                  <div>
                    <div className="fw-bold mb-1">Event Attendees</div>
                    <div className="text-muted fs-7">
                      When synced, all participants ({participantStats.total} people) will receive 
                      Google Calendar invitations to their email addresses.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ CEO-Only Actions Section */}
        {canChangeStatus && (
          <div className="card card-flush mb-7">
            <div className="card-header">
              <h3 className="card-title fw-bold">
                <KTIcon iconName="shield-tick" className="fs-2 me-2 text-primary" />
                Update Event Status
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
                          <span className="fw-bold">{event.status === 'approved' ? 'Re-Approve' : 'Approve'}</span>
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
                      <span className="fw-bold">{event.status === 'rejected' ? 'Re-Reject' : 'Reject'}</span>
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

        {/* ✅ View Only Message for Admin/Employee */}
        {/* {!canChangeStatus && (
          <div className="alert alert-secondary">
            <div className="d-flex align-items-center">
              <KTIcon iconName="eye" className="fs-2 text-secondary me-3" />
              <div>
                <div className="fw-bold">View Only</div>
                <div>You are viewing this event in read-only mode. Only CEO can approve or reject events.</div>
              </div>
            </div>
          </div>
        )} */}
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

export { ViewDetailModal }