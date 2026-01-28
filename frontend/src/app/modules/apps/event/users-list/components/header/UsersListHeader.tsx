import {useListView} from '../../core/ListViewProvider'
import {UsersListToolbar} from './UserListToolbar'
import {UsersListGrouping} from './UsersListGrouping'
import {UsersListSearchComponent} from './UsersListSearchComponent'
import {useAuth} from '../../../../../auth'
import { UsersListFilter } from './UsersListFilter'

const UsersListHeader = () => {
  const {selected} = useListView()
  const {currentUser} = useAuth()
  
  // ✅ Check if user can add events (CEO and Admin only)
  const canAddEvent = () => {
    if (!currentUser || !currentUser.role) return false
    const userRole = currentUser.role.toLowerCase()
    return userRole === 'ceo' || userRole === 'admin'
  }
  
  return (
    <div className='card-header border-0 pt-6'>
      <UsersListSearchComponent />
      {/* begin::Card toolbar */}
      <div className='card-toolbar'>
        {/* begin::Group actions */}
        <UsersListFilter/>
        {selected.length > 0 ? (
          <UsersListGrouping />
        ) : (
          // ✅ Only show toolbar (Add Event button) for CEO and Admin
          canAddEvent() && <UsersListToolbar />
        )}
        {/* end::Group actions */}
      </div>
      {/* end::Card toolbar */}
    </div>
  )
}

export {UsersListHeader}