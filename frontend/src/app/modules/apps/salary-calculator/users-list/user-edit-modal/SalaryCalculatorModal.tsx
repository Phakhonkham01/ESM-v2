import { useEffect } from 'react'
import {SalaryCalculatorModalContent} from './SalaryCalculatorModalContent'

interface Props {
  userId: string
  onClose: () => void
}

const SalaryCalculatorModal = ({ userId, onClose }: Props) => {
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
        id="kt_modal_salary_calculator"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered mw-800px">
          <div className="modal-content">
            <SalaryCalculatorModalContent userId={userId} onClose={onClose} />
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  )
}

export { SalaryCalculatorModal }