import { useState } from 'react'
import { SatSunRequest, getSatSunStatusBadgeClass } from '../../core/_models'
import { KTIcon } from '../../../../../../../_metronic/helpers'

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────
interface Props {
  request: SatSunRequest
}

// ─────────────────────────────────────────────────────────────
// View Modal
// ─────────────────────────────────────────────────────────────
const SatSunViewModal = ({
  request,
  onClose,
}: {
  request: SatSunRequest
  onClose: () => void
}) => {
  const emp = request.employee_id
  const empObj = emp && typeof emp !== 'string' ? emp : null

  const deptName =
    empObj?.department_id &&
    typeof empObj.department_id === 'object' &&
    !Array.isArray(empObj.department_id)
      ? (empObj.department_id as any).department_name
      : 'N/A'

  const posName =
    empObj?.position_id &&
    typeof empObj.position_id === 'object' &&
    !Array.isArray(empObj.position_id)
      ? (empObj.position_id as any).position_name
      : 'N/A'

  const fmt = (d: string | Date) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const fmtTime = (d: string | Date) =>
    new Date(d).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok',
    })

  const isSat = request.day_choice === 'Saturday'

  return (
    <>
      {/* Backdrop */}
      <div
        className='modal-backdrop fade show'
        style={{ zIndex: 1040 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className='modal fade show d-block'
        tabIndex={-1}
        style={{ zIndex: 1050 }}
        role='dialog'
      >
        <div className='modal-dialog modal-dialog-centered modal-lg'>
          <div className='modal-content shadow-lg'>
            {/* Header */}
            <div className='modal-header bg-light-primary border-0 pb-0'>
              <div className='d-flex align-items-center gap-3'>
                <div className='symbol symbol-45px'>
                  <div className='symbol-label bg-primary'>
                    <KTIcon iconName='calendar' className='fs-2 text-white' />
                  </div>
                </div>
                <div>
                  <h4 className='modal-title fw-bolder text-gray-900 mb-0'>
                    Saturday / Sunday Request
                  </h4>
                  <span className='text-muted fs-7'>Request Detail</span>
                </div>
              </div>
              <button
                type='button'
                className='btn btn-sm btn-icon btn-active-light-primary ms-2'
                onClick={onClose}
              >
                <KTIcon iconName='cross' className='fs-4' />
              </button>
            </div>

            {/* Body */}
            <div className='modal-body pt-4 pb-6 px-7'>
              {/* Employee Card */}
              {empObj && (
                <div className='card card-bordered bg-light-secondary mb-5'>
                  <div className='card-body py-4 px-5'>
                    <div className='d-flex align-items-center gap-3'>
                      <div className='symbol symbol-50px'>
                        <div className='symbol-label bg-primary'>
                          <KTIcon iconName='profile-user' className='fs-2 text-white' />
                        </div>
                      </div>
                      <div>
                        <div className='fw-bolder text-gray-900 fs-5'>
                          {empObj.first_name_en} {empObj.last_name_en}
                          {empObj.nickname_en && (
                            <span className='text-muted fs-6 ms-2 fw-normal'>
                              ({empObj.nickname_en})
                            </span>
                          )}
                        </div>
                        <div className='text-muted fs-7'>{empObj.user_email}</div>
                        <div className='d-flex gap-2 mt-1'>
                          <span className='badge badge-light-primary fw-semibold'>
                            {deptName}
                          </span>
                          <span className='badge badge-light-info fw-semibold'>
                            {posName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div className='row g-4'>
                {/* Day Choice */}
                <div className='col-6 col-md-3'>
                  <label className='text-muted fs-7 fw-semibold text-uppercase d-block mb-1'>
                    Day
                  </label>
                  <span
                    className={`badge fs-7 fw-bold ${
                      isSat ? 'badge-light-info' : 'badge-light-primary'
                    }`}
                  >
                    {request.day_choice}
                  </span>
                </div>

                {/* Day Off Type */}
                <div className='col-6 col-md-3'>
                  <label className='text-muted fs-7 fw-semibold text-uppercase d-block mb-1'>
                    Type
                  </label>
                  <span
                    className={`badge fs-7 fw-bold ${
                      request.day_off_type === 'Full day'
                        ? 'badge-light-success'
                        : 'badge-light-warning'
                    }`}
                  >
                    {request.day_off_type}
                  </span>
                </div>

                {/* Days Count */}
                <div className='col-6 col-md-3'>
                  <label className='text-muted fs-7 fw-semibold text-uppercase d-block mb-1'>
                    Days
                  </label>
                  <span className='fw-bolder text-gray-800 fs-5'>
                    {request.date_off_number}
                    <span className='text-muted fs-7 ms-1'>
                      day{request.date_off_number > 1 ? 's' : ''}
                    </span>
                  </span>
                </div>

                {/* Status */}
                <div className='col-6 col-md-3'>
                  <label className='text-muted fs-7 fw-semibold text-uppercase d-block mb-1'>
                    Status
                  </label>
                  <span
                    className={`badge fs-7 fw-bold ${getSatSunStatusBadgeClass(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                </div>

                {/* Date Range */}
                <div className='col-12 col-md-6'>
                  <label className='text-muted fs-7 fw-semibold text-uppercase d-block mb-1'>
                    {request.day_off_type === 'Half day' ? 'Date & Time' : 'Date Range'}
                  </label>
                  {request.day_off_type === 'Half day' ? (
                    <div>
                      <div className='fw-bold text-gray-800'>{fmt(request.start_date_time)}</div>
                      <div className='text-muted fs-7'>
                        {fmtTime(request.start_date_time)} – {fmtTime(request.end_date_time)}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className='fw-bold text-gray-800'>
                        {fmt(request.start_date_time)}
                      </div>
                      {fmt(request.start_date_time) !== fmt(request.end_date_time) && (
                        <div className='text-muted fs-7'>to {fmt(request.end_date_time)}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Created At */}
                <div className='col-12 col-md-6'>
                  <label className='text-muted fs-7 fw-semibold text-uppercase d-block mb-1'>
                    Created
                  </label>
                  <span className='text-gray-600 fs-7'>
                    {request.created_at
                      ? new Date(request.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'Asia/Bangkok',
                        })
                      : '-'}
                  </span>
                </div>

                {/* Description */}
                {request.description && (
                  <div className='col-12'>
                    <label className='text-muted fs-7 fw-semibold text-uppercase d-block mb-1'>
                      Description
                    </label>
                    <div className='bg-light-secondary rounded p-3 text-gray-700 fs-6'>
                      {request.description}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className='modal-footer border-0 pt-0'>
              <button
                type='button'
                className='btn btn-light btn-sm'
                onClick={onClose}
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

// ─────────────────────────────────────────────────────────────
// Actions Cell — exported for use in _columns.tsx
// ─────────────────────────────────────────────────────────────
const SatSunActionsCell = ({ request }: Props) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className='d-flex justify-content-end'>
        <button
          className='btn btn-sm btn-light btn-active-light-primary satsun-view-btn'
          onClick={() => setShowModal(true)}
        >
          <i className='bi bi-eye me-1' />
          View
        </button>
      </div>

      {/* Scoped style — same pattern as DayOffRequestActionsCell */}
      <style>{`
        .satsun-view-btn,
        .satsun-view-btn i {
          color: #198754 !important;
        }
        .satsun-view-btn:hover,
        .satsun-view-btn:hover i {
          color: #ffffff !important;
          background-color: #198754 !important;
        }
      `}</style>

      {showModal && (
        <SatSunViewModal request={request} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

export { SatSunActionsCell }