import {useQuery} from 'react-query'
import {UserEditModalForm} from './UserEditModalForm'
import {isNotEmpty, QUERIES} from '../../../../../../_metronic/helpers'
import {useListView} from '../core/ListViewProvider'
import {getRequestById} from '../core/_requests'

const UserEditModalFormWrapper = () => {
  const {itemIdForUpdate, setItemIdForUpdate} = useListView()
  const enabledQuery: boolean = isNotEmpty(itemIdForUpdate)
  
  const {
    isLoading,
    data: request,
    error,
  } = useQuery(
    `${QUERIES.USERS_LIST}-request-${itemIdForUpdate}`,
    () => {
      return getRequestById(itemIdForUpdate)
    },
    {
      cacheTime: 0,
      enabled: enabledQuery,
      onError: (err) => {
        setItemIdForUpdate(undefined)
        console.error(err)
      },
    }
  )

  // ✅ ถ้าไม่มี itemIdForUpdate แสดง form ว่างเปล่าสำหรับ create
  if (!itemIdForUpdate) {
    return <UserEditModalForm isUserLoading={isLoading} />
  }

  // ✅ ถ้ากำลัง loading
  if (isLoading) {
    return <UserEditModalForm isUserLoading={true} />
  }

  // ✅ ถ้ามี error
  if (error) {
    return <UserEditModalForm isUserLoading={false} />
  }

  // ✅ ถ้าโหลดเสร็จและมีข้อมูล ส่ง request ไปให้ form
  if (!isLoading && request) {
    return <UserEditModalForm isUserLoading={isLoading} request={request} />
  }

  // ✅ Fallback
  return <UserEditModalForm isUserLoading={isLoading} />
}

export {UserEditModalFormWrapper}