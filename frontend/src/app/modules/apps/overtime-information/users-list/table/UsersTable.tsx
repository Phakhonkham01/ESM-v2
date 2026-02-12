import {useMemo} from 'react'
import {useTable, ColumnInstance, Row} from 'react-table'
import {CustomHeaderColumn} from './columns/CustomHeaderColumn'
import {CustomRow} from './columns/CustomRow'
import {useQueryResponseData, useQueryResponseLoading} from '../core/QueryResponseProvider'
import {requestsColumns} from './columns/_columns'
import {FormattedRequestOTFieldWork, formatRequestOTFieldWork} from '../core/_models'
import {UsersListLoading} from '../components/loading/UsersListLoading'
import {UsersListPagination} from '../components/pagination/UsersListPagination'
import {KTCardBody} from '../../../../../../_metronic/helpers'

const UsersTable = () => {
  const requests = useQueryResponseData()
  const isLoading = useQueryResponseLoading()
  
  // ✅ Filter and format data with detailed logging
  const data = useMemo(() => {
    if (!requests || requests.length === 0) {
      return []
    }

    // ✅ Filter OT requests only
    const filteredRequests = requests.filter(request => {
      const isOT = request.title === 'OT'
      return isOT
    })

    // ✅ Format each request
    const formattedData = filteredRequests.map((request, index) => {
      const formatted = formatRequestOTFieldWork(request)
      return formatted
    })
    return formattedData
  }, [requests])
  
  const columns = useMemo(() => requestsColumns, [])
  
  const {getTableProps, getTableBodyProps, headers, rows, prepareRow} = useTable({
    columns,
    data,
  })

  return (
    <KTCardBody className='py-4'>
      <div className='table-responsive'>
        <table
          id='kt_table_requests'
          className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'
          {...getTableProps()}
        >
          <thead>
            <tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
              {headers.map((column: ColumnInstance<FormattedRequestOTFieldWork>) => (
                <CustomHeaderColumn key={column.id} column={column} />
              ))}
            </tr>
          </thead>
          <tbody className='text-gray-600 fw-bold' {...getTableBodyProps()}>
            {rows.length > 0 ? (
              rows.map((row: Row<FormattedRequestOTFieldWork>, i) => {
                prepareRow(row)
                return <CustomRow row={row} key={`row-${i}-${row.id}`} />
              })
            ) : (
              <tr>
                <td colSpan={11}>
                  <div className='d-flex text-center w-100 align-content-center justify-content-center'>
                    {isLoading ? 'Loading...' : 'No OT requests found'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <UsersListPagination />
      {isLoading && <UsersListLoading />}
    </KTCardBody>
  )
}

export {UsersTable}