// supervisor-day-off/SupervisorDayOffPage.tsx
import {Route, Routes, Outlet, Navigate} from 'react-router-dom'
import {PageLink, PageTitle} from '../../../../_metronic/layout/core'
import {SupervisorDayOffListWrapper} from './users-list/SupervisorDayOffList'

const supervisorDayOffBreadcrumbs: Array<PageLink> = [
  {
    title: 'Supervisor',
    path: '/apps/supervisor-day-off',
    isSeparator: false,
    isActive: false,
  },
  {
    title: '',
    path: '',
    isSeparator: true,
    isActive: false,
  },
  {
    title: 'Day-Off Approval',
    path: '/apps/supervisor-day-off/approval',
    isSeparator: false,
    isActive: false,
  },
]

const SupervisorDayOffPage = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          path='request'
          element={
            <>
              <PageTitle breadcrumbs={supervisorDayOffBreadcrumbs}>Day-Off Approval</PageTitle>
              <SupervisorDayOffListWrapper />
            </>
          }
        />
      </Route>
      <Route index element={<Navigate to='/apps/request-day-off/request' />} />
    </Routes>
  )
}

export default SupervisorDayOffPage