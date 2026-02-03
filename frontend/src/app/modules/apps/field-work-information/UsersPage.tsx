import {Route, Routes, Outlet, Navigate} from 'react-router-dom'
import {PageLink, PageTitle} from '../../../../_metronic/layout/core'
import {UsersListWrapper} from './users-list/UsersList'

const usersBreadcrumbs: Array<PageLink> = [
  {
    title: 'field-work',
    path: '/apps/field-work',
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

const FieldWork = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          path='field-work'
          element={
            <>
              <PageTitle breadcrumbs={usersBreadcrumbs}>Field Work</PageTitle>
              <UsersListWrapper />
            </>
          }
        />
      </Route>
      <Route index element={<Navigate to='/apps/field-work/field-work'/>} />
    </Routes>
  )
}

export default FieldWork
