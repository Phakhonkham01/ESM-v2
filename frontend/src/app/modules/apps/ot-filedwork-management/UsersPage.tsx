import {Route, Routes, Outlet, Navigate} from 'react-router-dom'
import {PageLink, PageTitle} from '../../../../_metronic/layout/core'
import {UsersListWrapper} from './users-list/UsersList'

const usersBreadcrumbs: Array<PageLink> = [
  {
    title: 'Request OT',
    path: '/apps/request-ot',
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

const RequestOT = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          path='ot'
          element={
            <>
              <PageTitle breadcrumbs={usersBreadcrumbs}>Request OT</PageTitle>
              <UsersListWrapper />
            </>
          }
        />
      </Route>
      <Route index element={<Navigate to='/apps/request-ot/ot'/>} />
    </Routes>
  )
}

export default RequestOT
