import { useQuery } from 'react-query'
import { EventEditModalForm } from './EventEditModalForm'
import { isNotEmpty, QUERIES } from '../../../../../../_metronic/helpers'
import { useListView } from '../core/ListViewProvider'
import { getEventById } from '../core/_requests'

const EventEditModalFormWrapper = () => {
  const { itemIdForUpdate, setItemIdForUpdate } = useListView()
  const enabledQuery: boolean = isNotEmpty(itemIdForUpdate)
  
  const {
    isLoading,
    data: event,
    error,
  } = useQuery(
    `${QUERIES.EVENTS_LIST}-event-${itemIdForUpdate}`,
    () => {
      console.log('📥 Fetching event with ID:', itemIdForUpdate)
      // ✅ แปลงเป็น string
      return getEventById(String(itemIdForUpdate))
    },
    {
      cacheTime: 0,
      enabled: enabledQuery,
      onError: (err) => {
        console.error('❌ Error fetching event:', err)
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
    hasEvent: !!event,
    hasError: !!error,
  })

  if (isLoading) {
    return (
      <div className='text-center py-10'>
        <span className='spinner-border spinner-border-lg'></span>
        <div className='mt-3'>Loading event data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='alert alert-danger'>
        <h4>Error loading event</h4>
        <p>{(error as any).message || 'Failed to load event data'}</p>
      </div>
    )
  }

  if (!itemIdForUpdate) {
    console.log('📝 Create mode - no event ID')
    return <EventEditModalForm isEventLoading={false} event={null} />
  }

  if (event) {
    console.log('✏️ Edit mode with event:', event)
    return <EventEditModalForm isEventLoading={false} event={event} />
  }

  return (
    <div className='text-center py-10'>
      <p>No event data available</p>
    </div>
  )
}

export { EventEditModalFormWrapper }