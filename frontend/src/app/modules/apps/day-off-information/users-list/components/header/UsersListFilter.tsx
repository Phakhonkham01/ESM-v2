import { useEffect, useState } from 'react'
import { MenuComponent } from '../../../../../../../_metronic/assets/ts/components'
import { initialQueryState, KTIcon } from '../../../../../../../_metronic/helpers'
import { useQueryRequest } from '../../core/QueryRequestProvider'
import { useQueryResponse } from '../../core/QueryResponseProvider'
import { getDepartments } from '../../core/_requests'

const UsersListFilter = () => {
  const { updateState } = useQueryRequest()
  const { isLoading } = useQueryResponse()
  const [year, setYear] = useState<string>('')
  const [month, setMonth] = useState<string>('')
  const [department, setDepartment] = useState<string>('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [departments, setDepartments] = useState<string[]>([])
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false)

  // Get current year for year options
  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4]

  // Month options
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true)
      try {
        if (typeof getDepartments === 'function') {
          const response = await getDepartments()
          const departmentNames: string[] = []

          if (response && response.data) {
            response.data.forEach((dept: any) => {
              if (dept.department_name) departmentNames.push(dept.department_name)
              else if (dept.name) departmentNames.push(dept.name)
            })
          }

          setDepartments(departmentNames)
        }
      } catch (error) {
        console.error('Error fetching departments:', error)
        setDepartments([])
      } finally {
        setIsLoadingDepartments(false)
      }
    }

    fetchDepartments()
  }, [])

  // Call reinitialization on mount
  useEffect(() => {
    MenuComponent.reinitialization()
  }, [])

  // ✅ Reset — clears local state AND query state
  const resetData = () => {
    setYear('')
    setMonth('')
    setDepartment('')
    setStatus(undefined)
    updateState({ filter: undefined, ...initialQueryState })
    MenuComponent.reinitialization()
  }

  // ✅ Apply — builds filter object and pushes to query state
  const filterData = () => {
    const filter: Record<string, string> = {}

    if (year)       filter.year       = year
    if (month)      filter.month      = month
    if (department && department !== 'All Departments') {
      filter.department = department
    }
    if (status)     filter.status     = status

    updateState({
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      ...initialQueryState,
    })
  }

  return (
    <>
      {/* Filter Button */}
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

      {/* Dropdown Menu */}
      <div className='menu menu-sub menu-sub-dropdown w-350px w-md-400px' data-kt-menu='true'>
        {/* Header */}
        <div className='px-7 py-5'>
          <div className='fs-5 text-gray-900 fw-bolder'>Filter Day Off Requests</div>
        </div>

        <div className='separator border-gray-200'></div>

        {/* Content */}
        <div className='px-7 py-5' data-kt-user-table-filter='form'>

          {/* Year */}
          <div className='mb-10'>
            <label className='form-label fs-6 fw-bold'>Year:</label>
            <select
              className='form-select form-select-solid fw-bolder'
              aria-label='Select year'
              onChange={(e) => setYear(e.target.value)}
              value={year}
            >
              <option value=''>All Years</option>
              {years.map((yearOption) => (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div className='mb-10'>
            <label className='form-label fs-6 fw-bold'>Month:</label>
            <select
              className='form-select form-select-solid fw-bolder'
              aria-label='Select month'
              onChange={(e) => setMonth(e.target.value)}
              value={month}
            >
              <option value=''>All Months</option>
              {months.map((monthOption) => (
                <option key={monthOption.value} value={monthOption.value}>
                  {monthOption.label}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className='mb-10'>
            <label className='form-label fs-6 fw-bold'>Department:</label>
            <select
              className='form-select form-select-solid fw-bolder'
              aria-label='Select department'
              onChange={(e) => setDepartment(e.target.value)}
              value={department}
              disabled={isLoadingDepartments}
            >
              <option value=''>
                {isLoadingDepartments ? 'Loading departments...' : 'All Departments'}
              </option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className='mb-10'>
            <label className='form-label fs-6 fw-bold'>Status:</label>
            <select
              className='form-select form-select-solid fw-bolder'
              aria-label='Select status'
              onChange={(e) => setStatus(e.target.value || undefined)}
              value={status || ''}
            >
              <option value=''>All Status</option>
              <option value='Accepted'>Accepted</option>
              <option value='Pending'>Pending</option>
              <option value='Rejected'>Rejected</option>
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
            >
              Reset
            </button>
            <button
              disabled={isLoading}
              type='button'
              onClick={filterData}
              className='btn btn-primary fw-bold px-6'
              data-kt-menu-dismiss='true'
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