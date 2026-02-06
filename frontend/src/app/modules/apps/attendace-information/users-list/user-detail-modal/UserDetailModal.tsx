import { FC, useEffect } from 'react'
import { useListView } from '../core/ListViewProvider'
import { UserDetailModalHeader } from './UserDetailModalHeader'
import { UserDetailModalContent } from './UserDetailModalContent'

const UserDetailModal: FC = () => {
    const { itemIdForDetail, setItemIdForDetail } = useListView()
    console.log('🔍 UserDetailModal - itemIdForDetail:', itemIdForDetail)

    if (!itemIdForDetail) {
        console.log('❌ No itemIdForDetail - modal not rendering')
        return null
    }

    console.log('✅ Modal should be visible')
    useEffect(() => {
        if (itemIdForDetail) {
            // ✅ Open modal using Bootstrap's modal API
            const modalElement = document.getElementById('kt_modal_user_detail')
            if (modalElement) {
                const bootstrapModal = (window as any).bootstrap?.Modal
                if (bootstrapModal) {
                    const modal = new bootstrapModal(modalElement, {
                        backdrop: 'static',
                        keyboard: false
                    })
                    modal.show()

                    // ✅ Clean up when modal closes
                    modalElement.addEventListener('hidden.bs.modal', () => {
                        setItemIdForDetail(undefined)
                    })

                    return () => {
                        modal.hide()
                        // Remove backdrop if it exists
                        const backdrop = document.querySelector('.modal-backdrop')
                        if (backdrop) {
                            backdrop.remove()
                        }
                        document.body.classList.remove('modal-open')
                        document.body.style.removeProperty('overflow')
                        document.body.style.removeProperty('padding-right')
                    }
                }
            }
        }
    }, [itemIdForDetail, setItemIdForDetail])

    if (!itemIdForDetail) return null

    return (
        <div
            className='modal fade'
            id='kt_modal_user_detail'
            tabIndex={-1}
            aria-labelledby='kt_modal_user_detail_label'
            aria-hidden='true'
        >
            <div className='modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl'>
                <div className='modal-content'>
                    <UserDetailModalHeader />
                    <div className='modal-body scroll-y mx-5 mx-xl-15 my-7'>
                        <UserDetailModalContent />
                    </div>
                </div>
            </div>
        </div>
    )
}

export { UserDetailModal }