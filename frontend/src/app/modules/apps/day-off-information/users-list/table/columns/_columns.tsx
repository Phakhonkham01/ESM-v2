import { Column } from 'react-table'
import { FormattedDayOffRequest } from '../../core/_models'
import { UserCustomHeader } from './UserCustomHeader'
import { useListView } from '../../core/ListViewProvider'

const DayOffRequestActionsCell = ({ id }: { id: string }) => {
  const { setItemIdForUpdate } = useListView()

  return (
    <div className="d-flex justify-content-end ">
      <button
        className="btn btn-sm btn-light btn-active-primary view-btn-custom"
        onClick={() => setItemIdForUpdate(id)}
      >
        <i className="bi bi-eye me-2"></i>
        <span>View</span>
      </button>
      
      <button
        className="btn btn-sm btn-light btn-active-primary view-btn-custom"
        onClick={() => setItemIdForUpdate(id)}
      >
        <i className="bi bi-eye me-2"></i>
        <span>Edit</span>
      </button>
      <style>{`
        .view-btn-custom i,
        .view-btn-custom span {
          color: #198754 !important;
        }
        .view-btn-custom:hover i,
        .view-btn-custom:hover span {
          color: #ffffff !important;
        }
      `}</style>
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
      const request = row.original;
      return (
        <div className="d-flex flex-column">
          <span className="fw-semibold text-gray-800">{request.employee_name || 'N/A'}</span>
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
          <span className="text-muted fs-7">
            {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
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
          <span className="text-muted fs-7">
            {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
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
      const requestId = request._id || request._id

      return <DayOffRequestActionsCell id={requestId} />
    },
  },
]

export { dayOffRequestsColumns }