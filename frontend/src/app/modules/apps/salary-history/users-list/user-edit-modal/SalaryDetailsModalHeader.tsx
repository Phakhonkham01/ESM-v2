import { FC } from 'react'
import { KTIcon } from '../../../../../../_metronic/helpers'
import { useListView } from '../core/ListViewProvider'

const SalaryDetailsModalHeader: FC = () => {
  const { setItemIdForUpdate } = useListView()

  return (
    <div className="modal-header">
      <h2 className="fw-bold">Salary Details</h2>
      <div
        className="btn btn-icon btn-sm btn-active-icon-primary"
        onClick={() => setItemIdForUpdate(undefined)}
        style={{ cursor: 'pointer' }}
      >
        <KTIcon iconName="cross" className="fs-1" />
      </div>
    </div>
  )
}

export { SalaryDetailsModalHeader }