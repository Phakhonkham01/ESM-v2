import { Column } from 'react-table'
import { User, getDepartmentName, getPositionName, formatCurrency, getStatusBadge, getRoleBadge } from '../../core/_models'
import { UserCustomHeader } from './UserCustomHeader'
import { SalaryActionsCell } from './SalaryActionsCell'

const salaryListColumns: ReadonlyArray<Column<User>> = [
  {
    Header: (props) => <UserCustomHeader tableProps={props} title="No." className="min-w-50px" />,
    id: 'no',
    Cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    Header: (props) => <UserCustomHeader tableProps={props} title="Name" className="min-w-150px" />,
    id: 'name',
    Cell: ({ row }) => (
      <div className="d-flex align-items-center">
        <div className="symbol symbol-35px me-3">
          <div className="symbol-label bg-light-primary">
            <span className="text-primary fw-bold">
              {row.original.first_name_en.charAt(0)}
              {row.original.last_name_en.charAt(0)}
            </span>
          </div>
        </div>
        <div>
          <div className="fw-bold text-gray-800">
            {row.original.first_name_en} {row.original.last_name_en}
          </div>
          <div className="text-muted fs-7">{row.original.email}</div>
        </div>
      </div>
    ),
  },
  {
    Header: (props) => <UserCustomHeader tableProps={props} title="Role" className="min-w-100px" />,
    accessor: 'role',
    Cell: ({ value }) => (
      <span className={`badge ${getRoleBadge(value)}`}>
        {value}
      </span>
    ),
  },
  {
    Header: (props) => <UserCustomHeader tableProps={props} title="Department" className="min-w-150px" />,
    id: 'department',
    Cell: ({ row }) => <div className="text-gray-800">{getDepartmentName(row.original)}</div>,
  },
  {
    Header: (props) => <UserCustomHeader tableProps={props} title="Position" className="min-w-150px" />,
    id: 'position',
    Cell: ({ row }) => <div className="text-gray-800">{getPositionName(row.original)}</div>,
  },
  {
    Header: (props) => <UserCustomHeader tableProps={props} title="Base Salary" className="min-w-125px text-end" />,
    id: 'base_salary',
    Cell: ({ row }) => (
      <div className="text-end fw-bold text-gray-800">
        {formatCurrency(row.original.base_salary)}
      </div>
    ),
  },
  {
    Header: (props) => <UserCustomHeader tableProps={props} title="Status" className="min-w-100px" />,
    accessor: 'status',
    Cell: ({ value }) => (
      <span className={`badge ${getStatusBadge(value)}`}>
        {value}
      </span>
    ),
  },
  {
    Header: (props) => <UserCustomHeader tableProps={props} title="Vacation" className="min-w-100px" />,
    id: 'vacation',
    Cell: ({ row }) => (
      <span className="badge badge-light-info">
        {row.original.leave_days || 0} days
      </span>
    ),
  },
  {
    Header: (props) => <UserCustomHeader tableProps={props} title="Actions" className="text-end min-w-100px" />,
    id: 'actions',
    Cell: ({ row }) => <SalaryActionsCell user={row.original} />,
  },
]

export { salaryListColumns }