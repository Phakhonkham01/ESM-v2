import {Route, Routes, Outlet, Navigate} from 'react-router-dom'
import {PageLink, PageTitle} from '../../../../_metronic/layout/core'
import {EventsListWrapper} from './users-list/EventsList'

const usersBreadcrumbs: Array<PageLink> = [
  {
    title: 'Requests',
    path: '/requests',
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
          path=''
          element={
            <>
              <PageTitle breadcrumbs={usersBreadcrumbs}>Requests list</PageTitle>
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
