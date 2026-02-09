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
import {useAuth} from '../../../../auth' // ✅ Import useAuth hook

const UsersTable = () => {
  const requests = useQueryResponseData()
  const isLoading = useQueryResponseLoading()
  const {currentUser} = useAuth() // ✅ ใช้ useAuth แทน localStorage
  
  // ✅ Filter and format data
  const data = useMemo(() => {
    // ✅ ดึง user ID จาก currentUser
    const currentUserId = currentUser?._id || currentUser?._id
    
    if (!currentUserId) {
      console.warn('⚠️ No user ID found in currentUser')
      console.log('👤 currentUser:', currentUser)
      return []
    }

    console.log('👤 Current User ID:', currentUserId)
    console.log('📦 All Requests:', requests)

    // Filter requests where user_id matches current user
    const filteredRequests = requests.filter(request => {
      console.log('🔍 Checking request:', request)
      
      // Extract user_id (could be string or object with _id/id)
      let requestUserId = ''
      
      if (typeof request.user_id === 'string') {
        requestUserId = request.user_id
      } else if (typeof request.user_id === 'object' && request.user_id !== null) {
        requestUserId = (request.user_id as any)._id || (request.user_id as any).id || ''
      }

      console.log(`   ├─ request.user_id (raw):`, request.user_id)
      console.log(`   ├─ requestUserId (extracted):`, requestUserId)
      console.log(`   ├─ currentUserId:`, currentUserId)
      console.log(`   └─ Match?`, requestUserId === currentUserId)
      
      const isMatch = requestUserId === currentUserId
      
      if (isMatch) {
        console.log('✅ Match found:', request)
      }
      
      return isMatch
    })

    console.log('📊 Filtered Requests:', filteredRequests)

    return filteredRequests.map(request => formatRequestOTFieldWork(request))
  }, [requests, currentUser]) // ✅ เพิ่ม currentUser ใน dependencies
  
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
                    {isLoading ? 'Loading...' : 'No matching records found'}
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