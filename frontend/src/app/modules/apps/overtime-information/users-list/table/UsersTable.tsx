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
    console.log('📦 ========== USERS TABLE DATA PROCESSING ==========')
    console.log('📦 Raw requests from API:', requests)
    console.log('📦 Number of requests:', requests?.length || 0)

    if (!requests || requests.length === 0) {
      console.log('⚠️ No requests available')
      return []
    }

    // Log first request in detail
    console.log('📦 First request sample (before filter):', requests[0])

    // ✅ Filter OT requests only
    const filteredRequests = requests.filter(request => {
      const isOT = request.title === 'OT'
      console.log(`🔍 Request ${request._id}:`, {
        title: request.title,
        isOT,
        user_id: request.user_id,
        user_name: typeof request.user_id === 'object' ? request.user_id?.user_name : 'string'
      })
      return isOT
    })

    console.log('📊 Filtered OT Requests count:', filteredRequests.length)
    
    if (filteredRequests.length > 0) {
      console.log('📊 First filtered request:', filteredRequests[0])
    }

    // ✅ Format each request
    const formattedData = filteredRequests.map((request, index) => {
      console.log(`\n🔄 ========== FORMATTING REQUEST ${index + 1}/${filteredRequests.length} ==========`)
      const formatted = formatRequestOTFieldWork(request)
      console.log('✅ Formatted result:', {
        _id: formatted._id,
        user_name: formatted.user_name,
        department_name: formatted.department_name,
        title: formatted.title
      })
      return formatted
    })

    console.log('📦 ========== FINAL FORMATTED DATA ==========')
    console.log('📦 Total formatted records:', formattedData.length)
    if (formattedData.length > 0) {
      console.log('📦 Sample formatted record:', formattedData[0])
    }
    console.log('📦 ==========================================\n')

    return formattedData
  }, [requests])
  
  const columns = useMemo(() => requestsColumns, [])
  
  const {getTableProps, getTableBodyProps, headers, rows, prepareRow} = useTable({
    columns,
    data,
  })

  console.log('🔢 Table rendering with', rows.length, 'rows')

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
                console.log(`🎨 Rendering row ${i + 1}:`, {
                  _id: row.original._id,
                  user_name: row.original.user_name,
                  department_name: row.original.department_name
                })
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