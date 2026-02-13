import { Column } from 'react-table'
import { SalaryData, getMonthName, getStatusInfo } from '../../core/_models'
import { SalaryCustomHeader } from './SalaryCustomHeader'
import { SalaryActionsCell } from './SalaryActionsCell'
import { KTIcon } from '../../../../../../../_metronic/helpers'

const salaryListColumns: ReadonlyArray<Column<SalaryData>> = [
  {
    Header: (props) => <SalaryCustomHeader tableProps={props} title="Employee" className="min-w-150px" />,
    id: 'employee',
    Cell: ({ row }) => {
      const salary = row.original
      return (
        <div className="d-flex align-items-center">
          <div className="symbol symbol-35px me-3">
            <div className="symbol-label bg-light-primary">
              <KTIcon iconName="profile-user" className="fs-3 text-primary" />
            </div>
          </div>
          <div>
            <div className="fw-bold text-gray-800">
              {salary.user_id.first_name_en} {salary.user_id.last_name_en}
            </div>
            <div className="text-muted fs-7">{salary.user_id.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    Header: (props) => <SalaryCustomHeader tableProps={props} title="Period" className="min-w-125px" />,
    id: 'period',
    Cell: ({ row }) => {
      const salary = row.original
      return (
        <div className="text-gray-800">
          {getMonthName(salary.month)} {salary.year}
        </div>
      )
    },
  },
  {
    Header: (props) => <SalaryCustomHeader tableProps={props} title="Department" className="min-w-125px" />,
    id: 'department',
    Cell: ({ row }) => {
      const salary = row.original
      return (
        <div className="text-gray-800">
          {salary.user_id.department_id?.name || 'N/A'}
        </div>
      )
    },
  },
  {
    Header: (props) => <SalaryCustomHeader tableProps={props} title="Position" className="min-w-125px" />,
    id: 'position',
    Cell: ({ row }) => {
      const salary = row.original
      return (
        <div className="text-gray-800">
          {salary.user_id.position_id?.name || 'N/A'}
        </div>
      )
    },
  },
  {
    Header: (props) => <SalaryCustomHeader tableProps={props} title="Base Salary" className="min-w-125px" />,
    id: 'base_salary',
    Cell: ({ row }) => {
      const salary = row.original
      return (
        <div className="text-gray-800 fw-bold">
          {(salary.base_salary)} KIP
        </div>
      )
    },
  },
  {
    Header: (props) => <SalaryCustomHeader tableProps={props} title="Net Salary" className="min-w-125px" />,
    accessor: 'net_salary',
    Cell: ({ value }) => (
      <div className="text-success fw-bold">
        {(value)} KIP
      </div>
    ),
  },
  {
    Header: (props) => <SalaryCustomHeader tableProps={props} title="Status" className="min-w-100px" />,
    accessor: 'status',
    Cell: ({ value }) => {
      const statusInfo = getStatusInfo(value)
      return (
        <span className={`badge ${statusInfo.color} fw-bold`}>
          {statusInfo.label}
        </span>
      )
    },
  },
  {
    Header: (props) => <SalaryCustomHeader tableProps={props} title="Payment Date" className="min-w-125px" />,
    accessor: 'payment_date',
    Cell: ({ value }) => {
      const date = new Date(value)
      return (
        <div className="text-gray-800">
          {date.toLocaleDateString()}
        </div>
      )
    },
  },
  {
    Header: (props) => <SalaryCustomHeader tableProps={props} title="Actions" className="text-end min-w-100px" />,
    id: 'actions',
    Cell: ({ row }) => <SalaryActionsCell salary={row.original} />,
  },
]

export { salaryListColumns }