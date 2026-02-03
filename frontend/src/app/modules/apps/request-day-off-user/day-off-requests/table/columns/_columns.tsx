import { Column } from 'react-table'
import { DayOffRequest } from '../../core/_models'
import { UserCustomHeader } from './UserCustomHeader' // ใช้ UserCustomHeader เดิม

const dayOffRequestsColumns: ReadonlyArray<Column<DayOffRequest>> = [
  {
    Header: () => <th className="min-w-50px text-center">No</th>,
    id: 'no',
    Cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Employee" className="min-w-150px" />
    ),
    id: 'employee',
    Cell: ({ row }) => {
      const request = row.original
      // ตรวจสอบว่า employee_id เป็น object หรือ string
      let employeeName = 'Unknown'
      let employeeEmail = ''
      
      if (typeof request.employee_id === 'object' && request.employee_id !== null) {
        // ถ้าเป็น User object
        employeeName = request.employee_id.user_name || 
                      `${request.employee_id.first_name_en || ''} ${request.employee_id.last_name_en || ''}`.trim()
        employeeEmail = request.employee_id.user_email || ''
      } else if (typeof request.employee_id === 'string') {
        // ถ้าเป็น string (ID)
        employeeName = request.employee_id
      }
      
      return (
        <div className="d-flex flex-column">
          <span className="fw-semibold text-gray-800">{employeeName}</span>
          {employeeEmail && <span className="text-muted fs-7">{employeeEmail}</span>}
        </div>
      )
    },
  },
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Supervisor" className="min-w-150px" />
    ),
    id: 'supervisor',
    Cell: ({ row }) => {
      const request = row.original
      let supervisorName = 'N/A'
      
      if (Array.isArray(request.supervisor_id)) {
        supervisorName = request.supervisor_id
          .map(sup => {
            if (typeof sup === 'object' && sup !== null) {
              return sup.user_name || 
                     `${sup.first_name_en || ''} ${sup.last_name_en || ''}`.trim()
            }
            return sup
          })
          .join(', ')
      } else if (typeof request.supervisor_id === 'object' && request.supervisor_id !== null) {
        supervisorName = request.supervisor_id.user_name || 
                        `${request.supervisor_id.first_name_en || ''} ${request.supervisor_id.last_name_en || ''}`.trim()
      } else if (typeof request.supervisor_id === 'string') {
        supervisorName = request.supervisor_id
      }
      
      return (
        <div className="d-flex flex-column">
          <span className="fw-semibold text-gray-800">{supervisorName}</span>
        </div>
      )
    },
  },
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Title" className="min-w-150px" />
    ),
    accessor: 'title',
    Cell: ({ value }) => (
      <div className="d-flex flex-column">
        <span className="fw-semibold text-gray-800">{value}</span>
      </div>
    ),
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
      const date = new Date(value)
      return (
        <span className="fw-semibold text-gray-800">
          {date.toLocaleDateString('en-GB')}
        </span>
      )
    },
  },
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="End Date" className="min-w-125px" />
    ),
    accessor: 'end_date_time',
    Cell: ({ value }) => {
      const date = new Date(value)
      return (
        <span className="fw-semibold text-gray-800">
          {date.toLocaleDateString('en-GB')}
        </span>
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
        <span className="badge badge-light-primary fw-bold">{value || 0}</span>
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
      if (value === 'Pending') className = 'badge-light-warning'
      if (value === 'Accepted') className = 'badge-light-success'
      if (value === 'Rejected') className = 'badge-light-danger'
      
      return (
        <span className={`badge ${className} fw-bold`}>
          {value}
        </span>
      )
    },
  },
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Created" className="min-w-125px" />
    ),
    accessor: 'created_at',
    Cell: ({ value }) => {
      if (!value) return <span className="text-muted fs-7">N/A</span>
      
      const date = new Date(value)
      return (
        <span className="text-muted fs-7">
          {date.toLocaleDateString('en-GB')} {date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          })}
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
      return (
        <div className='d-flex justify-content-end flex-shrink-0'>
          <button
            className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
            onClick={() => console.log('View:', request._id || request.id)}
            title='View Details'
          >
            <i className='fas fa-eye fs-4'></i>
          </button>
          
          {request.status === 'Pending' && (
            <>
              <button
                className='btn btn-icon btn-bg-light btn-active-color-success btn-sm me-1'
                onClick={() => console.log('Update:', request._id || request.id)}
                title='Update Status'
              >
                <i className='fas fa-edit fs-4'></i>
              </button>
              
              <button
                className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
                onClick={() => console.log('Delete:', request._id || request.id)}
                title='Delete'
              >
                <i className='fas fa-trash fs-4'></i>
              </button>
            </>
          )}
        </div>
      )
    },
  },
]

export { dayOffRequestsColumns }