import { useEffect } from 'react'
import { DayOffViewModalHeader } from './DayOffViewModalHeader'
import { DayOffViewModalContent } from './DayOffViewModalContent'

const DayOffViewModal = () => {
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
        id="kt_modal_view_dayoff"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
      >
        {/* Modal dialog */}
        <div className="modal-dialog modal-dialog-centered mw-800px">
          {/* Modal content */}
          <div className="modal-content">
            <DayOffViewModalHeader />
            
            {/* Modal body */}
            <div className="modal-body scroll-y mx-5 mx-xl-15 my-7">
              <DayOffViewModalContent />
            </div>
            {/* end::Modal body */}
          </div>
          {/* end::Modal content */}
        </div>
        {/* end::Modal dialog */}
      </div>
      
      {/* Modal Backdrop */}
      <div className="modal-backdrop fade show"></div>
    </>
  )
}

export { DayOffViewModal }