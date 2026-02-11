import { ListViewProvider } from './core/ListViewProvider'
import { QueryRequestProvider } from './core/QueryRequestProvider'
import { QueryResponseProvider } from './core/QueryResponseProvider'
import { UsersListHeader } from './components/header/UsersListHeader'
import { SalaryListTable } from './table/SalaryListTable'
import { SalaryCalculatorModal } from './user-edit-modal/SalaryCalculatorModal'
import { useListView } from './core/ListViewProvider'
import { KTCard } from '../../../../../_metronic/helpers'
import { useState } from 'react'
import { User } from './core/_models'

const SalaryList = () => {
  // FIX: also grab setItemIdForUpdate so we can actually clear it on close
  const { itemIdForUpdate, setItemIdForUpdate } = useListView()

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleCloseModal = () => {
    setShowConfirmDialog(false)
    setSelectedUser(null)
  }

  return (
    <>
      <KTCard>
        <UsersListHeader />
        <SalaryListTable />
      </KTCard>

      {showConfirmDialog && selectedUser && (
        <div
          className="modal fade show d-block"
          id="kt_modal_confirm_calculation"
          role="dialog"
          tabIndex={-1}
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered mw-500px">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="fw-bold">Confirm Salary Calculation</h2>
                <div
                  className="btn btn-icon btn-sm btn-active-icon-primary"
                  onClick={handleCloseModal}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="ki-duotone ki-cross fs-1">
                    <span className="path1"></span>
                    <span className="path2"></span>
                  </i>
                </div>
              </div>
              <div className="modal-body py-10 px-lg-17">
                {/* Confirmation dialog content */}
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}

      {itemIdForUpdate && (
        <SalaryCalculatorModal
          userId={itemIdForUpdate}
          // FIX: was () => {} (empty, did nothing).
          // Now clears itemIdForUpdate → modal unmounts → backdrop disappears automatically.
          onClose={() => setItemIdForUpdate(undefined)}
        />
      )}
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