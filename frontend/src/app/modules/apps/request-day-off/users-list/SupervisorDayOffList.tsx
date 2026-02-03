// supervisor-day-off/users-list/SupervisorDayOffList.tsx
import {ListViewProvider, useListView} from './core/ListViewProvider'
import {QueryRequestProvider} from './core/QueryRequestProvider'
import {QueryResponseProvider} from './core/QueryResponseProvider'
import {UsersListHeader} from './components/header/UsersListHeader'
import {DayOffTable} from './table/DayOffTable'
// import {DayOffEditModal} from './user-edit-modal/UserEditModalForm'
import {KTCard} from '../../../../../_metronic/helpers'

const SupervisorDayOffList = () => {
  const {itemIdForUpdate} = useListView()
  return (
    <>
      <KTCard>
        <UsersListHeader />
        <DayOffTable />
      </KTCard>
      {itemIdForUpdate !== undefined && {}}
    </>
  )
}

const SupervisorDayOffListWrapper = () => (
  <QueryRequestProvider>
    <QueryResponseProvider>
      <ListViewProvider>
        <SupervisorDayOffList />
      </ListViewProvider>
    </QueryResponseProvider>
  </QueryRequestProvider>
)

export {SupervisorDayOffListWrapper}