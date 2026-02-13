import { FC } from 'react'
// import { useIntl } from 'react-intl'
import { KTIcon } from '../../../../../../../_metronic/helpers'
import { useQueryRequest } from '../../core/QueryRequestProvider'

const SalaryListHeader: FC = () => {
//   const intl = useIntl()
  const { updateState } = useQueryRequest()

  return (
    <div className="card-header border-0 pt-6">
      <div className="card-title">
        <div className="d-flex align-items-center position-relative my-1">
          <KTIcon iconName="magnifier" className="fs-3 position-absolute ms-5" />
          <input
            type="text"
            data-kt-user-table-filter="search"
            className="form-control form-control-solid w-250px ps-13"
            placeholder="Search salaries..."
            onChange={(e) => updateState({ search: e.target.value })}
          />
        </div>
      </div>

      <div className="card-toolbar">
        <div className="d-flex justify-content-end" data-kt-user-table-toolbar="base">
          {/* Add filters and actions here */}
          <button type="button" className="btn btn-light-primary me-3">
            <KTIcon iconName="filter" className="fs-2" />
            Filter
          </button>
          
          <button type="button" className="btn btn-primary">
            <KTIcon iconName="plus" className="fs-2" />
            New Salary
          </button>
        </div>
      </div>
    </div>
  )
}

export { SalaryListHeader }