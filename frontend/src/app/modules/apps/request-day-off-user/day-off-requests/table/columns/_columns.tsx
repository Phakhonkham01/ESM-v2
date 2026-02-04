import { Column } from 'react-table'
import { FormattedDayOffRequest } from '../../core/_models'
import { UserCustomHeader } from './UserCustomHeader'
import { useListView } from '../../core/ListViewProvider'

const DayOffRequestActionsCell = ({ id }: { id: string }) => {
  const { setItemIdForUpdate } = useListView()
  
  return (
    <div className="d-flex justify-content-end ">
      <button
        className="btn btn-sm btn-light btn-active-primary view-btn-custom"
        onClick={() => setItemIdForUpdate(id)}
      >
        <i className="bi bi-eye me-2"></i>
        <span>View</span>
      </button>
      <style>{`
        .view-btn-custom i,
        .view-btn-custom span {
          color: #198754 !important;
        }
        .view-btn-custom:hover i,
        .view-btn-custom:hover span {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  )
}

const dayOffRequestsColumns: ReadonlyArray<Column<FormattedDayOffRequest>> = [
  {
    Header: () => <th className="min-w-50px text-center">No</th>,
    id: 'no',
    Cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },
  
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="Title" className="min-w-150px" />
    ),
    accessor: 'title',
    Cell: ({ value }) => (
      <div className="d-flex flex-column">
        <span className="fw-semibold text-gray-800">{value || 'N/A'}</span>
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
      if (!value) return <span className="text-muted">N/A</span>
      
      const date = new Date(value)
      return (
        <div className="d-flex flex-column">
          <span className="fw-semibold text-gray-800">
            {date.toLocaleDateString('en-GB')}
          </span>
          <span className="text-muted fs-7">
            {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )
    },
  },
  {
    Header: (props) => (
      <UserCustomHeader tableProps={props} title="End Date" className="min-w-125px" />
    ),
    accessor: 'end_date_time',
    Cell: ({ value }) => {
      if (!value) return <span className="text-muted">N/A</span>
      
      const date = new Date(value)
      return (
        <div className="d-flex flex-column">
          <span className="fw-semibold text-gray-800">
            {date.toLocaleDateString('en-GB')}
          </span>
          <span className="text-muted fs-7">
            {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
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
        <span className="badge badge-light-primary fw-bold">
          {value || 0} {value === 1 ? 'day' : 'days'}
        </span>
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
      let icon = 'bi-question-circle'
      
      if (value === 'Pending') {
        className = 'badge-light-warning'
        icon = 'bi-clock-history'
      }
      if (value === 'Accepted') {
        className = 'badge-light-success'
        icon = 'bi-check-circle'
      }
      if (value === 'Rejected') {
        className = 'badge-light-danger'
        icon = 'bi-x-circle'
      }
      
      return (
        <span className={`badge ${className} fw-bold`}>
          <i className={`bi ${icon} me-1`}></i>
          {value || 'Unknown'}
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
      <UserCustomHeader tableProps={props} title="Supervisor" className="min-w-150px" />
    ),
    accessor: 'supervisor_name',
    Cell: ({ value, row }) => {
      const request = row.original
      
      // แยกชื่อ supervisor
      const parseSupervisorNames = () => {
        if (!value || value === '' || value === 'N/A') {
          return []
        }
        
        if (typeof value === 'string') {
          if (value.includes(',')) {
            return value.split(',').map(n => n.trim()).filter(n => n)
          }
          return [value]
        }
        
        if (Array.isArray(value)) {
          return value.filter(n => n)
        }
        
        return []
      }
      
      const names = parseSupervisorNames()
      
      // กำหนดสีตามจำนวน supervisor
      const getBackgroundColor = () => {
        if (names.length === 0) return 'bg-light-warning'
        if (names.length === 1) return 'bg-light-success'
        if (names.length === 2) return 'bg-light-primary'
        return 'bg-light-info'
      }
      
      const getIconColor = () => {
        if (names.length === 0) return 'text-warning'
        if (names.length === 1) return 'text-success'
        if (names.length === 2) return 'text-primary'
        return 'text-info'
      }
      
      if (names.length === 0) {
        return (
          <div className={`d-flex align-items-center p-2 ${getBackgroundColor()} rounded`}>
            <i className={`bi bi-person-x fs-5 ${getIconColor()} me-2`}></i>
            <span className="text-title fw-bold">No supervisor assigned</span>
          </div>
        )
      }
      
      return (
        <div className="d-flex flex-column">
          {names.map((name, index) => (
            <div 
              key={index} 
              className={`
                d-flex align-items-center mb-1 p-2 rounded
                ${getBackgroundColor()}
              `}
            >
              <i className={`
                bi ${names.length > 1 ? 'bi-people-fill' : 'bi-person-check-fill'} 
                fs-5 ${getIconColor()} me-2
              `}></i>
              <span className="fw-bold fs-8 text-gray-900">{name}</span>
            </div>
          ))}
        </div>
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
      const requestId = request._id || request._id
      
      return <DayOffRequestActionsCell id={requestId} />
    },
  },
]

export { dayOffRequestsColumns }