import {Route, Routes, Outlet} from 'react-router-dom'
import {PageLink, PageTitle} from '../../../../_metronic/layout/core'
import {EventsListWrapper} from './users-list/EventsList'

const usersBreadcrumbs: Array<PageLink> = [
  {
    title: 'User',
    path: '/user/user-profile',
    isSeparator: false,
    isActive: false,
  },
  {
    title: '',
    path: '',
    isSeparator: true,
    isActive: false,
  },
]

const UsersPage = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          path='user-profile'
          element={
            <>
              <PageTitle breadcrumbs={usersBreadcrumbs}>User Profile</PageTitle>
              <EventsListWrapper />
            </>
          }
        />
      </Route>
      {/* <Route index element={<Navigate to='/apps/user-management/users' />} /> */}
    </Routes>
  )
}

export default UsersPage
