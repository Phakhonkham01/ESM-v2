import {Route, Routes, Outlet, Navigate} from 'react-router-dom'
import {PageLink, PageTitle} from '../../../../_metronic/layout/core'
import {UsersListWrapper} from './users-list/UsersList'

const usersBreadcrumbs: Array<PageLink> = [
  {
    title: 'attendace',
    path: '/apps/attendace',
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

const Attendace = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          path='attendace'
          element={
            <>
              <PageTitle breadcrumbs={usersBreadcrumbs}>Attendace</PageTitle>
              <UsersListWrapper />
            </>
          }
        />
      </Route>
      <Route index element={<Navigate to='/apps/attendace/attendace'/>} />
    </Routes>
  )
}

export default Attendace
