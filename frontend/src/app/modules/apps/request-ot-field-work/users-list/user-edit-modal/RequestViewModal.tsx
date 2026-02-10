import { useEffect } from 'react'
import { RequestViewModalHeader } from './RequestViewModalHeader'
import { RequestViewModalContent } from './RequestViewModalContent'

const RequestViewModal = () => {
  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [])

  return (
    <>
      <div
        className="modal fade show d-block"
        id="kt_modal_view_request"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered mw-800px">
          <div className="modal-content">
            <RequestViewModalHeader />
            <div className="modal-body scroll-y mx-5 mx-xl-15 my-7">
              <RequestViewModalContent />
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  )
}

export { RequestViewModal }