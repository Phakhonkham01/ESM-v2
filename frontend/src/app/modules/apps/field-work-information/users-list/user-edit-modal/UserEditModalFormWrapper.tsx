import {useQuery} from 'react-query'
import {RequestOTFieldWorkViewModal} from './UserEditModalForm'
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

  // กรณีสร้างใหม่ (ไม่มี itemIdForUpdate)
  if (!itemIdForUpdate) {
    return <RequestOTFieldWorkViewModal isUserLoading={false} request={undefined} />
  }

  // กรณีกำลังโหลดข้อมูล
  if (isLoading) {
    return <RequestOTFieldWorkViewModal isUserLoading={true} request={undefined} />
  }

  // กรณีมี error
  if (error) {
    return null
  }

  // กรณีโหลดสำเร็จและมีข้อมูล
  if (request) {
    return <RequestOTFieldWorkViewModal isUserLoading={false} request={request} />
  }

  return null
}

export {UserEditModalFormWrapper}