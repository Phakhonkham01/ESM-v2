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
    Cell: ({ value, row }) => {
      const request = row.original
      const departmentName = value
      
      console.log('🏢 Rendering department cell:', {
        requestId: request._id,
        department_name: departmentName,
        value: value
      })
      
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

  // Supervisor
  // Supervisor Column - FIXED VERSION
{
  Header: (props) => (
    <RequestCustomHeader tableProps={props} title="Supervisor" className="min-w-150px" />
  ),
  accessor: 'supervisor_name',
  Cell: ({ value }: { value: string | undefined }) => {  // ✅ Explicit type for value
    // ✅ Parse supervisor names with explicit typing
    const parseSupervisorNames = (): string[] => {
      // Handle undefined or null
      if (!value || value === '' || value === 'N/A') {
        return []
      }
      
      // Handle string
      if (typeof value === 'string') {
        if (value.includes(',')) {
          return value.split(',').map((n: string) => n.trim()).filter((n: string) => n)
        }
        return [value]
      }
      
      // Handle array (shouldn't happen with accessor 'supervisor_name', but just in case)
      if (Array.isArray(value)) {
        return (value as any[]).filter((n: any) => n && typeof n === 'string')
      }
      
      return []
    }
    
    const names = parseSupervisorNames()
    
    // ✅ Get styling based on supervisor count
    const getBackgroundColor = (): string => {
      if (names.length === 0) return 'bg-light-warning'
      if (names.length === 1) return 'bg-light-success'
      if (names.length === 2) return 'bg-light-primary'
      return 'bg-light-info'
    }
    
    const getIconColor = (): string => {
      if (names.length === 0) return 'text-warning'
      if (names.length === 1) return 'text-success'
      if (names.length === 2) return 'text-primary'
      return 'text-info'
    }
    
    if (names.length === 0) {
      return (
        <div className={`d-flex align-items-center p-2 ${getBackgroundColor()} rounded`}>
          <i className={`bi bi-person-x fs-5 ${getIconColor()} me-2`}></i>
          <span className="text-muted fw-bold">No supervisor assigned</span>
        </div>
      )
    }
    
    return (
      <div className="d-flex flex-column">
        {names.map((name: string, index: number) => (
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