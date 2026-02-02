// supervisor-day-off/users-list/table/columns/_columns.tsx
import { Column } from 'react-table'
import { DayOffItem } from '../../core/_models'
import { DayOffInfoCell } from './DayOffInfoCell'
import { DayOffActionsCell } from './DayOffActionsCell'
import { DayOffStatusCell } from './DayOffStatusCell'
import { DayOffCustomHeader } from './DayOffCustomHeader'
import { getEmployeeDisplayName, formatDate } from '../../core/_requests'

const dayOffColumns: ReadonlyArray<Column<DayOffItem>> = [
  // NO
  {
    Header: () => <th className="min-w-50px text-center">No</th>,
    id: 'no',
    Cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },

  // Employee
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Employee" className="min-w-150px" />
    ),
    id: 'employee',
    Cell: ({ row }) => {
      const item = row.original
      const employeeName = getEmployeeDisplayName(item)
      return (
        <div className="d-flex align-items-center">
          <div className="symbol symbol-50px me-5">
            <span className="symbol-label bg-light-primary">
              <span className="svg-icon svg-icon-2x svg-icon-primary">
                <i className="fas fa-user fs-2"></i>
              </span>
            </span>
          </div>
          <div className="d-flex flex-column">
            <span className="text-gray-800 fw-bold">{employeeName}</span>
            <span className="text-muted fw-semibold d-block fs-7">
              {typeof item.employee_id === 'object' && item.employee_id.employee_id 
                ? `ID: ${item.employee_id.employee_id}`
                : ''}
            </span>
          </div>
        </div>
      )
    }
  },

  // Type
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Type" className="min-w-100px" />
    ),
    accessor: 'day_off_type',
    Cell: ({ value }) => (
      <div className={`badge badge-light-${value === 'HALF_DAY' ? 'warning' : 'info'}`}>
        {value === 'HALF_DAY' ? 'Half Day' : 'Full Day'}
      </div>
    )
  },

  // Start Date
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Start Date" className="min-w-100px" />
    ),
    accessor: 'start_date_time',
    Cell: ({ value }) => (
      <span className="text-gray-700 fw-bold">
        {formatDate(value)}
      </span>
    )
  },

  // End Date
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="End Date" className="min-w-100px" />
    ),
    accessor: 'end_date_time',
    Cell: ({ value }) => (
      <span className="text-gray-700 fw-bold">
        {formatDate(value)}
      </span>
    )
  },

  // Duration
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Duration" className="min-w-100px" />
    ),
    accessor: 'date_off_number',
    Cell: ({ value }) => (
      <span className="fw-bold">
        {value === 0.5 ? '0.5' : value} day(s)
      </span>
    )
  },

  // Reason
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Reason" className="min-w-150px" />
    ),
    accessor: 'title',
    Cell: ({ value }) => (
      <div className="w-150px min-w-100px">
        <div className="text-dark fw-bold text-hover-primary mb-1 fs-6" title={value}>
          {value.length > 30 ? `${value.substring(0, 30)}...` : value}
        </div>
      </div>
    )
  },

  // Status
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Status" className="min-w-100px" />
    ),
    accessor: 'status',
    Cell: ({ value }) => <DayOffStatusCell status={value} />
  },

  // Actions
  {
    Header: (props) => (
      <DayOffCustomHeader tableProps={props} title="Actions" className="text-end min-w-150px" />
    ),
    id: 'actions',
    Cell: ({ row }) => <DayOffActionsCell item={row.original} />,
  },
]

export { dayOffColumns }