import { useQuery } from 'react-query'
import { HolidayEditModalForm } from './EventEditModalForm'
import { isNotEmpty, QUERIES } from '../../../../../../_metronic/helpers'
import { useListView } from '../core/ListViewProvider'
import { getHolidayByIds } from '../core/_requests'

const HolidayEditModalFormWrapper = () => {
  const { itemIdForUpdate, setItemIdForUpdate } = useListView()
  const enabledQuery: boolean = isNotEmpty(itemIdForUpdate)
  
  const {
    isLoading,
    data: holiday,
    error,
  } = useQuery(
    `${QUERIES.HOLIDAYS_LIST}-holiday-${itemIdForUpdate}`,
    () => {
      console.log('📥 Fetching holiday with ID:', itemIdForUpdate)
      // ✅ แปลงเป็น string
      return getHolidayByIds(String(itemIdForUpdate))
    },
    {
      cacheTime: 0,
      enabled: enabledQuery,
      onError: (err) => {
        console.error('❌ Error fetching holiday:', err)
        setItemIdForUpdate(undefined)
      },
      onSuccess: (data) => {
        console.log('✅ Event data loaded:', data)
      },
    }
  )

  console.log('🔍 EventEditModalFormWrapper state:', {
    itemIdForUpdate,
    enabledQuery,
    isLoading,
    hasEvent: !!holiday,
    hasError: !!error,
  })

  if (isLoading) {
    return (
      <div className='text-center py-10'>
        <span className='spinner-border spinner-border-lg'></span>
        <div className='mt-3'>Loading holiday data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='alert alert-danger'>
        <h4>Error loading holiday</h4>
        <p>{(error as any).message || 'Failed to load holiday data'}</p>
      </div>
    )
  }

  if (!itemIdForUpdate) {
    console.log('📝 Create mode - no holiday ID')
    return <HolidayEditModalForm isLoading={false} holiday={null} />
  }

  if (holiday) {
    console.log('✏️ Edit mode with holiday:', holiday)
    return <HolidayEditModalForm isLoading={false} holiday={holiday} />
  }

  return (
    <div className='text-center py-10'>
      <p>No holiday data available</p>
    </div>
  )
}

export { HolidayEditModalFormWrapper }