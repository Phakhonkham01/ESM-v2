import {useEffect, useState} from 'react'
import {MenuComponent} from '../../../../../../../_metronic/assets/ts/components'
import {initialQueryState, KTIcon} from '../../../../../../../_metronic/helpers'
import {useQueryRequest} from '../../core/QueryRequestProvider'
import {useQueryResponse} from '../../core/QueryResponseProvider'
import { useQuery } from 'react-query'
import { getEventTypes } from '../../core/_requests'

const UsersListFilter = () => {
  const {updateState} = useQueryRequest()
  const {isLoading} = useQueryResponse()
  const [eventType, setEventType] = useState<string | undefined>()
  const [status, setStatus] = useState<string | undefined>()

  // Fetch event types from API
  const { 
    data: eventTypes = [], 
    isLoading: loadingEventTypes,
    error: eventTypesError 
  } = useQuery(
    'eventTypes',
    () => getEventTypes(),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
      onError: (error) => {
        console.error('Failed to fetch event types:', error)
      }
    }
  )

  useEffect(() => {
    MenuComponent.reinitialization()
  }, [])

  const resetData = () => {
    updateState({filter: undefined, ...initialQueryState})
    setEventType(undefined)
    setStatus(undefined)
  }

  const filterData = () => {
    const filter: any = {}
    
    if (eventType) {
      // ใช้ event_type_name ตรงๆ
      filter.event_type = eventType
    }
    
    if (status) {
      filter.status = status
    }

    updateState({
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      ...initialQueryState,
    })
  }

  console.log('📋 Event Types from API:', {
    eventTypes,
    isLoading: loadingEventTypes,
    error: eventTypesError
  })

  return (
    <>
      {/* begin::Filter Button */}
      <button
        disabled={isLoading || loadingEventTypes}
        type='button'
        className='btn btn-light-primary me-3'
        data-kt-menu-trigger='click'
        data-kt-menu-placement='bottom-end'
      >
        <KTIcon iconName='filter' className='fs-2' />
        Filter
      </button>
      {/* end::Filter Button */}
      
      {/* begin::SubMenu */}
      <div className='menu menu-sub menu-sub-dropdown w-300px w-md-325px' data-kt-menu='true'>
        {/* begin::Header */}
        <div className='px-7 py-5'>
          <div className='fs-5 text-gray-900 fw-bolder'>Filter Options</div>
        </div>
        {/* end::Header */}

        {/* begin::Separator */}
        <div className='separator border-gray-200'></div>
        {/* end::Separator */}

        {/* begin::Content */}
        <div className='px-7 py-5' data-kt-user-table-filter='form'>
          {/* begin::Input group - Event Type */}
          <div className='mb-10'>
            <label className='form-label fs-6 fw-bold'>Event Type:</label>
            <select
              className='form-select form-select-solid fw-bolder'
              data-kt-select2='true'
              data-placeholder='Select event type'
              data-allow-clear='true'
              data-hide-search='true'
              onChange={(e) => setEventType(e.target.value || undefined)}
              value={eventType || ''}
              disabled={loadingEventTypes}
            >
              <option value=''>All Types</option>
              {eventTypes.map((type: any) => (
                <option 
                  key={type.id || type._id || type.event_type_name} 
                  value={type.event_type_name}
                >
                  {type.event_type_name}
                </option>
              ))}
            </select>
            {loadingEventTypes && (
              <div className='text-muted fs-7 mt-1'>Loading event types...</div>
            )}
            {/* {eventTypesError && (
              <div className='text-danger fs-7 mt-1'>Failed to load event types</div>
            )} */}
          </div>
          {/* end::Input group */}

          {/* begin::Input group - Status */}
          <div className='mb-10'>
            <label className='form-label fs-6 fw-bold'>Status:</label>
            <select
              className='form-select form-select-solid fw-bolder'
              data-kt-select2='true'
              data-placeholder='Select status'
              data-allow-clear='true'
              data-hide-search='true'
              onChange={(e) => setStatus(e.target.value || undefined)}
              value={status || ''}
            >
              <option value=''>All Status</option>
              <option value='draft'>Draft</option>
              <option value='pending'>Pending</option>
              <option value='approved'>Approved</option>
              <option value='rejected'>Rejected</option>
              <option value='scheduled'>Scheduled</option>
              <option value='ongoing'>Ongoing</option>
              <option value='completed'>Completed</option>
              <option value='cancelled'>Cancelled</option>
            </select>
          </div>
          {/* end::Input group */}

          {/* begin::Actions */}
          <div className='d-flex justify-content-end'>
            <button
              type='button'
              disabled={isLoading}
              onClick={resetData}
              className='btn btn-light btn-active-light-primary fw-bold me-2 px-6'
              data-kt-menu-dismiss='true'
              data-kt-user-table-filter='reset'
            >
              Reset
            </button>
            <button
              disabled={isLoading || loadingEventTypes}
              type='button'
              onClick={filterData}
              className='btn btn-primary fw-bold px-6'
              data-kt-menu-dismiss='true'
              data-kt-user-table-filter='filter'
            >
              Apply
            </button>
          </div>
          {/* end::Actions */}
        </div>
        {/* end::Content */}
      </div>
      {/* end::SubMenu */}
    </>
  )
}

export {UsersListFilter}