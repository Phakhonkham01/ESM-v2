/* eslint-disable react-refresh/only-export-components */
import { FC, useState, createContext, useContext, useMemo } from 'react'
import {
  ID,
  groupingOnSelect,
  initialListView,
  ListViewContextProps,
  groupingOnSelectAll,
  WithChildren,
} from '../../../../../../_metronic/helpers'

// ✅ Import Modal components
import { DayOffRequestEditModalForm } from '../user-edit-modal/UserEditModalForm'
import { DayOffRequestViewModalForm } from '../user-edit-modal/Dayoff-deatils'
import { DayOffRequestDeleteModal } from '../user-edit-modal/UserDeleteModal'

const ListViewContext = createContext<ListViewContextProps & { refreshKey: number; refreshTable: () => void }>(
  { ...initialListView, refreshKey: 0, refreshTable: () => { } }
)

const ListViewProvider: FC<WithChildren> = ({ children }) => {
  const [selected, setSelected] = useState<Array<ID>>(initialListView.selected)
  const [itemIdForUpdate, setItemIdForUpdate] = useState<ID>(initialListView.itemIdForUpdate)
  const [itemIdForDetail, setItemIdForDetail] = useState<ID>(initialListView.itemIdForDetail)
  const [itemIdForDelete, setItemIdForDelete] = useState<ID>(initialListView.itemIdForDelete)
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshTable = () => setRefreshKey(prev => prev + 1)

  const disabled = useMemo(() => false, []) // ตัวอย่าง
  const isAllSelected = useMemo(() => false, [])

  return (
    <ListViewContext.Provider
      value={{
        selected,
        itemIdForUpdate,
        itemIdForDetail,
        itemIdForDelete,
        setItemIdForUpdate,
        setItemIdForDetail,
        setItemIdForDelete,
        disabled,
        isAllSelected,
        refreshKey,
        refreshTable,
        onSelect: (id: ID) => {
          groupingOnSelect(id, selected, setSelected)
        },
        onSelectAll: () => {
          groupingOnSelectAll(isAllSelected, setSelected, [])
        },
        clearSelected: () => setSelected([]),
      }}
    >
      {children}

      {/* Edit Modal */}
      {itemIdForUpdate && (
        <div className="">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <DayOffRequestEditModalForm
                onSuccess={() => {
                  refreshTable()            // โหลด table ใหม่
                  setItemIdForUpdate(null)  // ปิด modal
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {itemIdForDetail && (
        <div className="modal fade show d-block">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <DayOffRequestViewModalForm />
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {itemIdForDelete && (
        <div className="modal fade show d-block">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <DayOffRequestDeleteModal />
            </div>
          </div>
        </div>
      )}
    </ListViewContext.Provider>
  )
}

const useListView = () => useContext(ListViewContext)

export { ListViewProvider, useListView }