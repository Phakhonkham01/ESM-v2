import { FC, useEffect } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { MenuComponent } from '../../../../../../../_metronic/assets/ts/components'
import { ID, KTIcon } from '../../../../../../../_metronic/helpers'
import { useListView } from '../../core/ListViewProvider'
import { useQueryResponse } from '../../core/QueryResponseProvider'
import { deleteHoliday } from '../../core/_requests'
import { toast } from 'react-toastify'
import { useAuth } from '../../../../../auth'

type Props = {
  holiday: {
    _id?: ID
    holiday_type: 'public' | 'private'
    user_id: string | { _id: string }
    status?: 'pending' | 'approved' | 'rejected' | string
  }
}

const EventActionsCell: FC<Props> = ({ holiday }) => {
  const { setItemIdForView, setItemIdForUpdate } = useListView()
  const { refetch } = useQueryResponse()
  const queryClient = useQueryClient()
  const { currentUser } = useAuth()

  useEffect(() => {
    MenuComponent.reinitialization()
  }, [])

  const holidayId = holiday._id as string
  const currentUserId = currentUser?._id as string

  const ownerId =
    typeof holiday.user_id === 'string'
      ? holiday.user_id
      : holiday.user_id?._id

  const isAdmin = currentUser?.role === 'admin'
  const isCEO = currentUser?.role === 'CEO'
  const isEmployee = currentUser?.role === 'employee'

  /**
   * Permission rules
   */
  const canDelete =
    (isCEO && holiday.holiday_type === 'public') ||
    (
      holiday.status !== 'approved' &&
      (
        (isAdmin && (
          holiday.holiday_type === 'public' ||
          (holiday.holiday_type === 'private' && ownerId === currentUserId)
        )) ||
        (
          isEmployee &&
          holiday.holiday_type === 'private' &&
          ownerId === currentUserId
        )
      )
    )


  const canEdit =
    isCEO ||
    (
      holiday.status !== 'approved' &&
      (
        isAdmin ||
        (
          isEmployee &&
          holiday.holiday_type === 'private' &&
          ownerId === currentUserId
        )
      )
    )

  const deleteItemMutation = useMutation(
    () => deleteHoliday(holidayId, currentUserId),
    {
      onSuccess: () => {
        toast.success('ลบวันหยุดสำเร็จ')
        queryClient.invalidateQueries(['holidays'])
        refetch()
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || 'ลบวันหยุดไม่สำเร็จ'
        )
      },
    }
  )

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    deleteItemMutation.mutate()
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setItemIdForUpdate(holidayId)
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
        {/* View Detail - แสดงให้ทุกคน */}

        <div className='menu-item px-3'>
          <a
            href='#'
            className='menu-link px-3'
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setItemIdForView(holidayId)
            }}
          >
            View Detail
          </a>
        </div>

        {/* Edit - เฉพาะ CEO และ Admin */}
        {canEdit && (
          <div className='menu-item px-3'>
            <a
              href='#'
              className='menu-link px-3'
              onClick={handleEdit}
            >
              Edit
            </a>
          </div>
        )}

        {/* Delete - เฉพาะ CEO และ Admin */}
        {canDelete && (
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
