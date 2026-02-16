import { Column } from 'react-table'
import { FormattedDayOffRequest } from '../../core/_models'
import { UserCustomHeader } from './UserCustomHeader'
import { useListView } from '../../core/ListViewProvider'

const DayOffRequestActionsCell = ({ id, status }: { id: string; status: string }) => {
  const { setItemIdForUpdate, setItemIdForDetail, setItemIdForDelete } = useListView()

  const isEditable = status === 'Pending'

  return (
    <div>
      <div className="d-flex justify-content-end gap-2">
        {/* Actions Dropdown */}
        <div className="dropdown">
          <button
            className="btn btn-light btn-active-light-primary btn-sm dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Actions
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            {/* View - Always enabled */}
            <li>
              <button
                className="dropdown-item"
                onClick={() => setItemIdForDetail(id)}
              >
                <i className="bi bi-eye me-2"></i>
                View
              </button>
            </li>

            {/* Edit - Only enabled for Pending */}
            <li>
              <button
                className={`dropdown-item ${!isEditable ? 'disabled' : ''}`}
                onClick={() => isEditable && setItemIdForUpdate(id)}
                disabled={!isEditable}
              >
                <i className="bi bi-pencil me-2"></i>
                Edit
              </button>
            </li>

            {/* Delete - Only enabled for Pending */}
            <li>
              <button
                className={`dropdown-item ${!isEditable ? 'disabled' : ''}`}
                onClick={() => isEditable && setItemIdForDelete(id)}
                disabled={!isEditable}
              >
                <i className="bi bi-trash me-2"></i>
                Delete
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

const dayOffRequestsColumns: ReadonlyArray<Column<FormattedDayOffRequest>> = [
  {
    Header: () => <th className="min-w-50px text-center">No</th>,
    id: 'no',
    Cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },

  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Employee" className="min-w-150px" />
    ),
    accessor: 'title',
    Cell: ({ row }) => {
      const request = row.original
      return (
        <div className="d-flex flex-column">
          <span className="fw-semibold text-gray-800">{request.employee_name || 'N/A'}</span>
        </div>
      )
    },
  },

  // ✅ แก้ accessor จาก 'department_name' → 'employee_department'
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Department" className="min-w-150px" />
    ),
    id: 'department',
    accessor: 'employee_department',
    Cell: ({ value }) => {
      if (!value || value === 'N/A') {
        return (
          <div className="d-flex align-items-center p-2 bg-light-warning rounded">
            <i className="bi bi-building-x fs-5 text-warning me-2"></i>
            <span className="text-muted fw-bold">No department</span>
          </div>
        )
      }

      return (
        <div className="d-flex align-items-center p-2 bg-light-primary rounded">
          <i className="bi bi-building fs-5 text-primary me-2"></i>
          <span className="fw-bold text-gray-900">{value}</span>
        </div>
      )
    },
  },

  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Type" className="min-w-100px" />
    ),
    accessor: 'day_off_type',
    Cell: ({ value }) => (
      <span className={`badge ${value === 'FULL_DAY' ? 'badge-light-primary' : 'badge-light-info'} fw-bold`}>
        {value === 'FULL_DAY' ? 'Full Day' : 'Half Day'}
      </span>
    ),
  },
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Start Date" className="min-w-125px" />
    ),
    accessor: 'start_date_time',
    Cell: ({ value }) => {
      if (!value) return <span className="text-muted">N/A</span>
      const date = new Date(value)
      return (
        <div className="d-flex flex-column">
          <span className="fw-semibold text-gray-800">
            {date.toLocaleDateString('en-GB')}
          </span>
        </div>
      )
    },
  },
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="End Date" className="min-w-125px" />
    ),
    accessor: 'end_date_time',
    Cell: ({ value }) => {
      if (!value) return <span className="text-muted">N/A</span>
      const date = new Date(value)
      return (
        <div className="d-flex flex-column">
          <span className="fw-semibold text-gray-800">
            {date.toLocaleDateString('en-GB')}
          </span>
        </div>
      )
    },
  },
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Days" className="min-w-80px" />
    ),
    accessor: 'date_off_number',
    Cell: ({ value }) => (
      <div className="text-center">
        <span className="badge badge-light-primary fw-bold">
          {value || 0} {value === 1 ? 'day' : 'days'}
        </span>
      </div>
    ),
  },
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Status" className="min-w-100px" />
    ),
    accessor: 'status',
    Cell: ({ value }) => {
      let className = 'badge-light-secondary'
      let icon = 'bi-question-circle'
      if (value === 'Pending') {
        className = 'badge-light-warning'
        icon = 'bi-clock-history'
      }
      if (value === 'Accepted') {
        className = 'badge-light-success'
        icon = 'bi-check-circle'
      }
      if (value === 'Rejected') {
        className = 'badge-light-danger'
        icon = 'bi-x-circle'
      }
      return (
        <span className={`badge ${className} fw-bold`}>
          <i className={`bi ${icon} me-1`}></i>
          {value || 'Unknown'}
        </span>
      )
    },
  },
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Actions" className="text-end min-w-100px" />
    ),
    id: 'actions',
    Cell: ({ row }) => {
      const request = row.original
      const requestId = request._id || request.id
      const status = request.status

      if (!requestId) {
        console.warn('Day off request missing ID:', request)
        return <div className="text-muted">No ID</div>
      }

      return <DayOffRequestActionsCell id={requestId} status={status} />
    },
  },
]

export { dayOffRequestsColumns }