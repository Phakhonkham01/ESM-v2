import { Column } from 'react-table'
import { EventCustomHeader } from './EventCustomHeader'
import { Holiday } from '../../core/_models'
import { EventActionsCell } from './EventActionsCell'

const eventsColumns: ReadonlyArray<Column<Holiday>> = [
  {
    Header: () => <th className="min-w-50px text-center">No</th>,
    id: 'no',
    Cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
  },
  {
    Header: (props) => (
      <EventCustomHeader tableProps={props} title="Holiday Name" className="min-w-150px" />
    ),
    accessor: 'holiday_name',
  },
  {
    Header: (props) => (
      <EventCustomHeader tableProps={props} title="Holiday Type" className="min-w-100px" />
    ),
    accessor: 'holiday_type',
    Cell: ({ value }) => {
      const typeLabels: Record<string, string> = {
        public: 'Public Holiday',
        private: 'Leave Day',
      }
      const typeColors: Record<string, string> = {
        public: 'primary',
        private: 'danger',
      }
      return (
        <div className={`badge badge-light-${typeColors[value || ''] || 'secondary'} fw-bolder`}>
          {typeLabels[value || ''] || value}
        </div>
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
        {value ? new Date(value).toLocaleDateString('EN', {
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
        {value ? new Date(value).toLocaleDateString('EN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) : '-'}
      </div>
    ),
  },
  {
    Header: (props) => (
      <EventCustomHeader tableProps={props} title="Total Days" className="min-w-150px" />
    ),
    accessor: 'total_days',
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
  // Action Column
{
  Header: (props) => (
    <EventCustomHeader
      tableProps={props}
      title="Actions"
      className="text-end min-w-100px"
    />
  ),
  id: 'actions',
  Cell: ({ row }) => {
    const holiday = row.original
    return <EventActionsCell holiday={holiday} />
  },
}
]

export { eventsColumns }