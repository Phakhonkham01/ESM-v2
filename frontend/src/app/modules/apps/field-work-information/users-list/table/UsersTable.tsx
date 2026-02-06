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
  
  // ✅ Process data with FIELD_WORK filter
  const data = useMemo(() => {
    console.log('📦 ========== REQUEST TABLE DATA PROCESSING ==========')
    console.log('📦 Raw requests from API:', requests)
    console.log('📦 Number of requests:', requests?.length || 0)

    if (!requests || requests.length === 0) {
      console.log('⚠️ No requests available')
      return []
    }

    // 🔥 FILTER: กรองเฉพาะ FIELD_WORK เท่านั้น
    const fieldWorkRequests = requests.filter(request => {
      // ลองเช็ค structure ของ request
      console.log('🔍 Checking request structure:', request)
      
      // กรองตาม title เท่านั้น (จาก error message)
      return request.title === 'FIELD_WORK'
    })
    
    console.log('📊 After FIELD_WORK filter:', fieldWorkRequests.length, 'requests')

    // ✅ Format only FIELD_WORK requests
    const formattedData = fieldWorkRequests.map((request, index) => {
      console.log(`\n🔄 ========== FORMATTING FIELD_WORK REQUEST ${index + 1}/${fieldWorkRequests.length} ==========`)
      
      const formatted = formatRequestOTFieldWork(request)
      
      console.log('✅ Formatted result:', formatted)
      
      return formatted
    })

    console.log('📦 ========== FINAL FORMATTED DATA ==========')
    console.log('📦 Total FIELD_WORK records:', formattedData.length)
    
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

  console.log('🔢 Table rendering with', rows.length, 'FIELD_WORK rows')

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
                    {isLoading ? 'Loading...' : 'No FIELD_WORK requests found'}
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