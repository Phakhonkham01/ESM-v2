import { Column } from 'react-table'
import { UserInfoCell } from './UserInfoCell'
import { UserEmailCell } from './UserEmailCell'
import { UserLeaveDaysCell } from './UserLeaveDaysCell'
import { UserActionsCell } from './UserActionsCell'
import { UserStatusCell } from './UserStatusCell'
import { UserCustomHeader } from './UserCustomHeader'
import { UserDepartmentCell } from './UserDepartmentCell'
import { UserPositionCell } from './UserPositionCell' // ✅ เพิ่มบรรทัดนี้
import { User } from '../../core/_models'

const usersColumns: ReadonlyArray<Column<User>> = [
  // NO (ไม่ sortable)
  {
    Header: () => <th className="min-w-50px text-center">No</th>,
    id: 'no',
    Cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },

  // ✅ แก้ไข Name ให้แสดง Full Name (EN)
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Name" className="min-w-150px" />
    ),
    id: 'user_name',
    accessor: 'user_name',
    Cell: ({ row }) => {
      const user = row.original
      // แสดง first_name + last_name ถ้ามี, ไม่งั้นแสดง user_name
      const displayName = user.first_name_en && user.last_name_en
        ? `${user.first_name_en} ${user.last_name_en}`
        : user.user_name
      return <UserInfoCell name={displayName} />
    },
  },

  // Role
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Role" className="min-w-100px" />
    ),
    accessor: 'role',
    Cell: ({ value }) => (
      <div className="badge badge-light-primary fw-bold">
        {value?.toUpperCase()}
      </div>
    ),
  },

  // Email
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Email" className="min-w-150px" />
    ),
    accessor: 'user_email',
    Cell: ({ value }) => <UserEmailCell email={value} />,
  },

  // Department
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Department" className="min-w-125px" />
    ),
    accessor: 'department_id',
    Cell: ({ value }) => <UserDepartmentCell department_id={value} />,
  },

  // ✅ เพิ่ม Position Column
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Position" className="min-w-125px" />
    ),
    accessor: 'position_id',
    Cell: ({ value, row }) => {
      // แสดง position เฉพาะ employee เท่านั้น
      if (row.original.role !== 'employee') {
        return <div className="text-muted">-</div>
      }
      return <UserPositionCell position_id={value} />
    },
  },

  // ✅ เพิ่ม Gender Column (Optional)
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Gender" className="min-w-80px" />
    ),
    accessor: 'gender',
    Cell: ({ value }) => (
      <div className="">
        {value === 'male' ? 'Male' : value === 'female' ? 'Female' : 'Other'}
      </div>
    ),
  },

  // Leave Days
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Leave Days" className="min-w-100px" />
    ),
    accessor: 'leave_days',
    Cell: ({ value }) => <UserLeaveDaysCell leave_days={value} />,
  },

  // Status
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Status" className="min-w-100px" />
    ),
    accessor: 'status',
    Cell: ({ value }) => <UserStatusCell status={value} />,
  },

  // Actions
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Actions" className="text-end min-w-100px" />
    ),
    id: 'actions',
    Cell: ({ row }) => <UserActionsCell id={row.original.id} />,
  },
]

export { usersColumns }