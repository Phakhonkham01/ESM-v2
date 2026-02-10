import { useMemo } from 'react'
import { useTable, ColumnInstance, Row } from 'react-table'
import { CustomHeaderColumn } from './columns/CustomHeaderColumn'
import { CustomRow } from './columns/CustomRow'
import {
  useQueryResponseData,
  useQueryResponseLoading,
} from '../core/QueryResponseProvider'
import { dayOffRequestsColumns } from './columns/_columns'
import { DayOffRequest } from '../core/_models'
import { DayoffrequestsListLoading } from '../components/loading/DayoffrequestsListtLoading'
import { UsersListPagination } from '../components/pagination/UsersListPagination'
import { KTCardBody } from '../../../../../../_metronic/helpers'
import { useListView } from '../../users-list/core/ListViewProvider'

/* =========================
   Auth helpers
========================= */

type UserRole = 'admin' | 'supervisor' | 'user' | string

interface CurrentUser {
  id: string
  role: UserRole
}

const getCurrentUser = (): CurrentUser | null => {
  try {
    const authDataStr =
      localStorage.getItem('kt-auth-react-v') ||
      localStorage.getItem('user') ||
      localStorage.getItem('authUser')

    if (!authDataStr) return null

    const authData = JSON.parse(authDataStr)

    const user = authData.user || authData.data || authData

    return {
      id: user._id || user.id,
      role: user.role || user.user_role || user.type || 'user',
    }
  } catch (error) {
    console.error('❌ Error reading auth data:', error)
    return null
  }
}

/* =========================
   Helpers
========================= */

const extractUserId = (userIdField: any): string => {
  if (!userIdField) return ''

  if (typeof userIdField === 'object') {
    return userIdField._id || userIdField.id || ''
  }

  return userIdField.toString()
}

/* =========================
   Component
========================= */

const DayOffRequestsTable = () => {
  const allRequests = useQueryResponseData() as DayOffRequest[]
  const isLoading = useQueryResponseLoading()

  const currentUser = getCurrentUser()
  const currentUserRole = currentUser?.role
  const currentUserId = currentUser?.id
  const { refreshKey } = useListView()

  /* =========================
     Filter Logic
  ========================= */
  const requests = useMemo(() => {
    if (!Array.isArray(allRequests)) return []
    if (!currentUser) return []

    if (currentUserRole === 'admin' || currentUserRole === 'supervisor') {
      return allRequests
    }

    return allRequests.filter((req) => extractUserId(req.user_id) === currentUserId)
  }, [allRequests, currentUser, currentUserRole, currentUserId, refreshKey]) // ✅ เพิ่ม refreshKey

  const data = useMemo(() => requests, [requests])
  const columns = useMemo(() => dayOffRequestsColumns as any, [])

  const {
    getTableProps,
    getTableBodyProps,
    headers,
    rows,
    prepareRow,
  } = useTable({
    columns,
    data,
  })

  /* =========================
     Render
  ========================= */
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
              {headers.map((column: ColumnInstance<any>, i) => (
                <CustomHeaderColumn key={i} column={column} />
              ))}
            </tr>
          </thead>

          <tbody className='text-gray-600 fw-bold' {...getTableBodyProps()}>
            {rows.length > 0 ? (
              rows.map((row: Row<any>, i) => {
                prepareRow(row)
                return (
                  <CustomRow
                    key={`row-${i}-${row.original._id || row.original.id}`}
                    row={row}
                  />
                )
              })
            ) : (
              <tr>
                <td colSpan={headers.length}>
                  <div className='d-flex flex-column text-center py-10'>
                    {!currentUser ? (
                      <>
                        <i className='bi bi-person-x fs-1 text-muted mb-3' />
                        <div className='text-muted fs-4 fw-semibold'>
                          No User Logged In
                        </div>
                      </>
                    ) : isLoading ? (
                      <>
                        <div className='spinner-border text-primary mb-3' />
                        <div className='text-muted'>
                          Loading requests...
                        </div>
                      </>
                    ) : (
                      <>
                        <i className='bi bi-inbox fs-1 text-muted mb-3' />
                        <div className='text-muted fs-4 fw-semibold'>
                          {currentUserRole === 'admin' ||
                            currentUserRole === 'supervisor'
                            ? 'No day off requests found'
                            : 'You have no day off requests'}
                        </div>
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

export { DayOffRequestsTable }
