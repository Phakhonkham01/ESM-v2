import { useEffect, useState } from 'react'
import { initialQueryState } from '../../../../../../../_metronic/helpers'
import { useQueryRequest } from '../../core/QueryRequestProvider'
import { useQueryResponse } from '../../core/QueryResponseProvider'
import { departmentService, Department } from '../../core/_requests'

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Rejected', label: 'Rejected' },
]

const MONTHS = [
  { value: '1', label: 'January', days: 31 },
  { value: '2', label: 'February', days: 28 },
  { value: '3', label: 'March', days: 31 },
  { value: '4', label: 'April', days: 30 },
  { value: '5', label: 'May', days: 31 },
  { value: '6', label: 'June', days: 30 },
  { value: '7', label: 'July', days: 31 },
  { value: '8', label: 'August', days: 31 },
  { value: '9', label: 'September', days: 30 },
  { value: '10', label: 'October', days: 31 },
  { value: '11', label: 'November', days: 30 },
  { value: '12', label: 'December', days: 31 },
]

const UsersListFilter = () => {
  const { updateState } = useQueryRequest()
  const { isLoading } = useQueryResponse()

  const currentYear = new Date().getFullYear()
  
  // State for departments
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    year: String(currentYear),
    month: '',
    customStartDate: '',
    customEndDate: ''
  })

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true)
      try {
        const depts = await departmentService.getActiveDepartments()
        setDepartments(depts)
      } catch (error) {
        console.error('Failed to fetch departments:', error)
        setDepartments([])
      } finally {
        setIsLoadingDepartments(false)
      }
    }

    fetchDepartments()
  }, [])

  // Generate year options (5 years back to 2 years forward)
  const years = Array.from({ length: 8 }, (_, i) => String(currentYear - 5 + i))

  // Check if it's leap year for February
  const isLeapYear = (year: number) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  }

  // Get date range based on selected year/month
  const getDateRangeFromMonthYear = (year: string, month: string) => {
    if (!year || !month) return null
    
    const yearNum = parseInt(year)
    const monthNum = parseInt(month)
    
    let daysInMonth = MONTHS.find(m => m.value === month)?.days || 30
    
    if (month === '2') {
      daysInMonth = isLeapYear(yearNum) ? 29 : 28
    }
    
    const startDate = new Date(yearNum, monthNum - 1, 1)
    const endDate = new Date(yearNum, monthNum - 1, daysInMonth, 23, 59, 59)
    
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    }
  }

  // Build filter object for API
  const buildFilter = () => {
    const filter: Record<string, any> = {}
    
    // Add department filter
    if (filters.department) {
      filter.department = filters.department
    }
    
    // Add status filter
    if (filters.status) {
      filter.status = filters.status
    }
    
    // Add year and month as separate fields for easier extraction
    if (filters.year) {
      filter.filter_year = filters.year
    }
    
    if (filters.month) {
      filter.filter_month = filters.month
    }
    
    // Handle date filtering
    if (filters.year && filters.month) {
      const dateRange = getDateRangeFromMonthYear(filters.year, filters.month)
      if (dateRange) {
        filter.start_date_time = {
          $gte: dateRange.start,
          $lte: dateRange.end
        }
      }
    } else if (filters.customStartDate && filters.customEndDate) {
      filter.start_date_time = {
        $gte: new Date(filters.customStartDate).toISOString(),
        $lte: new Date(new Date(filters.customEndDate).setHours(23, 59, 59)).toISOString()
      }
    } else if (filters.year && !filters.month) {
      const startDate = new Date(parseInt(filters.year), 0, 1)
      const endDate = new Date(parseInt(filters.year), 11, 31, 23, 59, 59)
      
      filter.start_date_time = {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    }
    
    return Object.keys(filter).length > 0 ? filter : undefined
  }

  // Apply filter whenever any filter value changes
  useEffect(() => {
    const filter = buildFilter()
    
    updateState({
      filter: filter,
      ...initialQueryState, // initialQueryState already contains page: 1, search: '', etc.
    })
  }, [filters, updateState]) // Added updateState to dependencies

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      
      if (key === 'year' && !value) {
        newFilters.month = ''
      }
      
      if (key === 'customStartDate' || key === 'customEndDate') {
        if (key === 'customStartDate' && !value) {
          newFilters.customEndDate = ''
        }
      }
      
      return newFilters
    })
  }

  // Clear all filters
  const handleReset = () => {
    setFilters({
      department: '',
      status: '',
      year: String(currentYear),
      month: '',
      customStartDate: '',
      customEndDate: ''
    })
    
    updateState({
      filter: undefined,
      ...initialQueryState, // initialQueryState already contains page: 1, search: '', etc.
    })
  }

  // Check if any filter is active
  const hasActiveFilters = () => {
    return filters.department || 
           filters.status || 
           filters.month || 
           filters.customStartDate || 
           filters.customEndDate
  }

  return (
    <div className='d-flex align-items-end gap-4 flex-wrap'>
      {/* DEPARTMENT FILTER - DYNAMIC */}
      <div className='d-flex flex-column'>
        <label className='form-label fs-7 fw-bold text-gray-600 text-uppercase mb-2'>
          Departments
        </label>
        <select
          className='form-select form-select-solid'
          style={{ minWidth: '180px' }}
          value={filters.department}
          disabled={isLoading || isLoadingDepartments}
          onChange={(e) => handleFilterChange('department', e.target.value)}
        >
          <option value=''>All Departments</option>
          {isLoadingDepartments ? (
            <option value='' disabled>Loading departments...</option>
          ) : (
            departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.department_name}
              </option>
            ))
          )}
        </select>
        {!isLoadingDepartments && departments.length === 0 && (
          <div className='text-danger fs-8 mt-1'>No departments found</div>
        )}
      </div>

      {/* STATUS FILTER */}
      <div className='d-flex flex-column'>
        <label className='form-label fs-7 fw-bold text-gray-600 text-uppercase mb-2'>
          Status
        </label>
        <select
          className='form-select form-select-solid'
          style={{ minWidth: '150px' }}
          value={filters.status}
          disabled={isLoading}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value=''>All Status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* YEAR FILTER */}
      <div className='d-flex flex-column'>
        <label className='form-label fs-7 fw-bold text-gray-600 text-uppercase mb-2'>
          Year
        </label>
        <select
          className='form-select form-select-solid'
          style={{ minWidth: '120px' }}
          value={filters.year}
          disabled={isLoading}
          onChange={(e) => handleFilterChange('year', e.target.value)}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* MONTH FILTER */}
      <div className='d-flex flex-column'>
        <label className='form-label fs-7 fw-bold text-gray-600 text-uppercase mb-2'>
          Month
        </label>
        <select
          className='form-select form-select-solid'
          style={{ minWidth: '150px' }}
          value={filters.month}
          disabled={isLoading || !filters.year}
          onChange={(e) => handleFilterChange('month', e.target.value)}
        >
          <option value=''>All Months (Full Year)</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* CUSTOM DATE RANGE FILTER */}
      <div className='d-flex gap-2 align-items-end'>
        <div className='d-flex flex-column'>
          <label className='form-label fs-7 fw-bold text-gray-600 text-uppercase mb-2'>
            From Date
          </label>
          <input
            type='date'
            className='form-control form-control-solid'
            style={{ minWidth: '160px' }}
            value={filters.customStartDate}
            disabled={isLoading}
            onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
          />
        </div>
        <div className='d-flex flex-column'>
          <label className='form-label fs-7 fw-bold text-gray-600 text-uppercase mb-2'>
            To Date
          </label>
          <input
            type='date'
            className='form-control form-control-solid'
            style={{ minWidth: '160px' }}
            value={filters.customEndDate}
            disabled={isLoading || !filters.customStartDate}
            min={filters.customStartDate}
            onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
          />
        </div>
      </div>

      {/* RESET BUTTON */}
      {hasActiveFilters() && (
        <div className='d-flex flex-column'>
          <label className='form-label fs-7 fw-bold text-gray-600 text-uppercase mb-2'>
            &nbsp;
          </label>
          <button
            className='btn btn-light-danger btn-sm'
            onClick={handleReset}
            disabled={isLoading}
          >
            <i className='bi bi-x-circle me-2'></i>
            Reset Filter
          </button>
        </div>
      )}
    </div>
  )
}

export { UsersListFilter }