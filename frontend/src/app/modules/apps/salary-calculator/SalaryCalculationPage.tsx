import { Route, Routes, Outlet, Navigate } from 'react-router-dom'
import { PageLink, PageTitle } from '../../../../_metronic/layout/core'
import { SalaryListWrapper } from './users-list/SalaryList'

const salaryBreadcrumbs: Array<PageLink> = [
  {
    title: 'Salary Calculation',
    path: '/apps/salary-calculation',
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
          index
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
      <Route index element={<Navigate to="/apps/salary-calculation" />} />
    </Routes>
  )
}

export default SalaryCalculationPage