import { Column } from 'react-table'
import { DayOffRequest, getEmployeeDisplayName, formatDate } from '../../core/_models'
import { DayOffActionsCell } from './DayOffActionsCell'
import { DayOffCustomHeader } from './DayOffCustomHeader'

const dayOffColumns: ReadonlyArray<Column<DayOffRequest>> = [
  // NO
  {
    Header: () => <th className="min-w-50px text-center">No</th>,
    id: 'no',
    Cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },

  // Employee Name
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Employee" className="min-w-150px" />
    ),
    id: 'employee_name',
    Cell: ({ row }) => {
      const name = getEmployeeDisplayName(row.original)
      return <div className="fw-bold text-gray-800">{name}</div>
    },
  },

  // Type
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Type" className="min-w-100px" />
    ),
    accessor: 'day_off_type',
    Cell: ({ value }) => (
      <div
        className={`badge ${
          value === 'HALF_DAY' ? 'badge-light-info' : 'badge-light-primary'
        }`}
      >
        {value === 'HALF_DAY' ? 'Half Day' : 'Full Day'}
      </div>
    ),
  },

  // Start Date
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Start Date" className="min-w-125px" />
    ),
    accessor: 'start_date_time',
    Cell: ({ value }) => <div className="text-gray-800">{formatDate(value)}</div>,
  },

  // End Date
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="End Date" className="min-w-125px" />
    ),
    accessor: 'end_date_time',
    Cell: ({ value }) => <div className="text-gray-800">{formatDate(value)}</div>,
  },

  // Duration
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Duration" className="min-w-100px" />
    ),
    accessor: 'date_off_number',
    Cell: ({ value }) => (
      <div className="badge badge-light-dark">
        {value === 0.5 ? '0.5' : value} day(s)
      </div>
    ),
  },

  // Reason
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Reason" className="min-w-200px" />
    ),
    accessor: 'title',
    Cell: ({ value }) => (
      <div className="text-gray-700" title={value}>
        {value.length > 50 ? `${value.substring(0, 50)}...` : value}
      </div>
    ),
  },

  // Status
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Status" className="min-w-100px" />
    ),
    accessor: 'status',
    Cell: ({ value }) => {
      const badgeClass =
        value === 'Pending'
          ? 'badge-light-warning'
          : value === 'Accepted'
          ? 'badge-light-success'
          : 'badge-light-danger'

      return <div className={`badge ${badgeClass} fw-bold`}>{value}</div>
    },
  },

  // Actions
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Actions" className="text-end min-w-150px" />
    ),
    id: 'actions',
    Cell: ({ row }) => <DayOffActionsCell dayOff={row.original} />,
  },
]

export { dayOffColumns }