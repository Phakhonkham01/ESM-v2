import { FC } from 'react'
import { KTIcon } from '../../../../../../../_metronic/helpers'
import { DayOffRequest } from '../../core/_models'
import { useListView } from '../../core/ListViewProvider'

type Props = {
  dayOff: DayOffRequest
}

const DayOffActionsCell: FC<Props> = ({ dayOff }) => {
  const { setItemIdForUpdate } = useListView() // ✅ ใช้ ListViewProvider

  const handleView = () => {
    setItemIdForUpdate(dayOff._id || dayOff.id) // ✅ Set ID เพื่อเปิด Modal
  }

  return (
    <div className="d-flex justify-content-end gap-2">
      {/* View Button */}
      <button
        className="btn btn-sm btn-light-primary"
        onClick={handleView}
        title="View Details"
      >
        <KTIcon iconName="eye" className="fs-4" />
        View
      </button>
    </div>
  )
}

export { DayOffActionsCell }  