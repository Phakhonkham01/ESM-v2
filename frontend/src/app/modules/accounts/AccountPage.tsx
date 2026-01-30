import React from 'react'
import {Navigate, Outlet, Route, Routes} from 'react-router-dom'
import {PageLink, PageTitle} from '../../../_metronic/layout/core'
import {Overview} from './components/overview/Overview'
import {Settings} from './components/settings/Settings'
import {AccountHeader} from './AccountHeader'
import Profile from './components/profile/Profile'
import ViewPaySlip from './components/viewpayslip/ViewPaySlip'

const accountBreadCrumbs: Array<PageLink> = [
  {
    title: '',
    path: '/crafted/account/overview',
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

const AccountPage: React.FC = () => {
  return (
    <Routes>
      <Route
        element={
          <>
            <AccountHeader />
            <Outlet />
          </>
        }
      >
        <Route
          path='overview'
          element={
            <>
              {/* <PageTitle>Overview</PageTitle> */}
              <Overview />
            </>
          }
        />
        <Route
        path='profile'
        element={
          <>
          <Profile/>
          </>
        }
        />
        <Route
        path='viewpayslip'
        element={
          <>
          <ViewPaySlip/>
          </>
        }
        />
        <Route
          path='settings'
          element={
            <>
              <PageTitle breadcrumbs={accountBreadCrumbs}>Settings</PageTitle>
              <Settings />
            </>
          }
        />
        <Route index element={<Navigate to='/crafted/account/user-profile' />} />
      </Route>
    </Routes>
  )
}

export default AccountPage
