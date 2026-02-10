import { Route, Routes, Outlet, Navigate } from 'react-router-dom'
import { PageLink, PageTitle } from '../../../../_metronic/layout/core'
import { SalaryListWrapper } from './users-list/SalaryList'

const salaryBreadcrumbs: Array<PageLink> = [
  {
    title: 'Salary Management',
    path: '/apps/salary-history',
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

const SalaryManagementPage = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          index
          element={
            <>
              <PageTitle breadcrumbs={salaryBreadcrumbs}>
                Salary Management
              </PageTitle>
              <SalaryListWrapper />
            </>
          }
        />
      </Route>
      <Route index element={<Navigate to="/apps/salary-history" />} />
    </Routes>
  )
}

export default SalaryManagementPage