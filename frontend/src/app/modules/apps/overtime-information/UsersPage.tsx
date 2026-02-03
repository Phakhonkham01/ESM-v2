import {Route, Routes, Outlet, Navigate} from 'react-router-dom'
import {PageLink, PageTitle} from '../../../../_metronic/layout/core'
import {UsersListWrapper} from './users-list/UsersList'

const usersBreadcrumbs: Array<PageLink> = [
  {
    title: 'overtime',
    path: '/apps/overtime',
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

const Overtime = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          path='overtime'
          element={
            <>
              <PageTitle breadcrumbs={usersBreadcrumbs}>Overtime</PageTitle>
              <UsersListWrapper />
            </>
          }
        />
      </Route>
      <Route index element={<Navigate to='/apps/overtime/overtime'/>} />
    </Routes>
  )
}

export default Overtime
