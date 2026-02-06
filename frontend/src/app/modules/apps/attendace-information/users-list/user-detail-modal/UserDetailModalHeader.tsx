import {FC} from 'react'
import {KTIcon} from '../../../../../../_metronic/helpers'
import {useListView} from '../core/ListViewProvider'

const UserDetailModalHeader: FC = () => {
  const {setItemIdForDetail} = useListView()

  const closeModal = () => {
    const modalElement = document.getElementById('kt_modal_user_detail')
    if (modalElement) {
      const bootstrapModal = (window as any).bootstrap?.Modal?.getInstance(modalElement)
      if (bootstrapModal) {
        bootstrapModal.hide()
      }
    }
    setItemIdForDetail(undefined)
  }

  return (
    <div className='modal-header'>
      <h2 className='fw-bold' id='kt_modal_user_detail_label'>User Details</h2>
      <div
        className='btn btn-icon btn-sm btn-active-icon-primary'
        onClick={closeModal}
        style={{cursor: 'pointer'}}
        aria-label='Close'
      >
        <KTIcon iconName='cross' className='fs-1' />
      </div>
    </div>
  )
}

export {UserDetailModalHeader}