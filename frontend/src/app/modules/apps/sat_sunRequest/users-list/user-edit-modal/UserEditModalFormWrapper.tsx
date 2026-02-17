import {useQuery} from 'react-query'
import {SatSunRequestEditModalForm} from './UserEditModalForm'
import {isNotEmpty, QUERIES} from '../../../../../../_metronic/helpers'
import {useListView} from '../core/ListViewProvider'
import {getSatSunRequestById} from '../core/_requests'

const SatSunRequestEditModalFormWrapper = () => {
  const {itemIdForUpdate, setItemIdForUpdate} = useListView()
  const enabledQuery: boolean = isNotEmpty(itemIdForUpdate)

  const {
    isLoading,
    data: request,
    error,
  } = useQuery(
    `${QUERIES.USERS_LIST}-sat-sun-request-${itemIdForUpdate}`,
    () => getSatSunRequestById(itemIdForUpdate),
    {
      cacheTime: 0,
      enabled: enabledQuery,
      onError: (err) => {
        setItemIdForUpdate(undefined)
        console.error(err)
      },
    }
  )

  // ── Create mode (no itemIdForUpdate) ──
  if (!itemIdForUpdate) {
    return (
      <SatSunRequestEditModalForm
        isRequestLoading={false}
        request={undefined}
      />
    )
  }

  // ── Edit mode — data loaded ──
  if (!isLoading && !error && request) {
    return (
      <SatSunRequestEditModalForm
        isRequestLoading={isLoading}
        request={request}
      />
    )
  }

  // ── Loading / error state ──
  return null
}

export {SatSunRequestEditModalFormWrapper}