import { useQuery } from 'react-query'
import { DayOffRequestEditModalForm } from './UserEditModalForm'
import { isNotEmpty, QUERIES } from '../../../../../../_metronic/helpers'
import { useListView } from '../core/ListViewProvider'
import { getDayOffRequestById } from '../core/_requests'

const UserEditModalFormWrapper = () => {
  const { itemIdForUpdate, setItemIdForUpdate } = useListView()
  const enabledQuery: boolean = isNotEmpty(itemIdForUpdate)

  const {
    isLoading,
    data: requestData,
    error,
  } = useQuery(
    `${QUERIES.USERS_LIST}-user-${itemIdForUpdate}`,
    () => getDayOffRequestById(itemIdForUpdate!),
    {
      cacheTime: 0,
      enabled: enabledQuery,
      onError: (err) => {
        setItemIdForUpdate(undefined)
        console.error('Error fetching request:', err)
      },
    }
  )

  // ✅ กรณีสร้างใหม่ (ไม่มี itemIdForUpdate)
  if (!itemIdForUpdate) {
    return <DayOffRequestEditModalForm />
  }

  // ✅ กรณีกำลังโหลดข้อมูล
  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '400px' }}>
        <div className='text-center'>
          <span
            className='spinner-border spinner-border-lg text-primary mb-3'
            style={{ width: '3rem', height: '3rem' }}
          ></span>
          <p className='text-muted mt-3 fs-6'>Loading request data...</p>
        </div>
      </div>
    )
  }

  // ✅ กรณีมี error
  if (error) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '400px' }}>
        <div className='text-center'>
          <i className='bi bi-exclamation-triangle text-danger fs-1 d-block mb-3'></i>
          <p className='text-danger fw-semibold'>Failed to load request data</p>
          <p className='text-muted fs-7'>Please try again or contact support</p>
          <button
            className='btn btn-light-primary btn-sm mt-2'
            onClick={() => setItemIdForUpdate(undefined)}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // ✅ กรณีโหลดสำเร็จ - ส่ง initialData ไปให้ Form
  if (requestData) {
    return <DayOffRequestEditModalForm initialData={requestData} />
  }

  return null
}

export { UserEditModalFormWrapper }