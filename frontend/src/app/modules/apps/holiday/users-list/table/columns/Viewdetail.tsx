import { FC, useState, useEffect } from 'react'
import { KTIcon } from '../../../../../../../_metronic/helpers'
import { getHolidayByIds } from '../../core/_requests'
import { toast } from 'react-toastify'
import { useQueryResponse } from '../../core/QueryResponseProvider'

type Props = {
  holidayId: string
  onClose: () => void
  currentUser: any
}

const ViewDetailModal: FC<Props> = ({ holidayId, onClose, currentUser }) => {
  const [holiday, setHoliday] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { refetch } = useQueryResponse()

  useEffect(() => {
    const fetchHoliday = async () => {
      setLoading(true)
      try {
        const response = await getHolidayByIds(holidayId)
        console.log('📋 Holiday response:', response)

        const holidayData = response
        setHoliday(holidayData)

        console.log('📋 Holiday data:', holidayData)
        console.log('📋 Holiday status:', holidayData.status)
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

  // const handleApprove = async () => {
  //   if (!holiday?._id || !currentUser?._id) return

  //   setLoading(true)
  //   try {
  //     await approveHoliday(holiday._id, {
  //       approved_by: currentUser._id,
  //       comment: comment || 'Approved'
  //     })
  //     toast.success('✅ Holiday approved successfully!')
  //     refetch()
  //     onClose()
  //   } catch (error: any) {
  //     console.error('Error approving holiday:', error)
  //     toast.error(error.response?.data?.message || 'Failed to approve holiday')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // const handleReject = async () => {
  //   if (!holiday?._id || !currentUser?._id) return

  //   if (!comment.trim()) {
  //     toast.error('Please provide a reason for rejection')
  //     return
  //   }

  //   setLoading(true)
  //   try {
  //     await rejectHoliday(holiday._id, {
  //       approved_by: currentUser._id,
  //       comment: comment
  //     })
  //     toast.success('Holiday rejected')
  //     refetch()
  //     onClose()
  //   } catch (error: any) {
  //     console.error('Error rejecting holiday:', error)
  //     toast.error(error.response?.data?.message || 'Failed to reject event')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const formatDateTime = (date: string | Date) => {
    try {
      return new Date(date).toLocaleString('en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">Approved</span>
      case 'rejected':
        return <span className="badge badge-danger">Rejected</span>
      case 'pending':
        return <span className="badge badge-warning">Pending</span>
      default:
        return <span className="badge badge-secondary">{status}</span>
    }
  }

  const isCEO = currentUser?.role === 'CEO'
  const isAdmin = currentUser?.role === 'admin'
  const isEmployee = currentUser?.role === 'employee'
  // ✅ CEO สามารถเปลี่ยน status ได้เสมอ
  const canChangeStatus = isCEO

  console.log('👤 Current User:', currentUser)
  console.log('🎭 Is CEO?', isCEO)
  console.log('🎭 Is admin?', isAdmin)
  console.log('👔 Is Employee?', isEmployee)
  console.log('📋 Holiday Status:', holiday?.status)
  console.log('✅ Can Change Status?', canChangeStatus)

  if (loading && !holiday) {
    return (
      <div className="modal-content">
        <div className="modal-body">
          <div className="text-center p-10">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading holiday details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!holiday) {
    return (
      <div className="modal-content">
        <div className="modal-body">
          <div className="alert alert-danger">
            Holiday not found
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-content">
      {/* Header */}
      <div className="modal-header">
        <h2 className="fw-bolder">Holiday Details</h2>
        <div
          className="btn btn-icon btn-sm btn-active-icon-primary"
          onClick={onClose}
          style={{ cursor: 'pointer' }}
        >
          <KTIcon iconName="cross" className="fs-1" />
        </div>
      </div>

      {/* Body */}
      <div className="modal-body scroll-y mx-5 mx-xl-15 my-7">
        {/* Debug Info */}
        <div className="mb-7 p-4 bg-light rounded border">
          <h5 className="mb-3">🔍 Debug Information</h5>
          <div className="row g-3">
            <div className="col-6">
              <strong>User Role:</strong> <span className="badge badge-primary">{currentUser?.role || 'N/A'}</span>
            </div>
            <div className="col-6">
              <strong>Is CEO:</strong> <span className={`badge ${isCEO ? 'badge-success' : 'badge-secondary'}`}>{isCEO ? 'Yes' : 'No'}</span>
            </div>
            <div className="col-6">
              <strong>Is Admin:</strong> <span className={`badge ${isAdmin ? 'badge-success' : 'badge-secondary'}`}>{isAdmin ? 'Yes' : 'No'}</span>
            </div>
            <div className="col-6">
              <strong>Is Employee:</strong> <span className={`badge ${isEmployee ? 'badge-info' : 'badge-secondary'}`}>{isEmployee ? 'Yes' : 'No'}</span>
            </div>
            <div className="col-6">
              <strong>Holiday Status:</strong> {getStatusBadge(holiday?.status)}
            </div>
            <div className="col-12">
              <strong>Can Change Status:</strong> <span className={`badge ${canChangeStatus ? 'badge-success' : 'badge-danger'}`}>{canChangeStatus ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mb-7">
          <label className="fw-bold fs-6 mb-2">Status</label>
          <div>{getStatusBadge(holiday.status)}</div>
        </div>

        {/* Holiday Name */}
        <div className="mb-7">
          <label className="fw-bold fs-6 mb-2">Holiday Name</label>
          <div className="fs-5">{holiday.holiday_name}</div>
        </div>

        {/* Holiday Type */}
        <div className="mb-7">
          <label className="fw-bold fs-6 mb-2">Holiday Type</label>
          <div className="fs-6">
            <span className="badge badge-light-primary">
              {holiday.holiday_type}
            </span>
          </div>
        </div>

        {/* Created By */}
        <div className="mb-7">
          <label className="fw-bold fs-6 mb-2">Created By</label>
          <div className="fs-6">
            {holiday.user_id?.user_name} {holiday.user_id?.department_id?.department_name}
            {holiday.user_id?.user_email && (
              <span className="text-muted ms-2">{holiday.user_id.user_email}</span>
            )}
          </div>
        </div>

        {/* Participants */}
        {/* {event.person_in_charge && event.person_in_charge.length > 0 && (
          <div className="mb-7">
            <label className="fw-bold fs-6 mb-2">Participants</label>
            <div className="d-flex flex-wrap gap-2">
              {event.person_in_charge.map((person: any) => (
                <span
                  key={person._id || person.id}
                  className="badge badge-light-info p-2"
                >
                  {person.user_name || 'Unknown'}
                </span>
              ))}
            </div>
          </div>
        )} */}

        {/* Start Date */}
        <div className="mb-7">
          <label className="fw-bold fs-6 mb-2">Start Date</label>
          <div className="fs-6">
            <KTIcon iconName="calendar" className="fs-3 me-2" />
            {formatDateTime(holiday.start_date)}
          </div>
        </div>

        {/* End Date */}
        <div className="mb-7">
          <label className="fw-bold fs-6 mb-2">End Date</label>
          <div className="fs-6">
            <KTIcon iconName="calendar" className="fs-3 me-2" />
            {formatDateTime(holiday.end_date)}
          </div>
        </div>

        {/* Total Days */}
        <div className="mb-7">
          <label className="fw-bold fs-6 mb-2">Total Days</label>
          <div className="fs-6">
            <KTIcon iconName="calendar" className="fs-3 me-2" />
            {holiday.total_days} Days
          </div>
        </div>

        {/* Description */}
        {/* {event.description && (
          <div className="mb-7">
            <label className="fw-bold fs-6 mb-2">Description</label>
            <div className="fs-6 text-gray-700">{event.description}</div>
          </div>
        )} */}

        {/* Approved/Rejected By */}
        {holiday.approvedBy && (
          <div className="mb-7">
            <label className="fw-bold fs-6 mb-2">
              {holiday.status === 'approved' ? 'Approved By' : 'Rejected By'}
            </label>
            <div className="fs-6">
              {holiday.user_id?.user_name} {holiday.user_id?.department_id?.department_name}
              {holiday.user_id?.user_email && (
                <span className="text-muted ms-2">{holiday.user_id.user_email}</span>
              )}
            </div>
          </div>
        )}

        {/* Comment */}
        <div className="mb-7">
          <label className="fw-bold fs-6 mb-2">Comment</label>
          <div className="fw-bold fs-6 mb-2">{holiday.comment}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-light"
          onClick={onClose}
          disabled={loading}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export { ViewDetailModal }