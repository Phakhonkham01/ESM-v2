import { ListViewProvider, useListView } from './core/ListViewProvider'
import { QueryRequestProvider } from './core/QueryRequestProvider'
import { QueryResponseProvider } from './core/QueryResponseProvider'
import { SalaryListHeader } from './components/header/SalaryListHeader'
import { SalaryListTable } from './table/SalaryListTable'
import { SalaryDetailsModal } from './user-edit-modal/SalaryDetailsModal'
import { KTCard } from '../../../../../_metronic/helpers'

const SalaryList = () => {
  const { itemIdForUpdate } = useListView()

  return (
    <>
      <KTCard>
        <SalaryListHeader />
        <SalaryListTable />
      </KTCard>
      {itemIdForUpdate !== undefined && <SalaryDetailsModal />}
    </>
  )
}

const SalaryListWrapper = () => (
  <QueryRequestProvider>
    <QueryResponseProvider>
      <ListViewProvider>
        <SalaryList />
      </ListViewProvider>
    </QueryResponseProvider>
  </QueryRequestProvider>
)

export { SalaryListWrapper }