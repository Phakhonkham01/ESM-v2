/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { initialQueryState, KTIcon, useDebounce } from '../../../../../../../_metronic/helpers'
import { useQueryRequest } from '../../core/QueryRequestProvider'

// Import services for fetching filter options
import { getDepartments } from '../../core/departmentAPI' // You'll need to create this
import { getYearOptions, getMonthOptions } from '../../core/_requests' // Helper functions

interface FilterState {
  year: string
  month: string
  department: string
  status: string
}

const UsersListSearchComponent = () => {
  const { updateState } = useQueryRequest()

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    year: '',
    month: '',
    department: 'All Departments',
    status: 'All Status'
  })

  // Options states
  const [years, setYears] = useState<string[]>([])
  const [months, setMonths] = useState<Array<{ value: string; label: string }>>([])
  const [departments, setDepartments] = useState<Array<{ _id: string; department_name: string }>>([])
  const [statuses] = useState<string[]>([
    'All Status',
    'Pending',
    'Approved',
    'Rejected',
    'Cancelled'
  ])

  const [isLoading, setIsLoading] = useState(false)

  // Fetch filter options on component mount
  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setIsLoading(true)
      try {
        // Get year options (5 years back, no future years)
        const yearOptions = getYearOptions(5, 0, true)
        setYears(yearOptions)

        // Get month options with value-label format
        const monthOptions = getMonthOptions(true, 'value-label')
        setMonths(monthOptions as Array<{ value: string; label: string }>)

        // Fetch departments from database
        const departmentsResponse = await getDepartments()
        setDepartments([
          { _id: 'all', department_name: 'All Departments' },
          ...departmentsResponse
        ])
      } catch (error) {
        console.error('Error fetching filter options:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFilterOptions()
  }, [])

  const fetchFilterOptions = async () => {
    setIsLoading(true)
    try {
      // Fetch years (e.g., last 5 years including current)
      const currentYear = new Date().getFullYear()
      const yearOptions = []
      for (let i = 0; i < 5; i++) {
        yearOptions.push((currentYear - i).toString())
      }
      setYears(['All Years', ...yearOptions])

      // Fetch months
      const monthOptions = [
        { value: 'All Months', label: 'All Months' },
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' }
      ]
      setMonths(monthOptions)

      // Fetch departments from database
      const departmentsResponse = await getDepartments()
      setDepartments([
        { _id: 'all', department_name: 'All Departments' },
        ...departmentsResponse
      ])
    } catch (error) {
      console.error('Error fetching filter options:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update query state when filters change
  useEffect(() => {
    const activeFilters: any = {
      ...initialQueryState,
    }

    // Add filters only if they have values and not "All" options
    if (filters.year && filters.year !== '' && filters.year !== 'All Years') {
      activeFilters.year = filters.year
    }

    if (filters.month && filters.month !== '' && filters.month !== 'All Months') {
      activeFilters.month = filters.month
    }

    if (filters.department && filters.department !== 'All Departments') {
      activeFilters.department = filters.department
    }

    if (filters.status && filters.status !== 'All Status') {
      activeFilters.status = filters.status
    }

    // Only update if we have at least one filter
    if (Object.keys(activeFilters).length > 1) { // >1 because initialQueryState has pagination defaults
      updateState(activeFilters)
    } else {
      // Reset to initial state if no filters
      updateState(initialQueryState)
    }
  }, [filters.year, filters.month, filters.department, filters.status])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const resetFilters = () => {
    setFilters({
      year: '',
      month: '',
      department: 'All Departments',
      status: 'All Status'
    })
    // Directly update state with initial query
    updateState(initialQueryState)
  }

  return (
    <div className='card-title w-100'>
      {/* Filter Section - Horizontal Layout */}
      <div className='d-flex flex-wrap align-items-center gap-5 w-100'>
        {/* Year Filter */}
        <div className='d-flex align-items-center'>
          <select
            className='form-select form-select-solid'
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            style={{ minWidth: '120px' }}
          >
            <option value=''>All Years</option>
            {years.filter(y => y !== 'All Years').map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div className='d-flex align-items-center'>
          <select
            className='form-select form-select-solid'
            value={filters.month}
            onChange={(e) => handleFilterChange('month', e.target.value)}
            style={{ minWidth: '140px' }}
          >
            <option value=''>All Months</option>
            {months.filter(m => m.value !== 'All Months').map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div className='d-flex align-items-center'>
          <select
            className='form-select form-select-solid'
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            style={{ minWidth: '180px' }}
            disabled={isLoading}
          >
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id === 'all' ? 'All Departments' : dept.department_name}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className='d-flex align-items-center'>
          <select
            className='form-select form-select-solid'
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{ minWidth: '140px' }}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <div className='d-flex align-items-center'>
          <button
            className='btn btn-icon btn-light-primary'
            onClick={resetFilters}
            title='Reset filters'
          >
            <KTIcon iconName='arrow-rotate-left' className='fs-3' />
            Reset
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.year || filters.month ||
        (filters.department && filters.department !== 'All Departments') ||
        (filters.status && filters.status !== 'All Status')) && (
          <div className='d-flex flex-wrap align-items-center gap-2 mt-3'>
            <span className='fw-bold'>Active filters:</span>
            {filters.year && filters.year !== '' && filters.year !== 'All Years' && (
              <span className='badge badge-light-primary'>Year: {filters.year}</span>
            )}
            {filters.month && filters.month !== '' && filters.month !== 'All Months' && (
              <span className='badge badge-light-primary'>
                Month: {months.find(m => m.value === filters.month)?.label || filters.month}
              </span>
            )}
            {filters.department && filters.department !== 'All Departments' && (
              <span className='badge badge-light-primary'>Department: {filters.department}</span>
            )}
            {filters.status && filters.status !== 'All Status' && (
              <span className='badge badge-light-primary'>Status: {filters.status}</span>
            )}
          </div>
        )}
    </div>
  )
}

export { UsersListSearchComponent }