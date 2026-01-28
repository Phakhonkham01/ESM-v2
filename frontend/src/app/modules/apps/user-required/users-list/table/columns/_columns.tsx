import { Column } from 'react-table'
import { EventCustomHeader } from './EventCustomHeader'
import { Event } from '../../core/_models'
import { EventActionsCell } from './EventActionsCell'

const eventsColumns: ReadonlyArray<Column<Event>> = [
  {
    Header: () => <th className="min-w-50px text-center">No</th>,
    id: 'no',
    Cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    Header: (props) => (
      <EventCustomHeader tableProps={props} title="Event Name" className="min-w-150px" />
    ),
    accessor: 'event_name',
  },
  {
    Header: (props) => (
      <EventCustomHeader tableProps={props} title="Type" className="min-w-125px" />
    ),
    accessor: 'event_type_id',
    Cell: ({ value }) => {
      // ✅ event_type เป็น populated object จาก backend
      if (!value) {
        return <span className="text-muted">-</span>
      }

      // ถ้า populate แล้ว จะเป็น object
      if (typeof value === 'object' && value !== null) {
        const eventType = value as any
        const typeName = eventType.event_type_name || 'Unknown'
        const typeColor = eventType.event_type_color || '#6c757d'

        return (
          <div 
            className="badge fw-bolder px-3 py-2"
            style={{ 
              backgroundColor: typeColor,
              color: '#fff'
            }}
          >
            {typeName}
          </div>
        )
      }

      // ถ้าไม่ populate จะเป็น string (ObjectId)
      return (
        <span className="badge badge-light-secondary fw-bolder">
          {value.toString()}
        </span>
      )
    },
  },
  {
    Header: (props) => (
      <EventCustomHeader tableProps={props} title="Start Date" className="min-w-125px" />
    ),
    accessor: 'start_date',
    Cell: ({ value }) => (
      <div>
        {value ? new Date(value).toLocaleDateString('en', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) : '-'}
      </div>
    ),
  },
  {
    Header: (props) => (
      <EventCustomHeader tableProps={props} title="End Date" className="min-w-125px" />
    ),
    accessor: 'end_date',
    Cell: ({ value }) => (
      <div>
        {value ? new Date(value).toLocaleDateString('en', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) : '-'}
      </div>
    ),
  },
  {
    Header: (props) => (
      <EventCustomHeader tableProps={props} title="Status" className="min-w-100px" />
    ),
    accessor: 'status',
    Cell: ({ value }) => {
      const statusLabels: Record<string, string> = {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
      }
      const statusColors: Record<string, string> = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
      }
      const statusIcons: Record<string, string> = {
        pending: 'bi-clock-history',
        approved: 'bi-check-circle',
        rejected: 'bi-x-circle',
      }
      
      return (
        <div className={`badge badge-light-${statusColors[value || ''] || 'secondary'} fw-bolder`}>
          <i className={`bi ${statusIcons[value || '']} me-1`}></i>
          {statusLabels[value || ''] || value}
        </div>
      )
    },
  },
  {
    Header: (props) => (
      <EventCustomHeader tableProps={props} title="Actions" className="text-end min-w-100px" />
    ),
    id: 'actions',
    Cell: ({ row }) => {
      const event = row.original as any
      const id = event._id || event.id
      
      if (!id) {
        return <div className="text-danger small">No ID</div>
      }
      
      return <EventActionsCell id={id} />
    },
  },
]

export { eventsColumns }