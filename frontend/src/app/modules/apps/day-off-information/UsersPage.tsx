import {Route, Routes, Outlet, Navigate} from 'react-router-dom'
import {PageLink, PageTitle} from '../../../../_metronic/layout/core'
import {UsersListWrapper} from './users-list/UsersList'

const usersBreadcrumbs: Array<PageLink> = [
  {
    title: 'Day-Off',
    path: '/apps/day-off',
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

const DayOff = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          path='day-off'
          element={
            <>
              <PageTitle breadcrumbs={usersBreadcrumbs}>Day-Off</PageTitle>
              <UsersListWrapper />
            </>
          }
        />
      </Route>
      <Route index element={<Navigate to='/apps/day-off/day-off' />} />
    </Routes>
  )
}

export default DayOff
