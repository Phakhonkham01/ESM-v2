import { FC, useState, useEffect } from 'react'
import { KTIcon } from '../../../../../../../_metronic/helpers'
import { 
  getEventById, 
  approveEvent, 
  rejectEvent, 
  updateParticipationStatus,
  getParticipationStatus
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
  const [userParticipation, setUserParticipation] = useState<any>(null)
  const [participationLoading, setParticipationLoading] = useState(false)
  const [showParticipationConfirm, setShowParticipationConfirm] = useState(false)
  const [selectedParticipationStatus, setSelectedParticipationStatus] = useState<'accepted' | 'declined' | null>(null)
  const { refetch } = useQueryResponse()

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true)
      try {
        const response = await getEventById(eventId)
        console.log('📋 Event response:', response)
        
        const eventData = response.data || response
        setEvent(eventData)
        
        // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นผู้เข้าร่วมในงานนี้หรือไม่
        if (currentUser?._id) {
          checkUserParticipation(eventData)
        }
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
  }, [eventId, currentUser])

  const checkUserParticipation = async (eventData: any) => {
    if (!eventData.person_in_charge) return
    
    // ตรวจสอบว่าผู้ใช้เป็น participant ในงานนี้หรือไม่
    const isParticipant = eventData.person_in_charge.some(
      (person: any) => {
        const userId = person.user_id?._id || person.user_id || person._id
        return userId === currentUser._id
      }
    )
    
    if (isParticipant) {
      fetchUserParticipationStatus(eventData._id)
    }
  }

  const fetchUserParticipationStatus = async (eventId: string) => {
    try {
      setParticipationLoading(true)
      const response = await getParticipationStatus(eventId, currentUser._id)
      console.log('📋 Participation status response:', response)
      setUserParticipation(response.data || response)
    } catch (error) {
      console.error('Error fetching participation status:', error)
      // ถ้าไม่พบข้อมูล participation แต่เป็นผู้เข้าร่วม ให้ตั้งค่าเป็น pending
      if (isCurrentUserParticipant()) {
        setUserParticipation({
          status: 'pending',
          responded_at: null,
          response_note: ''
        })
      }
    } finally {
      setParticipationLoading(false)
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
        comment: comment.trim() || ''
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

  // เปิด confirm dialog สำหรับ participation
  const openParticipationConfirm = (status: 'accepted' | 'declined') => {
    setSelectedParticipationStatus(status)
    setShowParticipationConfirm(true)
  }

  // ปิด confirm dialog
  const closeParticipationConfirm = () => {
    setShowParticipationConfirm(false)
    setSelectedParticipationStatus(null)
  }

  // ฟังก์ชันหลักสำหรับการอัปเดต participation status
  const handleParticipationStatus = async (status: 'accepted' | 'declined') => {
    if (!event?._id || !currentUser?._id) {
      toast.error('Missing required data')
      return
    }

    setParticipationLoading(true)
    try {
      console.log(`🔄 Updating participation to ${status}:`, {
        eventId: event._id,
        userId: currentUser._id
      })

      const response = await updateParticipationStatus(event._id, {
        user_id: currentUser._id,
        status: status,
        note: status === 'accepted' ? 'I will attend' : 'Unable to attend'
      })

      console.log('✅ Participation update response:', response)
      
      toast.success(`You have ${status === 'accepted' ? 'accepted' : 'declined'} the invitation`)
      
      // อัพเดทสถานะ local
      const updatedStatus = response.data || response
      setUserParticipation({
        ...updatedStatus,
        status: status,
        responded_at: new Date().toISOString()
      })
      
      // อัพเดทข้อมูล event
      const updatedEvent = await getEventById(event._id)
      setEvent(updatedEvent.data || updatedEvent)
      
      // รีเฟรชรายการ
      await refetch()
      
      // ✅ ปิด confirm dialog หลังเสร็จสิ้น
      closeParticipationConfirm()
      
    } catch (error: any) {
      console.error('❌ Error updating participation:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update participation'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setParticipationLoading(false)
    }
  }

  // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นผู้เข้าร่วมในงานนี้หรือไม่
  const isCurrentUserParticipant = () => {
    if (!event?.person_in_charge || !currentUser?._id) return false
    
    return event.person_in_charge.some(
      (person: any) => {
        const userId = person.user_id?._id || person.user_id || person._id
        return userId === currentUser._id
      }
    )
  }

  // ตรวจสอบว่า event ต้องการการตอบรับการเข้าร่วมหรือไม่
  const requiresParticipationResponse = () => {
    return event?.require_participation_response === true
  }

  // ตรวจสอบสถานะ participation ของผู้ใช้
  const getUserParticipationStatus = () => {
    if (!userParticipation) return 'pending'
    
    return userParticipation.status || 'pending'
  }

  // ✅ ฟังก์ชันตรวจสอบว่าแสดงปุ่ม Accept/Decline หรือไม่
  const shouldShowParticipationButtons = () => {
    if (!event || !currentUser) return false
    
    console.log('🔍 Checking participation buttons:', {
      isParticipant: isCurrentUserParticipant(),
      eventStatus: event.status,
      requiresResponse: requiresParticipationResponse(),
      currentUserRole: currentUser.role
    })
    
    // 1. ต้องเป็นผู้เข้าร่วม
    if (!isCurrentUserParticipant()) {
      console.log('❌ Not a participant')
      return false
    }
    
    // 2. Event ต้อง require participation response
    if (!requiresParticipationResponse()) {
      console.log('❌ Does not require participation response')
      return false
    }
    
    // 3. Event status ต้องเป็น 'approved' หรือ 'pending'
    const allowedStatuses = ['approved', 'pending']
    if (!allowedStatuses.includes(event.status?.toLowerCase())) {
      console.log(`❌ Event status not allowed: ${event.status}`)
      return false
    }
    
    console.log('✅ Should show participation buttons: TRUE')
    return true
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

  const getParticipationBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return (
          <span className="badge badge-light-success px-3 py-2">
            <KTIcon iconName="check-circle" className="fs-4 me-1" />
            <span className="fw-bold">Accepted</span>
          </span>
        )
      case 'declined':
        return (
          <span className="badge badge-light-danger px-3 py-2">
            <KTIcon iconName="cross-circle" className="fs-4 me-1" />
            <span className="fw-bold">Declined</span>
          </span>
        )
      case 'pending':
        return (
          <span className="badge badge-light-warning px-3 py-2">
            <KTIcon iconName="clock" className="fs-4 me-1" />
            <span className="fw-bold">Pending Response</span>
          </span>
        )
      default:
        return (
          <span className="badge badge-light-dark px-3 py-2">
            <KTIcon iconName="question" className="fs-4 me-1" />
            <span className="fw-bold">{status || 'Unknown'}</span>
          </span>
        )
    }
  }

  // ✅ แก้ไข: อนุญาตให้ทั้ง CEO และ Admin อนุมัติ/ปฏิเสธ event
  const isCEOOrAdmin = currentUser?.role === 'CEO' || currentUser?.role === 'Admin'
  const canChangeEventStatus = isCEOOrAdmin
  const isParticipant = isCurrentUserParticipant()
  const eventRequiresResponse = requiresParticipationResponse()
  const userParticipationStatus = getUserParticipationStatus()

  // ✅ ตรวจสอบเงื่อนไขการแสดงปุ่ม (สำหรับ debug)
  const showParticipationSection = shouldShowParticipationButtons()
  
  console.log('🔍 FINAL CHECK:', {
    showParticipationSection,
    isParticipant,
    eventStatus: event?.status,
    eventRequiresResponse,
    event: event
  })

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
            <div>
              {getStatusBadge(event.status)}
            </div>
            
            {/* Participation Status Badge สำหรับผู้เข้าร่วม */}
            {isParticipant && eventRequiresResponse && (
              <div className="ms-3">
                {getParticipationBadge(userParticipationStatus)}
              </div>
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
            <div className="row mb-6">
              <div className="col-md-4">
                <label className="fw-bold fs-6 text-gray-700 mb-2">Description</label>
              </div>
              <div className="col-md-8">
                <div className="fs-6 text-gray-700 bg-light rounded p-3">
                  {event.description || 'No description provided'}
                </div>
              </div>
            </div>

            {/* Participation Requirement */}
            <div className="row mb-6">
              <div className="col-md-4">
                <label className="fw-bold fs-6 text-gray-700 mb-2">Participation Response</label>
              </div>
              <div className="col-md-8">
                <div className="fs-6">
                  {event.require_participation_response ? (
                    <span className="badge badge-light-primary px-3 py-2">
                      <KTIcon iconName="check" className="fs-4 me-1" />
                      Required from participants
                    </span>
                  ) : (
                    <span className="badge badge-light-secondary px-3 py-2">
                      <KTIcon iconName="cross" className="fs-4 me-1" />
                      Not required
                    </span>
                  )}
                </div>
              </div>
            </div>
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

        {/* People Section */}
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

            {/* Participants */}
            {event.person_in_charge && event.person_in_charge.length > 0 && (
              <div className="row mb-6">
                <div className="col-md-4">
                  <label className="fw-bold fs-6 text-gray-700 mb-2">
                    Participants ({event.person_in_charge.length})
                  </label>
                </div>
                <div className="col-md-8">
                  <div className="d-flex flex-wrap gap-3">
                    {event.person_in_charge.map((person: any, index: number) => {
                      const userId = person.user_id?._id || person.user_id || person._id
                      const isCurrentUser = userId === currentUser?._id
                      const participationStatus = person.participation_status || 'pending'
                      
                      return (
                        <div 
                          key={person._id || person.id || index} 
                          className={`d-flex align-items-center p-3 rounded ${isCurrentUser ? 'bg-light-primary' : 'bg-light'}`}
                        >
                          <div className="symbol symbol-35px me-2">
                            <div className={`symbol-label ${isCurrentUser ? 'bg-primary' : 'bg-light-success'}`}>
                              <KTIcon 
                                iconName={isCurrentUser ? "user" : "user-tick"} 
                                className={`${isCurrentUser ? 'text-white' : 'text-success'} fs-2`} 
                              />
                            </div>
                          </div>
                          <div className="d-flex flex-column">
                            <div className="fw-semibold d-flex align-items-center">
                              {person.user_id?.user_name || person.user_name || 'Unknown'}
                              {isCurrentUser && (
                                <span className="badge badge-primary ms-2">You</span>
                              )}
                            </div>
                            {(person.user_id?.user_email || person.user_email) && (
                              <div className="text-muted fs-7">{person.user_id?.user_email || person.user_email}</div>
                            )}
                            {/* Participation Status Badge */}
                            {event.require_participation_response && (
                              <div className="mt-2">
                                {getParticipationBadge(participationStatus)}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Participation Action Section (สำหรับผู้เข้าร่วม) - แก้ไขเงื่อนไข */}
        {shouldShowParticipationButtons() && (
          <div className="card card-flush mb-7">
            <div className="card-header">
              <h3 className="card-title fw-bold">
                <KTIcon iconName="user-tick" className="fs-2 me-2 text-primary" />
                Your Invitation Response
                {event.status === 'pending' && (
                  <span className="badge badge-warning ms-2">Event Pending Approval</span>
                )}
              </h3>
            </div>
            <div className="card-body pt-4">
              {/* Current Status */}
              <div className="mb-6">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-bold fs-6 text-gray-700 mb-1">Current Response Status</div>
                    <div className="text-muted">
                      {userParticipationStatus === 'accepted' 
                        ? 'You have accepted this invitation'
                        : userParticipationStatus === 'declined'
                        ? 'You have declined this invitation'
                        : 'You have not responded to this invitation yet'}
                      {event.status === 'pending' && (
                        <div className="text-warning mt-1">
                          <KTIcon iconName="shield-tick" className="fs-3 me-1" />
                          Note: This event is still pending CEO/Admin approval
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {getParticipationBadge(userParticipationStatus)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-3">
                {!participationLoading ? (
                  <>
                    <button
                      type="button"
                      className={`btn flex-fill d-flex align-items-center justify-content-center ${userParticipationStatus === 'accepted' ? 'btn-success' : 'btn-light-success'}`}
                      onClick={() => openParticipationConfirm('accepted')}
                      disabled={userParticipationStatus === 'accepted'}
                    >
                      <KTIcon iconName="check" className="fs-2 me-2" />
                      <span className="fw-bold">
                        {userParticipationStatus === 'accepted' ? 'Already Accepted' : 'Accept Invitation'}
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      className={`btn flex-fill d-flex align-items-center justify-content-center ${userParticipationStatus === 'declined' ? 'btn-danger' : 'btn-light-danger'}`}
                      onClick={() => openParticipationConfirm('declined')}
                      disabled={userParticipationStatus === 'declined'}
                    >
                      <KTIcon iconName="cross" className="fs-2 me-2" />
                      <span className="fw-bold">
                        {userParticipationStatus === 'declined' ? 'Already Declined' : 'Decline Invitation'}
                      </span>
                    </button>
                  </>
                ) : (
                  <div className="w-100 text-center">
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Processing...
                  </div>
                )}
              </div>

              {/* Info Message */}
              {/* <div className="alert alert-info mt-5 mb-0">
                <div className="d-flex align-items-center">
                  <KTIcon iconName="information" className="fs-2 text-info me-3" />
                  <div>
                    <div className="fw-bold">Invitation Response</div>
                    <div>
                      Please respond to this invitation by accepting or declining. 
                      {event.status === 'pending' && (
                        <span className="text-warning fw-bold"> Your response will be recorded even though the event is pending approval.</span>
                      )}
                      You can change your response later if needed.
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        )}

        {/* ✅ CEO/Admin-Only Actions Section */}
        {canChangeEventStatus && (
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

              {/* Info Message */}
              <div className="alert alert-info mt-5 mb-0">
                <div className="d-flex align-items-center">
                  <KTIcon iconName="information" className="fs-2 text-info me-3" />
                  <div>
                    <div className="fw-bold">Admin/CEO Privilege</div>
                    <div>You can change this event's status at any time. All changes will be recorded.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ View Only Message สำหรับผู้ใช้ทั่วไปที่ไม่ใช่ Admin/CEO และไม่ใช่ผู้เข้าร่วม */}
        {/* {!canChangeEventStatus && !isParticipant && (
          <div className="alert alert-secondary">
            <div className="d-flex align-items-center">
              <KTIcon iconName="eye" className="fs-2 text-secondary me-3" />
              <div>
                <div className="fw-bold">View Only</div>
                <div>You are viewing this event in read-only mode. Only Admin or CEO can approve or reject events.</div>
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
          disabled={loading || participationLoading}
        >
          Close
        </button>
      </div>

      {/* ✅ Participation Confirmation Modal */}
      {showParticipationConfirm && selectedParticipationStatus && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title fw-bold">
                  {selectedParticipationStatus === 'accepted' ? (
                    <>
                      <KTIcon iconName="check-circle" className="fs-2 text-success me-2" />
                      Confirm Accept Invitation
                    </>
                  ) : (
                    <>
                      <KTIcon iconName="cross-circle" className="fs-2 text-danger me-2" />
                      Confirm Decline Invitation
                    </>
                  )}
                </h3>
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light btn-active-light-primary"
                  onClick={closeParticipationConfirm}
                  disabled={participationLoading}
                >
                  <KTIcon iconName="cross" className="fs-1" />
                </button>
              </div>
              <div className="modal-body">
                <div className="text-center py-4">
                  {selectedParticipationStatus === 'accepted' ? (
                    <>
                      <div className="symbol symbol-100px symbol-circle mb-5">
                        <div className="symbol-label bg-light-success">
                          <KTIcon iconName="check" className="fs-2x text-success" />
                        </div>
                      </div>
                      <h4 className="fw-bold text-gray-900 mb-3">Are you sure you want to accept this invitation?</h4>
                      <p className="text-muted mb-0">
                        You are confirming your attendance at <strong>{event.event_name}</strong>.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="symbol symbol-100px symbol-circle mb-5">
                        <div className="symbol-label bg-light-danger">
                          <KTIcon iconName="cross" className="fs-2x text-danger" />
                        </div>
                      </div>
                      <h4 className="fw-bold text-gray-900 mb-3">Are you sure you want to decline this invitation?</h4>
                      <p className="text-muted mb-0">
                        You are declining the invitation to <strong>{event.event_name}</strong>.
                      </p>
                    </>
                  )}
                  
                  {/* {event.status === 'pending' && (
                    <div className="alert alert-warning mt-4">
                      <KTIcon iconName="information" className="fs-2 text-warning me-2" />
                      <span className="fw-bold">Note:</span> This event is still pending approval. Your response will be recorded.
                    </div>
                  )} */}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={closeParticipationConfirm}
                  disabled={participationLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${selectedParticipationStatus === 'accepted' ? 'btn-success' : 'btn-danger'}`}
                  onClick={() => handleParticipationStatus(selectedParticipationStatus)}
                  disabled={participationLoading}
                >
                  {participationLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <KTIcon iconName={selectedParticipationStatus === 'accepted' ? 'check' : 'cross'} className="fs-2 me-2" />
                      {selectedParticipationStatus === 'accepted' ? 'Yes, Accept' : 'Yes, Decline'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { ViewDetailModal }