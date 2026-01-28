import { useMemo } from 'react'
import { useTable, ColumnInstance, Row } from 'react-table'
import { CustomHeaderColumn } from './columns/CustomHeaderColumn'
import { CustomRow } from './columns/CustomRow'
import { useQueryResponseData, useQueryResponseLoading } from '../core/QueryResponseProvider'
import { eventsColumns } from './columns/_columns'
import { Holiday } from '../core/_models'
import { EventsListLoading } from '../components/loading/EventsListLoading'
import { UsersListPagination } from '../components/pagination/UsersListPagination'
import { KTCardBody } from '../../../../../../_metronic/helpers'
import { useAuth } from '../../../../auth'
import { useQueryRequest } from '../core/QueryRequestProvider'


const UsersTable = () => {
  const { currentUser } = useAuth()
  const users = useQueryResponseData()
  const isLoading = useQueryResponseLoading()
  const { updateState } = useQueryRequest()

  // ✅ Filter data based on role and user_id
  const filteredData = useMemo(() => {
    if (!users || !currentUser) {
      console.log('❌ No users or currentUser')
      return []
    }

    const localStorageUserId = currentUser._id
    const Role = currentUser?.role

    console.log('🔍 Current User:', {
      id: currentUser._id,
      role: currentUser.role,
      _id: currentUser._id
    })

    // ===== CEO =====
if (Role === 'CEO') {
  console.log('👑 CEO - showing all PUBLIC holidays')

  const filtered = users.filter((holiday: any) => {
    const type = holiday.holiday_type?.toLowerCase()?.trim()
    console.log('🔹 Checking holiday:', holiday.holiday_name, 'type:', type)
    return type === 'public'
  })

  console.log(`📊 CEO result: ${filtered.length} holidays found`)
  return filtered
}


    // ===== ADMIN =====
    if (Role === 'admin') {
      console.log('🛠️ Admin - showing PUBLIC holidays + own PRIVATE holidays')

      const filtered = users.filter((holiday: any) => {
        // ✅ private → เห็นทั้งหมด
        if (holiday.holiday_type === 'public') {
          return true
        }

        // ✅ private → ต้องเป็นของตัวเอง
        if (holiday.holiday_type === 'private') {
          let holidayUserId = ''

          if (typeof holiday.user_id === 'string') {
            holidayUserId = holiday.user_id
          } else if (holiday.user_id && typeof holiday.user_id === 'object') {
            holidayUserId =
              holiday.user_id._id ||
              holiday.user_id.id ||
              holiday.user_id.$oid ||
              String(holiday.user_id)
          }

          return holidayUserId === localStorageUserId
        }

        return false
      })

      return filtered
    }


    if (Role === 'employee') {
      console.log('👤 Employee - filtering holidays for current user')

      const filtered = users.filter((holiday: any) => {

        // public + approved
        if (holiday.holiday_type === 'public' && holiday.status === 'approved') return true

        // private ของตัวเอง
        if (holiday.holiday_type === 'private') {
          let holidayUserId = ''
          if (holiday.user_id) {
            holidayUserId =
              typeof holiday.user_id === 'string'
                ? holiday.user_id
                : holiday.user_id._id || holiday.user_id.id || String(holiday.user_id)
          }
          if (holidayUserId === currentUser._id) return true
        }

        return false
      })

      console.log(`📊 Employee result: ${filtered.length} holidays found`)
      return filtered
    }

    console.log('⚠️ Unknown role:', currentUser.role)
    return []
  }, [users, currentUser])

  const data = useMemo(() => filteredData, [filteredData])
  const columns = useMemo(() => eventsColumns, [])

  const { getTableProps, getTableBodyProps, headers, rows, prepareRow } = useTable({
    columns,
    data,
  })

  return (
    <KTCardBody className='py-4'>
      <div className='table-responsive'>
        <table
          id='kt_table_users'
          className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'
          {...getTableProps()}
        >
          <thead>
            <tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
              {headers.map((column: ColumnInstance<Holiday>) => (
                <CustomHeaderColumn key={column.id} column={column} />
              ))}
            </tr>
          </thead>
          <tbody className='text-gray-600 fw-bold' {...getTableBodyProps()}>
            {rows.length > 0 ? (
              rows.map((row: Row<Holiday>, i) => {
                prepareRow(row)
                return <CustomRow row={row} key={`row-${i}-${row.id}`} />
              })
            ) : (
              <tr>
                <td colSpan={headers.length}>
                  <div className='d-flex text-center w-100 align-content-center justify-content-center'>
                    {(currentUser?.role === 'employee')
                      ? 'You have no assigned activities'
                      : 'No data found'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <UsersListPagination />
      {isLoading && <EventsListLoading />}
    </KTCardBody>
  )
}

export { UsersTable }