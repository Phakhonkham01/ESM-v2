import { FC, useEffect } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { MenuComponent } from '../../../../../../../_metronic/assets/ts/components'
import { ID, KTIcon } from '../../../../../../../_metronic/helpers'
import { useListView } from '../../core/ListViewProvider'
import { useQueryResponse } from '../../core/QueryResponseProvider'
import { deleteEvent } from '../../core/_requests'
import { toast } from 'react-toastify'
import { useAuth } from '../../../../../auth'

type Props = {
  id: ID
}

const EventActionsCell: FC<Props> = ({ id }) => {
  const { setItemIdForUpdate, setItemIdForView } = useListView()
  const { refetch } = useQueryResponse()
  const queryClient = useQueryClient()
  const { currentUser } = useAuth()

  useEffect(() => {
    MenuComponent.reinitialization()
  }, [])

  const openEditModal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (id) {
      setItemIdForUpdate(id)
    } else {
      console.error('❌ No ID provided')
    }
  }

  const openViewModal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (id) {
      setItemIdForView(id)
    } else {
      console.error('❌ No ID provided')
    }
  }

  const deleteItemMutation = useMutation(
    () => {
      console.log('🗑️ Deleting event with ID:', id)
      if (!id) {
        throw new Error('Invalid event ID')
      }
      return deleteEvent(id)
    },
    {
      onSuccess: () => {
        console.log('✅ Delete successful')
        toast.success('ลบ Event สำเร็จ')
        queryClient.invalidateQueries(['events'])
        refetch()
      },
      onError: (error: any) => {
        console.error('❌ Delete error:', error)
        const errorMessage = error.response?.data?.message || error.message || 'ลบ Event ไม่สำเร็จ'
        toast.error(errorMessage)
      },
    }
  )

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🗑️ Delete clicked for ID:', id)

    if (!id) {
      console.error('❌ No ID provided')
      toast.error('Invalid event ID')
      return
    }

    await deleteItemMutation.mutateAsync()
  }

  // ✅ ตรวจสอบว่า user สามารถทำอะไรได้บ้าง
  const getPermissions = () => {
    // ถ้าไม่มี user หรือไม่มี ID ไม่ให้แสดงอะไรเลย
    if (!currentUser || !id) {
      return { canView: false, canEdit: false, canDelete: false }
    }
    
    // ✅ ตั้งค่าให้ทุกคนเห็นแค่ View Detail เท่านั้น
    return {
      canView: true,    // ทุกคนดูได้
      canEdit: false,   // ไม่มีใครแก้ไขได้
      canDelete: false  // ไม่มีใครลบได้
    }
  }
  
  const permissions = getPermissions()

  console.log('👤 User Permissions:', {
    user: currentUser?.role,
    id,
    permissions
  })

  // ถ้าไม่มี permission ใดๆ เลย ไม่ต้องแสดง dropdown
  if (!permissions.canView && !permissions.canEdit && !permissions.canDelete) {
    return (
      <span className="text-muted fs-7">No Access</span>
    )
  }

  // ถ้ามีแค่ View Detail ให้แสดงปุ่ม View Detail โดยตรง (ไม่ต้องมี dropdown)
  if (permissions.canView && !permissions.canEdit && !permissions.canDelete) {
    return (
      <button
        className='btn btn-light btn-active-light-primary btn-sm'
        onClick={openViewModal}
      >
        View Detail
      </button>
    )
  }

  // ถ้ามี action มากกว่า 1 อย่างให้แสดง dropdown
  return (
    <>
      <a  
        href='#'
        className='btn btn-light btn-active-light-primary btn-sm'
        data-kt-menu-trigger='click'
        data-kt-menu-placement='bottom-end'
        onClick={(e) => e.preventDefault()}
      >
        Actions
        <KTIcon iconName='down' className='fs-5 m-0' />
      </a>

      <div
        className='menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-bold fs-7 w-125px py-4'
        data-kt-menu='true'
      >
        {/* ✅ View Detail - แสดงให้ทุกคน */}
        {permissions.canView && (
          <div className='menu-item px-3'>
            <a 
              href='#'
              className='menu-link px-3' 
              onClick={openViewModal}
            >
              View Detail
            </a>
          </div>
        )}

        {/* ✅ Edit - ไม่แสดงให้ใคร (ถ้าอยากให้ CEO/Admin แก้ไขได้ ให้เปิดตรงนี้) */}
        {permissions.canEdit && (
          <div className='menu-item px-3'>
            <a 
              href='#'
              className='menu-link px-3' 
              onClick={openEditModal}
            >
              Edit
            </a>
          </div>
        )}

        {/* ✅ Delete - ไม่แสดงให้ใคร (ถ้าอยากให้ CEO/Admin ลบได้ ให้เปิดตรงนี้) */}
        {permissions.canDelete && (
          <div className='menu-item px-3'>
            <a 
              href='#'
              className='menu-link px-3'
              onClick={handleDelete}
            >
              Delete
            </a>
          </div>
        )}
      </div>
    </>
  )
}

export { EventActionsCell }