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

  if (!itemIdForUpdate) {
    return <UserEditModalForm isUserLoading={isLoading} />
  }

  if (!isLoading && !error && request) {
    return <UserEditModalForm isUserLoading={isLoading} />
  }

  return null
}

export {UserEditModalFormWrapper}