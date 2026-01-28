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

  // ✅ ตรวจสอบ role และกำหนด permissions
  const userRole = currentUser?.role
  
  const getRolePermissions = () => {
    if (!userRole) {
      return { canView: false, canEdit: false, canDelete: false }
    }
    
    const roleLower = userRole.toLowerCase()
    
    // ✅ Employee: View Detail เท่านั้น
    if (roleLower === 'employee') {
      return {
        canView: true,
        canEdit: false,
        canDelete: false
      }
    }
    
    // ✅ Admin: View Detail + Edit + Delete
    if (roleLower === 'admin') {
      return {
        canView: true,
        canEdit: true,
        canDelete: true
      }
    }
    
    // ✅ CEO: Edit + Delete เท่านั้น (ไม่มี View Detail)
    if (roleLower === 'ceo') {
      return {
        canView: false,
        canEdit: true,
        canDelete: true
      }
    }
    
    // Default: ไม่เห็นอะไรเลย
    return { canView: false, canEdit: false, canDelete: false }
  }
  
  const permissions = getRolePermissions()

  console.log('👤 User Permissions:', {
    role: userRole,
    permissions
  })

  // ถ้าไม่มี permission ใดๆ เลย ไม่ต้องแสดง dropdown
  if (!permissions.canView && !permissions.canEdit && !permissions.canDelete) {
    return (
      <span className="text-muted fs-7">No Access</span>
    )
  }

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
        {/* ✅ View Detail: Employee & Admin */}
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

        {/* ✅ Edit: CEO & Admin */}
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

        {/* ✅ Delete: CEO & Admin */}
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