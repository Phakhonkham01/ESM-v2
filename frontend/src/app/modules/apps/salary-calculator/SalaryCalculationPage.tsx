import { Route, Routes, Outlet, Navigate } from 'react-router-dom'
import { PageLink, PageTitle } from '../../../../_metronic/layout/core'
import { SalaryListWrapper } from './users-list/SalaryList'

const salaryBreadcrumbs: Array<PageLink> = [
  {
    title: 'Salary Calculation',
    path: '/apps/salary-management/salarylist',
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

const SalaryCalculationPage = () => {
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          path='salarylist'
          element={
            <>
              <PageTitle breadcrumbs={salaryBreadcrumbs}>
                Employee Salary Calculation
              </PageTitle>
              <SalaryListWrapper />
            </>
          }
        />
      </Route>
      <Route index element={<Navigate to="/apps/salary-management/" />} />
    </Routes>
  )
}

export default SalaryCalculationPage