import { ListViewProvider } from '../users-list/core/ListViewProvider'
import { QueryRequestProvider } from '../users-list/core/QueryRequestProvider'
import { QueryResponseProvider } from './core/QueryResponseProvider'
import { UsersListHeader } from '../users-list/components/header/UsersListHeader'
import { SupervisorRequestsTable } from './table/SupervisorRequestsTable'
import { KTCard } from '../../../../../_metronic/helpers'

const SupervisorRequestsList = () => {
  return (
    <QueryResponseProvider>
      <ListViewProvider>
        <KTCard>
          <UsersListHeader />
          <SupervisorRequestsTable />
        </KTCard>
      </ListViewProvider>
    </QueryResponseProvider>
  )
}

const SupervisorRequestsListWrapper = () => (
  <QueryRequestProvider>
    <SupervisorRequestsList />
  </QueryRequestProvider>
)

export { SupervisorRequestsListWrapper }