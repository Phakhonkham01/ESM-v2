import { useQuery } from 'react-query'
import { DayOffRequestEditModalForm } from './UserEditModalForm'
import { isNotEmpty, QUERIES } from '../../../../../../_metronic/helpers'
import { useListView } from '../core/ListViewProvider'
import { getDayOffRequestById } from '../core/_requests'

const UserEditModalFormWrapper = () => {
  const { itemIdForUpdate, setItemIdForUpdate } = useListView()
  const enabledQuery: boolean = isNotEmpty(itemIdForUpdate)

  const {
    isLoading,
    data: user,
    error,
  } = useQuery(
    `${QUERIES.USERS_LIST}-user-${itemIdForUpdate}`,
    () => getDayOffRequestById(itemIdForUpdate),
    {
      cacheTime: 0,
      enabled: enabledQuery,
      onError: (err) => {
        setItemIdForUpdate(undefined)
        console.error('Error fetching user:', err)
      },
    }
  )

  // กรณีสร้างใหม่ (ไม่มี itemIdForUpdate)
  if (!itemIdForUpdate) {
    return <DayOffRequestEditModalForm />
  }

  // กรณีกำลังโหลดข้อมูล
  if (isLoading) {
    return <DayOffRequestEditModalForm />
  }

  // กรณีมี error
  if (error) {
    return null
  }

  // กรณีโหลดสำเร็จและมีข้อมูล
  if (user) {
    return <DayOffRequestEditModalForm />
  }

  return null
}

export { UserEditModalFormWrapper }