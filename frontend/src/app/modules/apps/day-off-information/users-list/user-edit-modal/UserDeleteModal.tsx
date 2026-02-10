import { FC, useState } from 'react'
import { useQueryClient, useMutation } from 'react-query'
import { useListView } from '../core/ListViewProvider'
import { useQueryResponse } from '../core/QueryResponseProvider'
import { deleteDayOffRequest } from '../core/_requests' // You'll need to create this API function

const DayOffRequestDeleteModal: FC = () => {
  const { itemIdForDelete, setItemIdForDelete } = useListView()
  const { refetch } = useQueryResponse()
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)

  // Close modal handler
  const handleClose = () => {
    setItemIdForDelete(undefined)
  }

  // Delete mutation
  const deleteItem = useMutation(() => deleteDayOffRequest(itemIdForDelete), {
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['dayOffRequests'])
      refetch()
      handleClose()
    },
    onError: (error) => {
      console.error('Delete failed:', error)
      setIsDeleting(false)
    },
  })

  // Handle delete confirmation
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteItem.mutateAsync()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div className="modal-backdrop fade show" onClick={handleClose}></div>

      {/* Modal Dialog */}
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            {/* Modal Header */}
            <div className="modal-header">
              <h5 className="modal-title">Delete Day Off Request</h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                disabled={isDeleting}
                aria-label="Close"
              ></button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              <div className="text-center py-5">
                {/* Warning Icon */}
                <div className="mb-5">
                  <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
                </div>

                {/* Warning Message */}
                <h4 className="mb-3">Are you sure?</h4>
                <p className="text-muted mb-0">
                  Do you really want to delete this day off request?
                  <br />
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={handleClose}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export { DayOffRequestDeleteModal }