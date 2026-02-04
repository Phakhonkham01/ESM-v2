import { Route, Routes, Outlet, Navigate } from 'react-router-dom'
import { PageLink, PageTitle } from '../../../../_metronic/layout/core'
import { SupervisorRequestsListWrapper } from './users-list/SupervisorRequestsList'

const requestsBreadcrumbs: Array<PageLink> = [
  {
    title: 'Supervisor Requests',
    path: '/apps/supervisor-requests-management/requests',
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

const SupervisorRequestsPage = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          index
          element={
            <>
              <PageTitle breadcrumbs={requestsBreadcrumbs}>
                Supervisor Requests
              </PageTitle>
              <SupervisorRequestsListWrapper />
            </>
          }
        />
      </Route>
      <Route index element={<Navigate to="/apps/supervisor-requests-management/requests" />} />
    </Routes>
  )
}

export default SupervisorRequestsPage