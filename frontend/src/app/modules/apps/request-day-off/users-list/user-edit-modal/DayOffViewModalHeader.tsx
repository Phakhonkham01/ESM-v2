import { FC } from 'react'
import { KTIcon } from '../../../../../../_metronic/helpers'
import { useListView } from '../core/ListViewProvider'

const DayOffViewModalHeader: FC = () => {
  const { setItemIdForUpdate } = useListView()

  return (
    <div className="modal-header">
      {/* Title */}
      <h2 className="fw-bold">Day Off Request Details</h2>

      {/* Close button */}
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

export { DayOffViewModalHeader }