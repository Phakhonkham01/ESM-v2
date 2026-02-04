import { Column } from 'react-table'
import { RequestData, formatDate, formatHour, calculateDuration, getEmployeeName, getEmployeeEmail } from '../../core/_models'
import { RequestCustomHeader } from './RequestCustomHeader'
import { RequestActionsCell } from './RequestActionsCell'

const supervisorRequestsColumns: ReadonlyArray<Column<RequestData>> = [
  {
    Header: () => <th className="min-w-50px text-center">No</th>,
    id: 'no',
    Cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    Header: (props) => <RequestCustomHeader tableProps={props} title="Employee" className="min-w-150px" />,
    id: 'employee',
    Cell: ({ row }) => {
      const name = getEmployeeName(row.original)
      const email = getEmployeeEmail(row.original)
      return (
        <div>
          <div className="fw-bold text-gray-800">{name}</div>
          {email && <div className="text-muted fs-7">{email}</div>}
        </div>
      )
    },
  },
  {
    Header: (props) => <RequestCustomHeader tableProps={props} title="Type" className="min-w-100px" />,
    accessor: 'title',
    Cell: ({ value }) => (
      <div className={`badge badge-light-${value === 'OT' ? 'primary' : 'info'}`}>
        {value === 'OT' ? 'Overtime' : 'Field Work'}
      </div>
    ),
  },
  {
    Header: (props) => <RequestCustomHeader tableProps={props} title="Date" className="min-w-125px" />,
    accessor: 'date',
    Cell: ({ value }) => <div className="text-gray-800">{formatDate(value)}</div>,
  },
  {
    Header: (props) => <RequestCustomHeader tableProps={props} title="Time" className="min-w-125px" />,
    id: 'time',
    Cell: ({ row }) => (
      <div className="text-gray-800">
        {formatHour(row.original.start_hour)} - {formatHour(row.original.end_hour)}
      </div>
    ),
  },
  {
    Header: (props) => <RequestCustomHeader tableProps={props} title="Duration" className="min-w-100px" />,
    id: 'duration',
    Cell: ({ row }) => (
      <div className="fw-bold text-primary">
        {calculateDuration(row.original.start_hour, row.original.end_hour)}
      </div>
    ),
  },
  {
    Header: (props) => <RequestCustomHeader tableProps={props} title="Reason" className="min-w-200px" />,
    accessor: 'reason',
    Cell: ({ value }) => (
      <div className="text-gray-700" title={value}>
        {value.length > 50 ? `${value.substring(0, 50)}...` : value}
      </div>
    ),
  },
  {
    Header: (props) => <RequestCustomHeader tableProps={props} title="Status" className="min-w-100px" />,
    accessor: 'status',
    Cell: ({ value }) => {
      const badgeClass = value === 'Pending' ? 'badge-light-warning' : value === 'Accept' ? 'badge-light-success' : 'badge-light-danger'
      return <div className={`badge ${badgeClass} fw-bold`}>{value}</div>
    },
  },
  {
    Header: (props) => <RequestCustomHeader tableProps={props} title="Actions" className="text-end min-w-100px" />,
    id: 'actions',
    Cell: ({ row }) => <RequestActionsCell request={row.original} />,
  },
]

export { supervisorRequestsColumns }