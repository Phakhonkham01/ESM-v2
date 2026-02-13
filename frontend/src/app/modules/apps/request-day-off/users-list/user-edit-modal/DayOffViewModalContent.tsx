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

  // ✅ Fetch single request using the new endpoint
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
      setItemIdForUpdate(undefined)
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
      setItemIdForUpdate(undefined)
    },
    onError: () => {
      Swal.fire('Error!', 'Failed to reject request', 'error')
    },
  })

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

  if (isFetching) {
    return (
      <div className="text-center py-10">
        <span className="spinner-border spinner-border-lg align-middle"></span>
        <p className="text-muted mt-3">Loading details...</p>
      </div>
    )
  }

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

  // 👇 LEAVE BALANCE & DEDUCTION COMPUTATIONS
  const employee = typeof dayOff.employee_id === 'object' ? dayOff.employee_id : null
  const currentLeaveBalance = employee?.actual_leave_days ?? 0
  const deduction = dayOff.date_off_number
  const remaining = currentLeaveBalance - deduction
  const willBeNegative = remaining < 0
  const paidHolidaysAmount = willBeNegative ? Math.abs(remaining) : 0

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
 <div className="mb-7">
        <h4 className="fw-bold mb-5">Leave Balance & Deduction</h4>
        <div className="row g-5 bg-light-info rounded p-4">
          <div className="col-md-4">
            <label className="fw-bold text-muted d-block mb-2">Current Balance</label>
            <div className="d-flex align-items-center">
              <KTIcon iconName="profile-user" className="fs-3 text-info me-2" />
              <span className="fw-bold fs-4">{currentLeaveBalance.toFixed(1)} days</span>
            </div>
          </div>
          <div className="col-md-4">
            <label className="fw-bold text-muted d-block mb-2">Requested Days</label>
            <div className="d-flex align-items-center">
              <KTIcon iconName="arrow-down" className="fs-3 text-danger me-2" />
              <span className="fw-bold fs-4">- {deduction.toFixed(1)} days</span>
            </div>
          </div>
          <div className="col-md-4">
            <label className="fw-bold text-muted d-block mb-2">New Balance (if approved)</label>
            <div className="d-flex align-items-center">
              <KTIcon iconName="profile-user" className="fs-3 text-primary me-2" />
              <span className={`fw-bold fs-4 ${willBeNegative ? 'text-danger' : 'text-success'}`}>
                {remaining >= 0 ? remaining.toFixed(1) : '0.0'} days
              </span>
            </div>
          </div>
          {willBeNegative && (
            <div className="col-12 mt-3">
              <div className="alert alert-warning d-flex align-items-center p-3 mb-0">
                <KTIcon iconName="information-5" className="fs-2x me-3 text-warning" />
                <div>
                  <strong>Insufficient leave days.</strong><br />
                  {paidHolidaysAmount.toFixed(1)} day(s) will be recorded as{' '}
                  <strong>Paid Holidays</strong>.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== REASON ========== */}
      <div className="mb-7">
        <label className="fw-bold text-muted d-block mb-3">Reason</label>
        <div className="bg-light rounded p-4">
          <p className="mb-0 text-gray-800">{dayOff.title}</p>
        </div>
      </div>

      <div className="separator separator-dashed my-7"></div>

      {/* ========== ACTION BUTTONS ========== */}
      <div className="d-flex justify-content-end gap-3">
        <button
          type="button"
          className="btn btn-light"
          onClick={() => setItemIdForUpdate(undefined)}
          disabled={isLoading}
        >
          Close
        </button>
        {isPending && (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}

export { DayOffViewModalContent }