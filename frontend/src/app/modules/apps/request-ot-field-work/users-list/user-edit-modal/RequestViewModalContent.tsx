import { FC, useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import Swal from 'sweetalert2'
import { KTIcon, QUERIES } from '../../../../../../_metronic/helpers'
import { useListView } from '../../users-list/core/ListViewProvider'
import {  useQueryResponseData } from '../core/QueryResponseProvider'
import { updateRequestStatus } from '../core/_requests'
import { formatDate, formatHour, calculateDuration, getEmployeeName, getEmployeeEmail, getEmployeeId } from '../core/_models'

const RequestViewModalContent: FC = () => {
  const { itemIdForUpdate, setItemIdForUpdate } = useListView()
  
  const queryClient = useQueryClient()
  const requests = useQueryResponseData()
  const [isLoading, setIsLoading] = useState(false)

  const request = requests.find((r) => (r._id || r.id) === itemIdForUpdate)

  const updateMutation = useMutation(
    (status: 'Accepted' | 'Rejected') => updateRequestStatus(itemIdForUpdate!, status),
    {
      onSuccess: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Request updated successfully',
          timer: 2000,
          showConfirmButton: false,
        })
        queryClient.invalidateQueries(`${QUERIES.USERS_LIST}-supervisor-requests`)
        setItemIdForUpdate(undefined)
      },
      onError: () => {
        Swal.fire('Error!', 'Failed to update request', 'error')
      },
    }
  )

  const handleAction = async (action: 'Accepted' | 'Rejected') => {
    const result = await Swal.fire({
      title: `${action} Request?`,
      text: `Are you sure you want to ${action.toLowerCase()} this request?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: action === 'Accepted' ? '#10B981' : '#EF4444',
      confirmButtonText: `Yes, ${action}`,
    })

    if (result.isConfirmed) {
      setIsLoading(true)
      updateMutation.mutate(action)
      setIsLoading(false)
    }
  }

  if (!request) {
    return (
      <div className="text-center py-10">
        <KTIcon iconName="cross-circle" className="fs-3x text-danger mb-3" />
        <p className="text-danger">Request not found</p>
      </div>
    )
  }

  const isPending = request.status === 'Pending'
  const employeeName = getEmployeeName(request)
  const employeeEmail = getEmployeeEmail(request)
  const employeeId = getEmployeeId(request)

  return (
    <div>
      {/* Request Information */}
      <div className="mb-7">
        <h4 className="fw-bold mb-5">Request Information</h4>
        <div className="row g-5">
          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Employee</label>
            <div className="d-flex align-items-center">
              <div className="symbol symbol-35px me-3">
                <div className="symbol-label bg-light-primary">
                  <KTIcon iconName="profile-user" className="fs-3 text-primary" />
                </div>
              </div>
              <div>
                <div className="fw-bold fs-6">{employeeName}</div>
                <div className="text-muted fs-7">{employeeEmail}</div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Employee ID</label>
            <div className="fw-semibold">{employeeId || 'N/A'}</div>
          </div>

          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Type</label>
            <div>
              <span className={`badge ${request.title === 'OT' ? 'badge-light-primary' : 'badge-light-info'} fs-7`}>
                {request.title === 'OT' ? 'Overtime' : 'Field Work'}
              </span>
            </div>
          </div>

          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Status</label>
            <div>
              <span className={`badge ${request.status === 'Pending' ? 'badge-light-warning' : request.status === 'Accept' ? 'badge-light-success' : 'badge-light-danger'} fs-7`}>
                {request.status}
              </span>
            </div>
          </div>

          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Date</label>
            <div className="d-flex align-items-center">
              <KTIcon iconName="calendar" className="fs-3 text-primary me-2" />
              <span className="fw-semibold">{formatDate(request.date)}</span>
            </div>
          </div>

          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Time</label>
            <div className="d-flex align-items-center">
              <KTIcon iconName="time" className="fs-3 text-primary me-2" />
              <span className="fw-semibold">
                {formatHour(request.start_hour)} - {formatHour(request.end_hour)}
              </span>
            </div>
          </div>

          <div className="col-md-6">
            <label className="fw-bold text-muted d-block mb-2">Duration</label>
            <div className="d-flex align-items-center">
              <KTIcon iconName="time" className="fs-3 text-info me-2" />
              <span className="fw-semibold">{calculateDuration(request.start_hour, request.end_hour)}</span>
            </div>
          </div>

          {request.fuel && request.fuel > 0 && (
            <div className="col-md-6">
              <label className="fw-bold text-muted d-block mb-2">Fuel Allowance</label>
              <div className="fw-semibold text-success">{request.fuel.toLocaleString()} ₭</div>
            </div>
          )}
        </div>
      </div>

      {/* Reason */}
      <div className="mb-7">
        <label className="fw-bold text-muted d-block mb-3">Reason</label>
        <div className="bg-light rounded p-4">
          <p className="mb-0 text-gray-800">{request.reason}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="separator separator-dashed my-7"></div>
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
              onClick={() => handleAction('Accepted')}
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
              onClick={() => handleAction('Rejected')}
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

export { RequestViewModalContent }