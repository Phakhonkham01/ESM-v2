import { FC } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import Swal from 'sweetalert2'
import { KTIcon, QUERIES } from '../../../../../../../_metronic/helpers'
import { RequestData } from '../../core/_models'
import { updateRequestStatus } from '../../core/_requests'
// import { useQueryResponse } from '../../core/QueryResponseProvider'

type Props = {
  request: RequestData
}

const RequestActionsCell: FC<Props> = ({ request }) => {
//   const { query } = useQueryResponse()
  const queryClient = useQueryClient()

  const updateMutation = useMutation(
    (status: 'Accept' | 'Reject') => updateRequestStatus(request._id || request.id!, status),
    {
      onSuccess: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Request status updated successfully',
          timer: 2000,
          showConfirmButton: false,
        })
        queryClient.invalidateQueries(`${QUERIES.USERS_LIST}-supervisor-requests`)
      },
      onError: () => {
        Swal.fire('Error!', 'Failed to update request status', 'error')
      },
    }
  )

  const handleAction = async (action: 'Accept' | 'Reject') => {
    const result = await Swal.fire({
      title: `${action} Request?`,
      text: `Are you sure you want to ${action.toLowerCase()} this request?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: action === 'Accept' ? '#10B981' : '#EF4444',
      confirmButtonText: `Yes, ${action}`,
    })

    if (result.isConfirmed) {
      updateMutation.mutate(action)
    }
  }

  const isPending = request.status === 'Pending'

  return (
    <div className="d-flex gap-2">
      <button
        className="btn btn-sm btn-success"
        onClick={() => handleAction('Accept')}
        disabled={!isPending || updateMutation.isLoading}
      >
        <KTIcon iconName="check" className="fs-3" />
        Accept
      </button>
      <button
        className="btn btn-sm btn-danger"
        onClick={() => handleAction('Reject')}
        disabled={!isPending || updateMutation.isLoading}
      >
        <KTIcon iconName="cross" className="fs-3" />
        Reject
      </button>
    </div>
  )
}

export { RequestActionsCell }