/* eslint-disable react-refresh/only-export-components */
import {FC, useState, createContext, useContext, useMemo} from 'react'
import {
  ID,
  calculatedGroupingIsDisabled,
  calculateIsAllDataSelected,
  groupingOnSelect,
  initialListView,
  ListViewContextProps,
  groupingOnSelectAll,
  WithChildren,
} from '../../../../../../_metronic/helpers'
import {useQueryResponse, useQueryResponseData} from './QueryResponseProvider'

// ✅ Import Modal components
import { DayOffRequestEditModalForm } from '../user-edit-modal/UserEditModalForm'
import { DayOffRequestViewModalForm } from '../user-edit-modal/Dayoff-deatils'

const ListViewContext = createContext<ListViewContextProps>(initialListView)

const ListViewProvider: FC<WithChildren> = ({children}) => {
  const [selected, setSelected] = useState<Array<ID>>(initialListView.selected)
  const [itemIdForUpdate, setItemIdForUpdate] = useState<ID>(initialListView.itemIdForUpdate)
  const [itemIdForDetail, setItemIdForDetail] = useState<ID>(initialListView.itemIdForDetail)
  
  const {isLoading} = useQueryResponse()
  const data = useQueryResponseData()
  const disabled = useMemo(() => calculatedGroupingIsDisabled(isLoading, data), [isLoading, data])
  const isAllSelected = useMemo(() => calculateIsAllDataSelected(data, selected), [data, selected])
  
  return (
    <ListViewContext.Provider
      value={{
        selected,
        itemIdForUpdate,
        itemIdForDetail,
        setItemIdForUpdate,
        setItemIdForDetail,
        disabled,
        isAllSelected,
        onSelect: (id: ID) => {
          groupingOnSelect(id, selected, setSelected)
        },
        onSelectAll: () => {
          groupingOnSelectAll(isAllSelected, setSelected, data)
        },
        clearSelected: () => {
          setSelected([])
        },
      }}
    >
      {children}
      
      {/* ✅ Render Edit Modal เมื่อมี itemIdForUpdate */}
      {itemIdForUpdate && (
        <div className="modal fade show " >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <DayOffRequestEditModalForm />
            </div>
          </div>
        </div>
      )}
      
      {/* ✅ Render View Modal เมื่อมี itemIdForDetail */}
      {itemIdForDetail && (
        <div className="modal fade show d-block">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <DayOffRequestViewModalForm />
            </div>
          </div>
        </div>
      )}
    </ListViewContext.Provider>
  )
}

const useListView = () => useContext(ListViewContext)

export {ListViewProvider, useListView}
