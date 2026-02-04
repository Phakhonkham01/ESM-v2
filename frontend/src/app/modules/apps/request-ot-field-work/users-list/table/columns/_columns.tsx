import { Column } from 'react-table'
import { RequestData, formatDate, formatHour, calculateDuration, getEmployeeName } from '../../core/_models'
import { RequestCustomHeader } from './RequestCustomHeader'
import { RequestActionsCell } from './RequestActionsCell'

const supervisorRequestsColumns: ReadonlyArray<Column<RequestData>> = [
  // NO
  {
    Header: () => <span>No</span>,
    id: 'no',
    Cell: ({ row }) => <span>{row.index + 1}</span>,
  },

  // EMPLOYEE
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Employee" className="min-w-150px" />
    ),
    id: 'employee',
    Cell: ({ row }) => {
      const name = getEmployeeName(row.original)
      const email = typeof row.original.user_id === 'object' ? row.original.user_id.email : ''
      return (
        <div className="d-flex flex-column">
          <span className="fw-bold text-gray-800">{name}</span>
          {email && <span className="text-muted fs-7">{email}</span>}
        </div>
      )
    },
  },

  // TYPE
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Type" className="min-w-100px" />
    ),
    accessor: 'title',
    Cell: ({ value }) => (
      <div className={`badge badge-light-${value === 'OT' ? 'primary' : 'info'}`}>
        {value === 'OT' ? 'Overtime' : 'Field Work'}
      </div>
    ),
  },

  // DATE
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Date" className="min-w-100px" />
    ),
    accessor: 'date',
    Cell: ({ value }) => <span className="text-gray-800">{formatDate(value)}</span>,
  },

  // TIME
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Time" className="min-w-120px" />
    ),
    id: 'time',
    Cell: ({ row }) => (
      <div className="d-flex flex-column">
        <span className="fw-bold text-gray-800">{formatHour(row.original.start_hour)}</span>
        <span className="text-muted fs-7">to {formatHour(row.original.end_hour)}</span>
      </div>
    ),
  },

  // DURATION
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Duration" className="min-w-100px" />
    ),
    id: 'duration',
    Cell: ({ row }) => (
      <span className="text-gray-800">
        {calculateDuration(row.original.start_hour, row.original.end_hour)}
      </span>
    ),
  },

  // REASON
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Reason" className="min-w-200px" />
    ),
    accessor: 'reason',
    Cell: ({ value }) => (
      <div title={value}>
        {value.length > 50 ? `${value.substring(0, 50)}...` : value}
      </div>
    ),
  },

  // STATUS
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Status" className="min-w-100px" />
    ),
    accessor: 'status',
    Cell: ({ value }) => {
      const badgeClass =
        value === 'Pending'
          ? 'badge-light-warning'
          : value === 'Accept'
          ? 'badge-light-success'
          : 'badge-light-danger'
      return <span className={`badge ${badgeClass}`}>{value}</span>
    },
  },

  // ACTIONS
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Actions" className="min-w-150px" />
    ),
    id: 'actions',
    Cell: ({ row }) => <RequestActionsCell request={row.original} />,
  },
] 

export { supervisorRequestsColumns }