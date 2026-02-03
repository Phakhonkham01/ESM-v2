import { FC, useState } from 'react'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import Swal from 'sweetalert2'
import { KTIcon, QUERIES } from '../../../../../../_metronic/helpers'
import { useListView } from '../core/ListViewProvider'
import { useQueryResponse } from '../core/QueryResponseProvider'
import { getDayOffById, approveDayOff, rejectDayOff } from '../core/_requests'
import { getEmployeeDisplayName, getSupervisorName, formatDate } from '../core/_models'

const DayOffViewModalContent: FC = () => {
  const { itemIdForUpdate, setItemIdForUpdate } = useListView()
  const { query } = useQueryResponse()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  // ✅ Fetch data by ID
  const {
    data: dayOff,
    isLoading: isFetching,
    error,
  } = useQuery(
    ['dayoff-detail', itemIdForUpdate],
    () => getDayOffById(itemIdForUpdate!),
    {
      enabled: !!itemIdForUpdate,
    }
  )

  // ✅ Approve Mutation
  const approveMutation = useMutation(() => approveDayOff(itemIdForUpdate!), {
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: 'Approved!',
        text: 'Day off request has been approved.',
        timer: 2000,
        showConfirmButton: false,
      })
      queryClient.invalidateQueries(`${QUERIES.USERS_LIST}-dayoff-${query}`)
      setItemIdForUpdate(undefined) // ✅ ปิด Modal
    },
    onError: () => {
      Swal.fire('Error!', 'Failed to approve request', 'error')
    },
  })

  // ✅ Reject Mutation
  const rejectMutation = useMutation(() => rejectDayOff(itemIdForUpdate!), {
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: 'Rejected!',
        text: 'Day off request has been rejected.',
        timer: 2000,
        showConfirmButton: false,
      })
      queryClient.invalidateQueries(`${QUERIES.USERS_LIST}-dayoff-${query}`)
      setItemIdForUpdate(undefined) // ✅ ปิด Modal
    },
    onError: () => {
      Swal.fire('Error!', 'Failed to reject request', 'error')
    },
  })

  // ✅ Handle Approve
  const handleApprove = async () => {
    const result = await Swal.fire({
      title: 'Approve Leave Request?',
      text: 'Are you sure you want to approve this request?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel',
    })

    if (result.isConfirmed) {
      setIsLoading(true)
      approveMutation.mutate()
      setIsLoading(false)
    }
  }

  // ✅ Handle Reject
  const handleReject = async () => {
    const result = await Swal.fire({
      title: 'Reject Leave Request?',
      text: 'Are you sure you want to reject this request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel',
    })

    if (result.isConfirmed) {
      setIsLoading(true)
      rejectMutation.mutate()
      setIsLoading(false)
    }
  }

  // ✅ Loading State
  if (isFetching) {
    return (
      <div className="text-center py-10">
        <span className="spinner-border spinner-border-lg align-middle"></span>
        <p className="text-muted mt-3">Loading details...</p>
      </div>
    )
  }

  // ✅ Error State
  if (error || !dayOff) {
    return (
      <div className="text-center py-10">
        <KTIcon iconName="cross-circle" className="fs-3x text-danger mb-3" />
        <p className="text-danger">Failed to load request details</p>
      </div>
    )
  }

  const isPending = dayOff.status === 'Pending'
  const employeeName = getEmployeeDisplayName(dayOff)
  const supervisorName = getSupervisorName(dayOff.supervisor_id)

  return (
    <div>
      {/* Request Information */}
      <div className="mb-7">
        <h4 className="fw-bold mb-5">Request Information</h4>
        
        <div className="row g-5">
          {/* Employee Name */}
          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Employee</label>
            <div className="d-flex align-items-center">
              <div className="symbol symbol-35px me-3">
                <div className="symbol-label bg-light-primary">
                  <KTIcon iconName="profile-user" className="fs-3 text-primary" />
                </div>
              </div>
              <div className="fw-bold fs-6">{employeeName}</div>
            </div>
          </div>

          {/* Supervisor Name */}
          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Supervisor</label>
            <div className="d-flex align-items-center">
              <div className="symbol symbol-35px me-3">
                <div className="symbol-label bg-light-info">
                  <KTIcon iconName="profile-user" className="fs-3 text-info" />
                </div>
              </div>
              <div className="fw-bold fs-6">{supervisorName}</div>
            </div>
          </div>

          {/* Type */}
          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Type</label>
            <div>
              <span
                className={`badge ${
                  dayOff.day_off_type === 'HALF_DAY'
                    ? 'badge-light-info'
                    : 'badge-light-primary'
                } fs-7`}
              >
                {dayOff.day_off_type === 'HALF_DAY' ? 'Half Day' : 'Full Day'}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Status</label>
            <div>
              <span
                className={`badge ${
                  dayOff.status === 'Pending'
                    ? 'badge-light-warning'
                    : dayOff.status === 'Accepted'
                    ? 'badge-light-success'
                    : 'badge-light-danger'
                } fs-7`}
              >
                {dayOff.status}
              </span>
            </div>
          </div>

          {/* Start Date */}
          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Start Date</label>
            <div className="d-flex align-items-center">
              <KTIcon iconName="calendar" className="fs-3 text-primary me-2" />
              <span className="fw-semibold">{formatDate(dayOff.start_date_time)}</span>
            </div>
          </div>

          {/* End Date */}
          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">End Date</label>
            <div className="d-flex align-items-center">
              <KTIcon iconName="calendar" className="fs-3 text-primary me-2" />
              <span className="fw-semibold">{formatDate(dayOff.end_date_time)}</span>
            </div>
          </div>

          {/* Duration */}
          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Duration</label>
            <div className="d-flex align-items-center">
              <KTIcon iconName="time" className="fs-3 text-info me-2" />
              <span className="fw-semibold">
                {dayOff.date_off_number === 0.5 ? '0.5' : dayOff.date_off_number} day(s)
              </span>
            </div>
          </div>

          {/* Created At */}
          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Created At</label>
            <div className="d-flex align-items-center">
              <KTIcon iconName="time" className="fs-3 text-muted me-2" />
              <span className="text-muted">
                {formatDate(dayOff.created_at || dayOff.createdAt || '')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="mb-7">
        <label className="fw-bold text-muted d-block mb-3">Reason</label>
        <div className="bg-light rounded p-4">
          <p className="mb-0 text-gray-800">{dayOff.title}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="separator separator-dashed my-7"></div>
      
      <div className="d-flex justify-content-end gap-3">
        {/* Close Button */}
        <button
          type="button"
          className="btn btn-light"
          onClick={() => setItemIdForUpdate(undefined)}
          disabled={isLoading}
        >
          Close
        </button>

        {/* Approve Button - แสดงเฉพาะ Pending */}
        {isPending && (
          <button
            type="button"
            className="btn btn-success"
            onClick={handleApprove}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Processing...
              </>
            ) : (
              <>
                <KTIcon iconName="check" className="fs-3" />
                Approve
              </>
            )}
          </button>
        )}

        {/* Reject Button - แสดงเฉพาะ Pending */}
        {isPending && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleReject}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Processing...
              </>
            ) : (
              <>
                <KTIcon iconName="cross" className="fs-3" />
                Reject
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export { DayOffViewModalContent }