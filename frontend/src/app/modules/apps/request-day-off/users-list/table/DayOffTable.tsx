// supervisor-day-off/users-list/table/DayOffTable.tsx
import React, {useMemo} from 'react'
import {useTable, ColumnInstance, Row} from 'react-table'
import {CustomHeaderColumn} from './columns/CustomHeaderColumn'
import {CustomRow} from './columns/CustomRow'
import {useQueryResponseData, useQueryResponseLoading} from '../core/QueryResponseProvider'
import {useQueryResponseStats, useQueryResponseSupervisor} from '../core/QueryResponseProvider'
import {dayOffColumns} from './columns/_columns'
import {DayOffItem} from '../core/_models'
// import {DayOffListLoading} from '../components/loading/DayOffListLoading'
// import {DayOffListPagination} from '../components/pagination/DayOffListPagination'
import {KTCardBody} from '../../../../../../_metronic/helpers'

const DayOffTable = () => {
  const dayOffs = useQueryResponseData()
  const isLoading = useQueryResponseLoading()
  const stats = useQueryResponseStats()
  const supervisor = useQueryResponseSupervisor()
  
  const data = useMemo(() => dayOffs, [dayOffs])
  const columns = useMemo(() => dayOffColumns, [])
  
  const {getTableProps, getTableBodyProps, headers, rows, prepareRow} = useTable({
    columns,
    data,
  })

  return (
    <KTCardBody className='py-4'>
      {/* Supervisor Info and Stats */}
      {supervisor && (
        <div className="mb-10">
          <div className="card card-dashed border border-gray-300 mb-6">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="symbol symbol-50px me-5">
                  <span className="symbol-label bg-light-primary">
                    <i className="fas fa-user-tie fs-2x text-primary"></i>
                  </span>
                </div>
                <div className="d-flex flex-column flex-grow-1">
                  <span className="text-gray-800 fs-4 fw-bold">{supervisor.name}</span>
                  <span className="text-muted fs-7">Supervisor ID: {supervisor.id.substring(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row g-6 g-xl-9 mb-6">
            <div className="col-xl-3 col-sm-6">
              <div className="card card-dashed h-xl-100 flex-center border border-dashed border-gray-300 rounded">
                <div className="card-body">
                  <div className="text-center">
                    <div className="text-gray-600 fs-4 fw-bold">Total</div>
                    <div className="text-gray-900 fs-1 fw-bolder">{stats.total}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-sm-6">
              <div className="card card-dashed h-xl-100 flex-center border border-dashed border-warning rounded">
                <div className="card-body">
                  <div className="text-center">
                    <div className="text-warning fs-4 fw-bold">Pending</div>
                    <div className="text-gray-900 fs-1 fw-bolder">{stats.pending}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-sm-6">
              <div className="card card-dashed h-xl-100 flex-center border border-dashed border-success rounded">
                <div className="card-body">
                  <div className="text-center">
                    <div className="text-success fs-4 fw-bold">Approved</div>
                    <div className="text-gray-900 fs-1 fw-bolder">{stats.accepted}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-sm-6">
              <div className="card card-dashed h-xl-100 flex-center border border-dashed border-danger rounded">
                <div className="card-body">
                  <div className="text-center">
                    <div className="text-danger fs-4 fw-bold">Rejected</div>
                    <div className="text-gray-900 fs-1 fw-bolder">{stats.rejected}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='table-responsive'>
        <table
          id='kt_table_dayoff'
          className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'
          {...getTableProps()}
        >
          <thead>
            <tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
              {headers.map((column: ColumnInstance<DayOffItem>) => (
                <CustomHeaderColumn key={column.id} column={column} />
              ))}
            </tr>
          </thead>
          <tbody className='text-gray-600 fw-bold' {...getTableBodyProps()}>
            {rows.length > 0 ? (
              rows.map((row: Row<DayOffItem>, i) => {
                prepareRow(row)
                return <CustomRow row={row} key={`row-${i}-${row.id}`} />
              })
            ) : (
              <tr>
                <td colSpan={dayOffColumns.length}>
                  <div className='d-flex text-center w-100 align-content-center justify-content-center'>
                    No matching records found
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* <DayOffListPagination />
      {isLoading && <DayOffListLoading />} */}
    </KTCardBody>
  )
}

export {DayOffTable}