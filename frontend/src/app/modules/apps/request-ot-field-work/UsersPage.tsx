import {Route, Routes, Outlet, Navigate} from 'react-router-dom'
import {PageLink, PageTitle} from '../../../../_metronic/layout/core'
import {UsersListWrapper} from './users-list/UsersList'

const usersBreadcrumbs: Array<PageLink> = [
  {
    title: 'Request OT/Field Work',
    path: '/apps/request-ot-and-field_work',
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

const Request = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          path='request'
          element={
            <>
              <PageTitle breadcrumbs={usersBreadcrumbs}>Request OT/Field Work</PageTitle>
              <UsersListWrapper />
            </>
          }
        />
      </Route>

      <Route
        index
        element={<Navigate to='/apps/request-ot-and-field_work/request' />}
      />
    </Routes>
  )
}

export default Request
