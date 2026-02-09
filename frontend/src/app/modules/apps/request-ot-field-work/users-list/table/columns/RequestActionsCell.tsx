import { FC } from 'react'
import { KTIcon } from '../../../../../../../_metronic/helpers'
import { RequestData } from '../../core/_models'
import { useListView } from '../../../users-list/core/ListViewProvider'

type Props = {
  request: RequestData
}

const RequestActionsCell: FC<Props> = ({ request }) => {
  const { setItemIdForUpdate } = useListView()

  const handleView = () => {
    setItemIdForUpdate(request._id || request.id)
  }

  return (
    <div className="d-flex justify-content-end">
      <button
        className="btn btn-sm btn-light-primary"
        onClick={handleView}
        title="View Details"
      >
        <KTIcon iconName="eye" className="fs-3" />
        View
      </button>
    </div>
  )
}

export { RequestActionsCell }