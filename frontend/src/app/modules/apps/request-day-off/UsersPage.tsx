import {Route, Routes, Outlet, Navigate} from 'react-router-dom'
import {PageLink, PageTitle} from '../../../../_metronic/layout/core'
import {UsersListWrapper} from './users-list/UsersList'

const usersBreadcrumbs: Array<PageLink> = [
  {
    title: 'Request Day-Off',
    path: '/apps/request-day-off',
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

const RequestDayOff = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          path='request-day-off'
          element={
            <>
              <PageTitle breadcrumbs={usersBreadcrumbs}>Request Day-Off</PageTitle>
              <UsersListWrapper />
            </>
          }
        />
      </Route>
      <Route index element={<Navigate to='/apps/request-day-off/request-day-off' />} />
    </Routes>
  )
}

export default RequestDayOff
