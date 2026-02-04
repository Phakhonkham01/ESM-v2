import {Route, Routes, Outlet, Navigate} from 'react-router-dom'
import {PageLink, PageTitle} from '../../../../_metronic/layout/core'
import {DayoffrequestsListWrapper} from './day-off-requests/DayoffrequestsList'

const usersBreadcrumbs: Array<PageLink> = [
  {
    title: 'Request Day-Off',
    path: 'crafted/',
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

const RequestDayOffUser = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          path='requestsdayoffuser'
          element={
            <>
              <PageTitle breadcrumbs={usersBreadcrumbs}>Request Day-Off-user</PageTitle>
              <DayoffrequestsListWrapper />
            </>
          }
        />
      </Route>
      <Route index element={<Navigate to='/crafted/requestsdayoffuser' />} />
    </Routes>
  )
}

export default RequestDayOffUser
