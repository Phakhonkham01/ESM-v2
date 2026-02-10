import { ListViewProvider, useListView } from '../users-list/core/ListViewProvider'
import { QueryRequestProvider } from '../users-list/core/QueryRequestProvider'
import { QueryResponseProvider } from './core/QueryResponseProvider'
import { UsersListHeader } from '../users-list/components/header/UsersListHeader'
import { SupervisorRequestsTable } from './table/SupervisorRequestsTable'
import { RequestViewModal } from './user-edit-modal/RequestViewModal'
import { KTCard } from '../../../../../_metronic/helpers'

const SupervisorRequestsList = () => {
  const { itemIdForUpdate } = useListView()

  return (
    <>
      <KTCard>
        <UsersListHeader />
        <SupervisorRequestsTable />
      </KTCard>
      {itemIdForUpdate !== undefined && <RequestViewModal />}
    </>
  )
}

const SupervisorRequestsListWrapper = () => (
  <QueryRequestProvider>
    <QueryResponseProvider>
      <ListViewProvider>
        <SupervisorRequestsList />
      </ListViewProvider>
    </QueryResponseProvider>
  </QueryRequestProvider>
)

export { SupervisorRequestsListWrapper }