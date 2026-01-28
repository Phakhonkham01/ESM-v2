import {ListViewProvider, useListView} from './core/ListViewProvider'
import {QueryRequestProvider} from './core/QueryRequestProvider'
import {QueryResponseProvider} from './core/QueryResponseProvider'
import {UsersListHeader} from './components/header/UsersListHeader'
import {UsersTable} from './table/UsersTable'
import {UserEditModal} from './user-edit-modal/EventEditModal'
import {ViewDetailModal} from './table/columns/Viewdetail'
import {KTCard} from '../../../../../_metronic/helpers'
import {useAuth} from '../../../auth'

const EventsList = () => {
  const {itemIdForUpdate, itemIdForView, setItemIdForView} = useListView()
  const {currentUser} = useAuth()
  
  return (
    <>
      <KTCard>
        <UsersListHeader />
        <UsersTable />
      </KTCard>
      {itemIdForUpdate !== undefined && <UserEditModal />}
      {itemIdForView !== undefined && (
        <div className='modal fade show d-block' tabIndex={-1} role='dialog'>
          <div className='modal-dialog modal-dialog-centered modal-lg'>
            <ViewDetailModal 
              eventId={String(itemIdForView)} 
              onClose={() => setItemIdForView(undefined)}
              currentUser={currentUser}
            />
          </div>
        </div>
      )}
    </>
  )
}

const EventsListWrapper = () => (
  <QueryRequestProvider>
    <QueryResponseProvider>
      <ListViewProvider>
        <EventsList />
      </ListViewProvider>
    </QueryResponseProvider>
  </QueryRequestProvider>
)

export {EventsListWrapper}