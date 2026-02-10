import { useEffect, useState } from 'react'
import { MenuComponent } from '../../../../../../../_metronic/assets/ts/components'
import { initialQueryState, KTIcon } from '../../../../../../../_metronic/helpers'
import { useQueryRequest } from '../../core/QueryRequestProvider'
import { useQueryResponse } from '../../core/QueryResponseProvider'

const UsersListFilter = () => {
  const { updateState } = useQueryRequest()
  const { isLoading } = useQueryResponse()
  const [role, setRole] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  // เรียก reinitialization ตอน mount
  useEffect(() => {
    MenuComponent.reinitialization()
  }, [])

  // ฟังก์ชันรีเซ็ต
  const resetData = () => {
    setRole('')
    setStatus('')
    updateState({ filter: undefined, ...initialQueryState })
    MenuComponent.reinitialization() // รีเซ็ต UI dropdown
  }

  // ฟังก์ชันกรองข้อมูล
  const filterData = () => {
    const filter: Record<string, string> = {}

    if (role) filter.role = role
    if (status) filter.status = status  // เฉพาะ status ที่มีค่า

    updateState({
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      ...initialQueryState,
    })
  }


  return (
    <>
      {/* ปุ่ม Filter */}
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

      {/* เมนู dropdown */}
      <div className='menu menu-sub menu-sub-dropdown w-300px w-md-325px' data-kt-menu='true'>
        {/* Header */}
        <div className='px-7 py-5'>
          <div className='fs-5 text-gray-900 fw-bolder'>Filter Options</div>
        </div>

        <div className='separator border-gray-200'></div>

        {/* Content */}
        <div className='px-7 py-5' data-kt-user-table-filter='form'>
          {/* Role */}
          <div className='mb-10'>
            <label className='form-label fs-6 fw-bold'>Role:</label>
            <select
              className='form-select form-select-solid fw-bolder'
              data-kt-select2='true'
              data-placeholder='Select option'
              data-allow-clear='true'
              data-kt-user-table-filter='role'
              data-hide-search='true'
              onChange={(e) => setRole(e.target.value)}
              value={role}
            >
              <option value=''>Select Role</option>
              <option value='admin'>Admin</option>
              <option value='employee'>Employee</option>
              <option value='supervisor'>Supervisor</option>
            </select>
          </div>

          {/* Status */}
          <div className='mb-10'>
            <label className='form-label fs-6 fw-bold'>Status:</label>
            <select
              className='form-select form-select-solid fw-bolder'
              data-kt-select2='true'
              data-placeholder='Select status'
              data-allow-clear='true'
              data-hide-search='true'
              onChange={(e) => setStatus(e.target.value || '')}
              value={status || ''}
            >
              <option value=''>All Status</option>
              <option value='Active'>Active</option>
              <option value='Inactive'>Inactive</option>
              <option value='On Leave'>On Leave</option>
            </select>
          </div>

          {/* Action Buttons */}
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
        </div>
      </div>
    </>
  )
}

export { UsersListFilter }
