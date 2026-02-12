import { Column } from 'react-table'
import { RequestOTFieldWork, FormattedRequestOTFieldWork } from '../../core/_models'
import { RequestCustomHeader } from './UserCustomHeader'
import { RequestStatusCell } from './UserStatusCell'
import { useListView } from '../../core/ListViewProvider'

const RequestActionsCell = ({ id }: { id: string }) => {
  const { setItemIdForUpdate } = useListView()
  
  return (
    <div className="d-flex justify-content-end">
      <button
        className="btn btn-sm btn-light-primary"
        onClick={() => setItemIdForUpdate(id)}
      >
        <i className="bi bi-eye me-2"></i>
        <span>View</span>
      </button>
    </div>
  )
}

const requestsColumns: ReadonlyArray<Column<FormattedRequestOTFieldWork>> = [
  // NO
  {
    Header: () => <th className="min-w-50px text-center">No</th>,
    id: 'no',
    Cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },
  
  // Employee
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Employee" className="min-w-150px" />
    ),
    accessor: 'user_name',
    Cell: ({ row }) => {
      const userName = row.original.user_name || 'N/A'
      const userEmail = row.original.user_email || ''
      
      return (
        <div>
          <div className="fw-bold text-gray-800">{userName}</div>
          {userEmail && <div className="text-muted fs-7">{userEmail}</div>}
        </div>
      )
    },
  },
  
  // Department
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Department" className="min-w-150px" />
    ),
    id: 'department',
    accessor: 'department_name',
    Cell: ({ value }) => {
      const departmentName = value
      // Check if department is missing or not populated
      if (!departmentName || departmentName === 'N/A' || departmentName.includes('Not populated')) {
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
          <span className="fw-bold text-gray-900">{departmentName}</span>
        </div>
      )
    },
  },

  // Type (OT/Field Work)
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Type" className="min-w-120px" />
    ),
    accessor: 'title_label',
    Cell: ({ row }) => {
      const isOT = row.original.title === 'OT'
      return (
        <div className={`badge ${isOT ? 'badge-light-info' : 'badge-light-warning'} fw-bold`}>
          {row.original.title_label}
        </div>
      )
    },
  },

  // Date
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Date" className="min-w-100px" />
    ),
    accessor: 'date',
    Cell: ({ value }) => (
      <div className="text-gray-800">
        {new Date(value).toLocaleDateString('en-GB')}
      </div>
    ),
  },

  // Time Range
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Time" className="min-w-100px" />
    ),
    id: 'time_range',
    Cell: ({ row }) => (
      <div className="text-gray-800">
        {row.original.start_hour} - {row.original.end_hour}
      </div>
    ),
  },

  // Status
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Status" className="min-w-100px" />
    ),
    accessor: 'status',
    Cell: ({ row }) => (
      <RequestStatusCell status={row.original.status} color={row.original.statusColor} />
    ),
  },

  // Actions
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Actions" className="text-end min-w-100px" />
    ),
    id: 'actions',
    Cell: ({ row }) => {
      const request = row.original
      const requestId = request._id || request.id || ''
      
      return <RequestActionsCell id={requestId} />
    },
  },
]

export { requestsColumns }