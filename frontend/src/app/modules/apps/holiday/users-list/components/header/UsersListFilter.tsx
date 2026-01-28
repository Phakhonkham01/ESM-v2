import { useEffect, useState } from 'react'
import { MenuComponent } from '../../../../../../../_metronic/assets/ts/components'
import { initialQueryState, KTIcon } from '../../../../../../../_metronic/helpers'
import { useQueryRequest } from '../../core/QueryRequestProvider'
import { useQueryResponse } from '../../core/QueryResponseProvider'
import { useAuth } from '../../../../../auth'



const UsersListFilter = () => {
  const { updateState } = useQueryRequest()
  const { isLoading } = useQueryResponse()
  const [holidayType, setHolidayType] = useState<string | undefined>()
  const [status, setStatus] = useState<string | undefined>()
  const { currentUser } = useAuth()

  const role = currentUser?.role

  useEffect(() => {
    MenuComponent.reinitialization()
  }, [])

  const resetData = () => {
    setStatus(undefined)
    updateState({ filter: undefined, ...initialQueryState })
    MenuComponent.reinitialization()
  }

  const filterData = () => {
    const filter: any = {}

    if (holidayType) {
      // ใช้ holiday_type
      filter.holiday_type = holidayType
    }

    if (status) {
      filter.status = status
    }

    updateState({
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      ...initialQueryState,
    })
  }

  return (
    <>
      {/* begin::Filter Button */}
      <button
        disabled={isLoading}
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
          {/* begin::Input group - Holiday Type */}
          {(role === 'employee' || role === 'admin') && (
            <div className='mb-10'>
              <label className='form-label fw-bold'>Holiday Type</label>
              <select
                className='form-select form-select-solid'
                value={holidayType || ''}
                onChange={(e) => setHolidayType(e.target.value || undefined)}
              >
                <option value=''>All</option>
                <option value='public'>Public</option>
                <option value='private'>Private</option>
              </select>
            </div>
          )}
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
              <option value='pending'>Pending</option>
              <option value='approved'>Approved</option>
              <option value='rejected'>Rejected</option>
              {/* <option value='cancelled'>Cancelled</option> */}
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
              disabled={isLoading}
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

export { UsersListFilter }
