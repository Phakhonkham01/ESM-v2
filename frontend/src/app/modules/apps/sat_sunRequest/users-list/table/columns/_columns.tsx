import { Column } from 'react-table'
import {
  SatSunRequest,
  getSatSunStatusBadgeClass,
  getDepartmentName,
  getPositionName,
  getEmployeeFullName,
  isPopulatedEmployee,
} from '../../core/_models'
import { SatSunCustomHeader } from './CustomHeaderColumn'
import { SatSunActionsCell } from './UserActionsCell'
import { KTIcon } from '../../../../../../../_metronic/helpers'

const satSunColumns: ReadonlyArray<Column<SatSunRequest>> = [
  // ── No ──────────────────────────────────────────────────────
  {
    Header: (props) => (
      <SatSunCustomHeader tableProps={props} title='No' className='min-w-50px text-center' />
    ),
    id: 'no',
    Cell: ({ row }) => (
      <div className='text-center fw-bold'>{row.index + 1}</div>
    ),
  },

  // ── Employee Name ────────────────────────────────────────────
  // {
  //   Header: (props) => (
  //     <SatSunCustomHeader tableProps={props} title='Employee' className='min-w-200px' />
  //   ),
  //   id: 'employee',
  //   Cell: ({ row }) => {
  //     const emp = row.original.employee_id
  //     if (!isPopulatedEmployee(emp)) return <span className='text-muted'>-</span>

  //     return (
  //       <div className='d-flex align-items-center'>
  //         <div className='symbol symbol-35px me-3'>
  //           <div className='symbol-label bg-light-primary'>
  //             <KTIcon iconName='profile-user' className='fs-3 text-primary' />
  //           </div>
  //         </div>
  //         <div>
  //           <div className='fw-bold text-gray-800'>
  //             {getEmployeeFullName(emp)}
  //             {emp.nickname_en && (
  //               <span className='text-muted fs-7 ms-1'>({emp.nickname_en})</span>
  //             )}
  //           </div>
  //           <div className='text-muted fs-7'>{emp.user_email}</div>
  //         </div>
  //       </div>
  //     )
  //   },
  // },

  // ── Department / Position ────────────────────────────────────
  // {
  //   Header: (props) => (
  //     <SatSunCustomHeader tableProps={props} title='Department' className='min-w-125px' />
  //   ),
  //   id: 'department',
  //   Cell: ({ row }) => {
  //     const emp = row.original.employee_id
  //     if (!isPopulatedEmployee(emp)) return <span className='text-muted'>N/A</span>

  //     return (
  //       <div className='text-gray-800'>
  //         {getDepartmentName(emp)}
  //         <div className='text-muted fs-7'>{getPositionName(emp)}</div>
  //       </div>
  //     )
  //   },
  // },

  // ── Day Choice ───────────────────────────────────────────────
  {
    Header: (props) => (
      <SatSunCustomHeader tableProps={props} title='Day' className='min-w-100px' />
    ),
    accessor: 'day_choice',
    Cell: ({ value }) => (
      <span className={`badge ${value === 'Saturday' ? 'badge-light-info' : 'badge-light-primary'} fw-bold`}>
        {value}
      </span>
    ),
  },

  // ── Day Off Type ─────────────────────────────────────────────
  {
    Header: (props) => (
      <SatSunCustomHeader tableProps={props} title='Type' className='min-w-100px' />
    ),
    accessor: 'day_off_type',
    Cell: ({ value }) => (
      <span className={`badge ${value === 'Full day' ? 'badge-light-success' : 'badge-light-warning'} fw-bold`}>
        {value}
      </span>
    ),
  },

  // ── Date Range ───────────────────────────────────────────────
  {
    Header: (props) => (
      <SatSunCustomHeader tableProps={props} title='Date' className='min-w-150px' />
    ),
    id: 'date_range',
    Cell: ({ row }) => {
      const { start_date_time, end_date_time, day_off_type } = row.original

      const fmt = (d: string | Date) =>
        new Date(d).toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
        })

      const fmtTime = (d: string | Date) =>
        new Date(d).toLocaleTimeString('en-GB', {
          hour: '2-digit', minute: '2-digit', hour12: false,
          timeZone: 'Asia/Bangkok',
        })

      if (day_off_type === 'Half day') {
        return (
          <div className='text-gray-800'>
            {fmt(start_date_time)}
            <div className='text-muted fs-7'>
              {fmtTime(start_date_time)} – {fmtTime(end_date_time)}
            </div>
          </div>
        )
      }

      return (
        <div className='text-gray-800'>
          {fmt(start_date_time)}
          {fmt(start_date_time) !== fmt(end_date_time) && (
            <div className='text-muted fs-7'>to {fmt(end_date_time)}</div>
          )}
        </div>
      )
    },
  },

  // ── Days Count ───────────────────────────────────────────────
  {
    Header: (props) => (
      <SatSunCustomHeader tableProps={props} title='Days' className='min-w-80px text-center' />
    ),
    accessor: 'date_off_number',
    Cell: ({ value }) => (
      <div className='text-center fw-bold text-gray-800'>
        {value}{' '}
        <span className='text-muted fs-7'>day{value > 1 ? 's' : ''}</span>
      </div>
    ),
  },

  // ── Description ──────────────────────────────────────────────
  // {
  //   Header: (props) => (
  //     <SatSunCustomHeader tableProps={props} title='Description' className='min-w-150px' />
  //   ),
  //   accessor: 'description',
  //   Cell: ({ value }) => (
  //     <span className='text-gray-600 text-truncate d-block' style={{ maxWidth: '180px' }}>
  //       {value || <span className='text-muted'>-</span>}
  //     </span>
  //   ),
  // },

  // ── Status ───────────────────────────────────────────────────
  {
    Header: (props) => (
      <SatSunCustomHeader tableProps={props} title='Status' className='min-w-100px' />
    ),
    accessor: 'status',
    Cell: ({ value }) => (
      <span className={`badge ${getSatSunStatusBadgeClass(value)} fw-bold`}>
        {value}
      </span>
    ),
  },

  // ── Created At ───────────────────────────────────────────────
  {
    Header: (props) => (
      <SatSunCustomHeader tableProps={props} title='Created' className='min-w-120px' />
    ),
    accessor: 'created_at',
    Cell: ({ value }) => {
      if (!value) return <span className='text-muted'>-</span>
      return (
        <span className='text-gray-600 fs-7'>
          {new Date(value).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            timeZone: 'Asia/Bangkok',
          })}
        </span>
      )
    },
  },

  // ── Actions ──────────────────────────────────────────────────
  {
    Header: (props) => (
      <SatSunCustomHeader tableProps={props} title='Actions' className='text-end min-w-100px' />
    ),
    id: 'actions',
    Cell: ({ row }) => <SatSunActionsCell request={row.original} />,
  },
]

export { satSunColumns }