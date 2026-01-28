import {Route, Routes, Outlet, Navigate} from 'react-router-dom'
import {PageLink, PageTitle} from '../../../../_metronic/layout/core'
import {HolidayListWrapper} from './users-list/EventsList'

const usersBreadcrumbs: Array<PageLink> = [
  {
    title: 'Holidays',
    path: '/holiday/holidays',
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

const HolidaysPage = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          path='holidays'
          element={
            <>
              <PageTitle breadcrumbs={usersBreadcrumbs}>Holidays list</PageTitle>
              <HolidayListWrapper />
            </>
          }
        />
      </Route>
      {/* <Route index element={<Navigate to='/apps/user-management/users' />} /> */}
    </Routes>
  )
}

export default HolidaysPage
