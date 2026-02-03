import { useMemo } from 'react'
import { useTable, ColumnInstance, Row } from 'react-table'
import { CustomHeaderColumn } from './columns/CustomHeaderColumn'
import { CustomRow } from './columns/CustomRow'
import { useQueryResponseData, useQueryResponseLoading } from '../core/QueryResponseProvider'
import { dayOffColumns } from './columns/_columns'
import { DayOffRequest } from '../core/_models'
import { KTCardBody } from '../../../../../../_metronic/helpers'
import { UsersListLoading } from '../../users-list/components/loading/UsersListLoading'
// import { UsersListPagination } from '../../users-list/components/pagination/UsersListPagination'

const DayOffTable = () => {
  const dayOffs = useQueryResponseData()
  const isLoading = useQueryResponseLoading()
  const data = useMemo(() => dayOffs, [dayOffs])
  const columns = useMemo(() => dayOffColumns, [])
  const { getTableProps, getTableBodyProps, headers, rows, prepareRow } = useTable({
    columns,
    data,
  })

  return (
    <KTCardBody className="py-4">
      <div className="table-responsive">
        <table
          id="kt_table_dayoffs"
          className="table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer"
          {...getTableProps()}
        >
          <thead>
            <tr className="text-start text-muted fw-bolder fs-7 text-uppercase gs-0">
              {headers.map((column: ColumnInstance<DayOffRequest>) => (
                <CustomHeaderColumn key={column.id} column={column} />
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-600 fw-bold" {...getTableBodyProps()}>
            {rows.length > 0 ? (
              rows.map((row: Row<DayOffRequest>, i) => {
                prepareRow(row)
                return <CustomRow row={row} key={`row-${i}-${row.id}`} />
              })
            ) : (
              <tr>
                <td colSpan={headers.length}>
                  <div className="d-flex text-center w-100 align-content-center justify-content-center">
                    No matching records found
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* <UsersListPagination /> */}
      {isLoading && <UsersListLoading />}
    </KTCardBody>
  )
}

export { DayOffTable }