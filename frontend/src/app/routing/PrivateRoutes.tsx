import { FC, lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import TopBarProgress from 'react-topbar-progress-indicator'
import { DashboardWrapper } from '../pages/dashboard/DashboardWrapper'
import { MenuTestPage } from '../pages/MenuTestPage'
import { getCSSVariableValue } from '../../_metronic/assets/ts/_utils'
import { WithChildren } from '../../_metronic/helpers'
import BuilderPageWrapper from '../pages/layout-builder/BuilderPageWrapper'


const PrivateRoutes = () => {
  const ProfilePage = lazy(() => import('../modules/profile/ProfilePage'))
  const AccountPage = lazy(() => import('../modules/accounts/AccountPage'))
  const WidgetsPage = lazy(() => import('../modules/widgets/WidgetsPage'))
  const ChatPage = lazy(() => import('../modules/apps/chat/ChatPage'))
  const UsersPage = lazy(() => import('../modules/apps/user-management/UsersPage'))
  const EventsPage = lazy(() => import('../modules/apps/event/EventsPage'))
  // Attendance
  const Attendace = lazy(() => import('../modules/apps/attendace-information/UsersPage'))
  const FieldWork = lazy(() => import('../modules/apps/field-work-information/UsersPage'))
  const Overtime = lazy(() => import('../modules/apps/overtime-information/UsersPage'))
  const DayOff = lazy(() => import('../modules/apps/day-off-information/UsersPage'))
  // End Attendance
  
  
  const RequestDayOffUser = lazy(() => import('../modules/apps/request-day-off-user/UsersPage'))
  const Salary = lazy(() => import('../modules/apps/salary-calculator/SalaryCalculationPage'))
  const SupervosorDayOffPage = lazy(() => import('../modules/apps/request-day-off/SupervisorDayOffPage'))
  
  const Request_OT_Field_Work_User = lazy(() => import('../modules/apps/request-ot-field-work-user/ReqOtAndFieldWorkUserPage'))
  
  
  
  
  return (
    <Routes>
      <Route element={<MasterLayout />}>
        {/* Redirect to Dashboard after success login/registartion */}
        <Route path='auth/*' element={<Navigate to='/dashboard' />} />
        {/* Pages */}
        <Route path='dashboard' element={<DashboardWrapper />} />
        <Route path='builder' element={<BuilderPageWrapper />} />
        <Route path='menu-test' element={<MenuTestPage />} />
        {/* Lazy Modules */}
        <Route
          path='crafted/pages/profile/*'
          element={
            <SuspensedView>
              <ProfilePage />
            </SuspensedView>
          }
        />

        <Route
          path='apps/event/*'
          element={
            <SuspensedView>
              <EventsPage />
            </SuspensedView>
          }
        />

        {/* Attendance */}
        <Route
          path='apps/overtime/*'
          element={
            <SuspensedView>
              <Overtime />
            </SuspensedView>
          }
        />  
           <Route
          path='apps/salary-management/*'
          element={
            <SuspensedView>
              <Salary />
            </SuspensedView>
          }
          
        />
        <Route
          path='apps/request-ot-field-work-user/*'
          element={
            <SuspensedView>
              <Request_OT_Field_Work_User />
            </SuspensedView>
          }
        />
                <Route
          path='apps/attendace/*'
          element={
            <SuspensedView>
              <Attendace />
            </SuspensedView>
          }
        />
        <Route
          path='apps/field-work/*'
          element={
            <SuspensedView>
              <FieldWork />
            </SuspensedView>
          }
        />
        <Route
          path='apps/day-off/*'
          element={
            <SuspensedView>
              <DayOff />
            </SuspensedView>
          }
        />

        {/* End Attendance */}

        <Route
          path='apps/request-day-off/*'
          element={
            <SuspensedView>
            <SupervosorDayOffPage/>
            </SuspensedView>
          }
        />


        <Route
          path='crafted/widgets/*'
          element={
            <SuspensedView>
              <WidgetsPage />
            </SuspensedView>
          }
        />
        <Route
          path='crafted/account/*'
          element={
            <SuspensedView>
              <AccountPage />
            </SuspensedView>
          }
        />
        <Route
          path='crafted/requestsdayoffuser/*'
          element={
            <SuspensedView>
              <RequestDayOffUser />
            </SuspensedView>
          }
        />

        <Route
          path='apps/chat/*'
          element={
            <SuspensedView>
              <ChatPage />
            </SuspensedView>
          }
        />
        <Route
          path='apps/user-management/*'
          element={
            <SuspensedView>
              <UsersPage />
            </SuspensedView>
          }
        />
        {/* Page Not Found */}
        <Route path='*' element={<Navigate to='/error/404' />} />
      </Route>
    </Routes>
  )
}

const SuspensedView: FC<WithChildren> = ({ children }) => {
  const baseColor = getCSSVariableValue('--bs-primary')
  TopBarProgress.config({
    barColors: {
      '0': baseColor,
    },
    barThickness: 1,
    shadowBlur: 5,
  })
  return <Suspense fallback={<TopBarProgress />}>{children}</Suspense>
}

export { PrivateRoutes }