import {FC, useEffect} from 'react'
import {useMutation, useQueryClient} from 'react-query'
import {MenuComponent} from '../../../../../../../_metronic/assets/ts/components'
import {ID, KTIcon, QUERIES} from '../../../../../../../_metronic/helpers'
import {useListView} from '../../core/ListViewProvider'
import {useQueryResponse} from '../../core/QueryResponseProvider'
import {deleteDayOffRequest} from '../../core/_requests' // เปลี่ยนเป็นฟังก์ชันลบของ day off requests

type Props = {
  id: ID
  status?: string // เพิ่ม prop สำหรับเช็คสถานะ
}

const DayOffRequestActionsCell: FC<Props> = ({id, status = 'Pending'}) => {
  const {setItemIdForUpdate} = useListView()
  const {query} = useQueryResponse()
  const queryClient = useQueryClient()

  useEffect(() => {
    MenuComponent.reinitialization()
  }, [])

  const openEditModal = () => {
    setItemIdForUpdate(id)
  }

  const deleteItem = useMutation(() => deleteDayOffRequest(id), {
    onSuccess: () => {
      queryClient.invalidateQueries([`${QUERIES.DAY_OFF_REQUESTS_LIST}-${query}`])
    },
  })

  return (
    <>
      <a
        href='#'
        className='btn btn-light btn-active-light-primary btn-sm'
        data-kt-menu-trigger='click'
        data-kt-menu-placement='bottom-end'
      >
        Actions
        <KTIcon iconName='down' className='fs-5 m-0' />
      </a>
      {/* begin::Menu */}
      <div
        className='menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-bold fs-7 w-125px py-4'
        data-kt-menu='true'
      >
        {/* begin::Menu item */}
        <div className='menu-item px-3'>
          <a className='menu-link px-3' onClick={openEditModal}>
            Edit
          </a>
        </div>
        {/* end::Menu item */}

        {/* เฉพาะสถานะ Pending ถึงจะแสดง Edit และ Delete */}
        {status === 'Pending' && (
          <>
            {/* begin::Menu item */}
            <div className='menu-item px-3'>
              <a className='menu-link px-3' onClick={openEditModal}>
                Edit
              </a>
            </div>
            {/* end::Menu item */}

            {/* begin::Menu item */}
            <div className='menu-item px-3'>
              <a
                className='menu-link px-3'
                data-kt-users-table-filter='delete_row'
                onClick={async () => await deleteItem.mutateAsync()}
              >
                Delete
              </a>
            </div>
            {/* end::Menu item */}
          </>
        )}
      </div>
      {/* end::Menu */}
    </>
  )
}

export {DayOffRequestActionsCell}