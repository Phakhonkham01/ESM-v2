import { FC, useState, useMemo } from 'react'
import { KTSVG } from '../../../../../../../_metronic/helpers'
import { useQueryRequest } from '../../core/QueryRequestProvider'
import { useQueryResponse } from '../../core/QueryResponseProvider'
import { User, getDepartmentName, getPositionName } from '../../core/_models'

const UsersListHeader: FC = () => {
  const { updateState } = useQueryRequest()
  const { response } = useQueryResponse()
  const users = response || []

  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterPosition, setFilterPosition] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const departments = useMemo(() => {
    const deptSet = new Set<string>()
    users.forEach((user: User) => {
      const deptName = getDepartmentName(user)
      if (deptName && deptName !== '-') {
        deptSet.add(deptName)
      }
    })
    return Array.from(deptSet).sort()
  }, [users])

  const positions = useMemo(() => {
    const posSet = new Set<string>()
    users.forEach((user: User) => {
      const posName = getPositionName(user)
      if (posName && posName !== '-') {
        posSet.add(posName)
      }
    })
    return Array.from(posSet).sort()
  }, [users])

  const statuses = useMemo(() => {
    const statusSet = new Set<string>()
    users.forEach((user: User) => {
      if (user.status) {
        statusSet.add(user.status)
      }
    })
    return Array.from(statusSet).sort()
  }, [users])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    updateState({ search: e.target.value })
  }

  const handleClearFilters = () => {
    setFilterDepartment('all')
    setFilterPosition('all')
    setFilterStatus('all')
    updateState({ department: 'all', position: 'all', status: 'all' })
  }

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'department':
        setFilterDepartment(value)
        updateState({ department: value })
        break
      case 'position':
        setFilterPosition(value)
        updateState({ position: value })
        break
      case 'status':
        setFilterStatus(value)
        updateState({ status: value })
        break
    }
  }

  return (
    <div className="card-header border-0 pt-6">
      <div className="card-title">
        <div className="d-flex align-items-center position-relative my-1">
          <KTSVG
            path="/media/icons/duotune/general/gen021.svg"
            className="svg-icon-1 position-absolute ms-6"
          />
          <input
            type="text"
            className="form-control form-control-solid w-250px ps-15"
            placeholder="Search by name, email, department..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="card-toolbar">
        <div className="d-flex justify-content-end" data-kt-user-table-toolbar="base">
          <div className="d-flex align-items-center gap-4">
            <span className="text-muted">Filter by:</span>

            <select
              className="form-select form-select-solid w-150px"
              value={filterDepartment}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              className="form-select form-select-solid w-150px"
              value={filterPosition}
              onChange={(e) => handleFilterChange('position', e.target.value)}
            >
              <option value="all">All Positions</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>

            <select
              className="form-select form-select-solid w-150px"
              value={filterStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {(filterDepartment !== 'all' || filterPosition !== 'all' || filterStatus !== 'all') && (
              <button
                className="btn btn-sm btn-light-primary"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { UsersListHeader }