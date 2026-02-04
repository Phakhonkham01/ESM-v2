import { Column } from 'react-table'
import { RequestOTFieldWork, FormattedRequestOTFieldWork } from '../../core/_models'
import { RequestCustomHeader } from './UserCustomHeader'

import { RequestStatusCell } from './UserStatusCell'
import { RequestActionsCell } from './UserActionsCell'

const requestsColumns: ReadonlyArray<Column<FormattedRequestOTFieldWork>> = [
  // NO
  {
    Header: () => <th className="min-w-50px text-center">No</th>,
    id: 'no',
    Cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },

  // Employee Name
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Employee" className="min-w-150px" />
    ),
    accessor: 'user_name',
    Cell: ({ row }) => (
      <div>
        <div className="fw-bold">{row.original.user_name}</div>
        <div className="text-muted fs-7">{row.original.user_email}</div>
      </div>
    ),
  },

  // Supervisor
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Supervisor" className="min-w-150px" />
    ),
    accessor: 'supervisor_name',
    Cell: ({ value }) => (
      <div className="text-gray-800">
        {Array.isArray(value) ? value.join(', ') : value || 'N/A'}
      </div>
    ),
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

  // Fuel
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Fuel" className="min-w-100px" />
    ),
    accessor: 'fuel',
    Cell: ({ value }) => (
      <div className="text-gray-800">
        {value.toLocaleString()} LAK
      </div>
    ),
  },

  // Reason
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Reason" className="min-w-200px" />
    ),
    accessor: 'reason',
    Cell: ({ value }) => (
      <div className="text-gray-700" style={{ maxWidth: '200px' }}>
        {value.length > 50 ? `${value.substring(0, 50)}...` : value}
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

  // Created At
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Created" className="min-w-100px" />
    ),
    accessor: 'createdAt',
    Cell: ({ value }) => (
      <div className="text-muted fs-7">
        {new Date(value).toLocaleDateString('en-GB')}
      </div>
    ),
  },

  // Actions
  {
    Header: (props) => (
      <RequestCustomHeader tableProps={props} title="Actions" className="text-end min-w-100px" />
    ),
    id: 'actions',
    Cell: ({ row }) => <RequestActionsCell id={row.original._id} />,
  },
]

export { requestsColumns }