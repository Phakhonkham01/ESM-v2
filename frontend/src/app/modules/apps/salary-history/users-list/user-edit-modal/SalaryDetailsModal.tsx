import { useEffect } from 'react'
import { SalaryDetailsModalHeader } from './SalaryDetailsModalHeader'
import { SalaryDetailsModalContent } from './SalaryDetailsModalContent'

const SalaryDetailsModal = () => {
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
        id="kt_modal_salary_details"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
      >
 <div className="modal-dialog modal-dialog-centered" style={{maxWidth: '1000px', width: '100%'}}>
  <div className="modal-content">
    <SalaryDetailsModalHeader />
    {/* เอา w-900px ออกเพื่อให้เนื้อหาวิ่งตามความกว้างหลัก */}
    <div className="modal-body scroll-y mx-5 mx-xl-15 my-7"> 
      <SalaryDetailsModalContent />
    </div>
  </div>
</div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  )
}

export { SalaryDetailsModal }