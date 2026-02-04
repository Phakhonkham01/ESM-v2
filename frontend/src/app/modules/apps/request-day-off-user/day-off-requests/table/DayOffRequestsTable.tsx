import {useMemo} from 'react'
import {useTable, ColumnInstance, Row} from 'react-table'
import {CustomHeaderColumn} from './columns/CustomHeaderColumn'
import {CustomRow} from './columns/CustomRow'
import {useQueryResponseData, useQueryResponseLoading} from '../core/QueryResponseProvider'
import {dayOffRequestsColumns} from './columns/_columns'
import {DayOffRequest} from '../core/_models'
import {DayoffrequestsListLoading} from '../components/loading/DayoffrequestsListtLoading'
import {UsersListPagination} from '../components/pagination/UsersListPagination'
import {KTCardBody} from '../../../../../../_metronic/helpers'

// Helper function to get current user from localStorage
const getCurrentUserId = (): string | null => {
  try {
    // Try different possible keys in localStorage
    const authDataStr = localStorage.getItem('kt-auth-react-v') || 
                        localStorage.getItem('user') ||
                        localStorage.getItem('authUser')
    
    if (authDataStr) {
      const authData = JSON.parse(authDataStr)
      
      // Try different possible structures
      const userId = authData._id || 
                     authData.id || 
                     authData.user?._id || 
                     authData.user?.id ||
                     authData.data?._id ||
                     authData.data?.id
      
      console.log('🔍 Current user ID from localStorage:', userId)
      return userId
    }
    
    console.warn('⚠️ No auth data found in localStorage')
    return null
  } catch (error) {
    console.error('❌ Error getting user from localStorage:', error)
    return null
  }
}

// Helper function to extract user_id from request
const extractUserId = (userIdField: any): string => {
  if (!userIdField) return ''
  
  // If it's a populated object
  if (typeof userIdField === 'object' && userIdField !== null) {
    return userIdField._id || userIdField.id || ''
  }
  
  // If it's just a string ID
  return userIdField.toString()
}

const DayOffRequestsTable = () => {
  const allRequests = useQueryResponseData() as DayOffRequest[]
  const isLoading = useQueryResponseLoading()
  const currentUserId = getCurrentUserId()
  
  // Filter requests by current user
  const requests = useMemo(() => {
    if (!allRequests || !Array.isArray(allRequests)) {
      return []
    }
    
    // If no user is logged in, return empty array
    if (!currentUserId) {
      console.warn('⚠️ No user logged in, showing no requests')
      return []
    }
    
    // Filter requests where user_id matches current user
    const filteredRequests = allRequests.filter((request) => {
      const requestUserId = extractUserId(request.user_id)
      const matches = requestUserId === currentUserId
      
      if (matches) {
        console.log('✅ Request matches current user:', {
          requestId: request._id || request.id,
          requestUserId,
          currentUserId
        })
      }
      
      return matches
    })
    
    console.log(`📊 Filtered ${filteredRequests.length} requests out of ${allRequests.length} total`)
    
    return filteredRequests
  }, [allRequests, currentUserId])
  
  const data = useMemo(() => requests, [requests])
  const columns = useMemo(() => dayOffRequestsColumns as any, [])
  
  const {getTableProps, getTableBodyProps, headers, rows, prepareRow} = useTable({
    columns,
    data,
  })

  return (
    <KTCardBody className='py-4'>
      <div className='table-responsive'>
        <table
          id='kt_table_day_off_requests'
          className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'
          {...getTableProps()}
        >
          <thead>
            <tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
              {headers.map((column: ColumnInstance<any>, i: number) => (
                <CustomHeaderColumn key={i} column={column} />
              ))}
            </tr>
          </thead>
          <tbody className='text-gray-600 fw-bold' {...getTableBodyProps()}>
            {rows.length > 0 ? (
              rows.map((row: Row<any>, i) => {
                prepareRow(row)
                return <CustomRow row={row} key={`row-${i}-${row.original._id || row.original.id}`} />
              })
            ) : (
              <tr>
                <td colSpan={headers.length}>
                  <div className='d-flex flex-column text-center w-100 align-content-center justify-content-center py-10'>
                    {!currentUserId ? (
                      <>
                        <i className='bi bi-person-x fs-1 text-muted mb-3'></i>
                        <div className='text-muted fs-4 fw-semibold mb-2'>No User Logged In</div>
                        <div className='text-muted fs-6'>Please log in to view your day off requests</div>
                      </>
                    ) : isLoading ? (
                      <>
                        <div className='spinner-border text-primary mb-3' role='status'>
                          <span className='visually-hidden'>Loading...</span>
                        </div>
                        <div className='text-muted fs-6'>Loading your requests...</div>
                      </>
                    ) : (
                      <>
                        <i className='bi bi-inbox fs-1 text-muted mb-3'></i>
                        <div className='text-muted fs-4 fw-semibold mb-2'>No Day Off Requests</div>
                        <div className='text-muted fs-6'>You haven't submitted any day off requests yet</div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <UsersListPagination />
      {isLoading && <DayoffrequestsListLoading />}
    </KTCardBody>
  )
}

export {DayOffRequestsTable}