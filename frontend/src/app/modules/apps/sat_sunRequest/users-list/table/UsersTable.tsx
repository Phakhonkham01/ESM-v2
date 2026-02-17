import {useMemo} from 'react'
import {useTable, ColumnInstance, Row} from 'react-table'
import {SatSunColumnHeader} from './columns/CustomHeaderColumn'
import {CustomRow} from './columns/CustomRow'
import {useQueryResponseData, useQueryResponseLoading} from '../core/QueryResponseProvider'
import {satSunColumns} from './columns/_columns'
import {SatSunRequest} from '../core/_models'
import {SatSunListLoading} from '../components/loading/UsersListLoading'
import {SatSunListPagination} from '../components/pagination/UsersListPagination'
import {KTCardBody} from '../../../../../../_metronic/helpers'
import {useAuth} from '../../../../../../app/modules/auth'

const SatSunTable = () => {
  const requests = useQueryResponseData()
  const isLoading = useQueryResponseLoading()
  const {currentUser} = useAuth()

  // ── Filter เฉพาะ request ของ user ที่ login อยู่ ──────────
  const data = useMemo(() => {
    if (!currentUser) return []

    return requests.filter((req) => {
      // employee_id อาจเป็น string (ObjectId) หรือ populated object
      const empId =
        typeof req.employee_id === 'object' && req.employee_id !== null
          ? (req.employee_id as any)._id?.toString() ?? (req.employee_id as any).id?.toString()
          : req.employee_id?.toString()

      // user_id เช่นกัน
      const userId =
        typeof req.user_id === 'object' && req.user_id !== null
          ? (req.user_id as any)._id?.toString() ?? (req.user_id as any).id?.toString()
          : req.user_id?.toString()

      const currentId = (currentUser._id ?? currentUser._id)?.toString()

      return empId === currentId || userId === currentId
    })
  }, [requests, currentUser])

  const columns = useMemo(() => satSunColumns, [])
  const {getTableProps, getTableBodyProps, headers, rows, prepareRow} = useTable({
    columns,
    data,
  })

  return (
    <KTCardBody className='py-4'>
      <div className='table-responsive'>
        <table
          id='kt_table_sat_sun_requests'
          className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'
          {...getTableProps()}
        >
          <thead>
            <tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
              {headers.map((column: ColumnInstance<SatSunRequest>) => (
                <SatSunColumnHeader key={column.id} column={column} />
              ))}
            </tr>
          </thead>
          <tbody className='text-gray-600 fw-bold' {...getTableBodyProps()}>
            {rows.length > 0 ? (
              rows.map((row: Row<SatSunRequest>, i) => {
                prepareRow(row)
                return <CustomRow row={row} key={`row-${i}-${row.id}`} />
              })
            ) : (
              <tr>
                <td colSpan={satSunColumns.length}>
                  <div className='d-flex text-center w-100 align-content-center justify-content-center'>
                    {isLoading ? 'Loading...' : 'No matching records found'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <SatSunListPagination />
      {isLoading && <SatSunListLoading />}
    </KTCardBody>
  )
}

export {SatSunTable}