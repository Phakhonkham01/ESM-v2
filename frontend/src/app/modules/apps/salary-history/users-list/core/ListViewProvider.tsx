import { FC, createContext, useContext, useState } from 'react'
import { WithChildren } from '../../../../../../_metronic/helpers'

export interface ListViewContextProps {
  itemIdForUpdate?: string
  setItemIdForUpdate: (id?: string) => void
}

const initialListView: ListViewContextProps = {
  itemIdForUpdate: undefined,
  setItemIdForUpdate: () => {},
}

const ListViewContext = createContext<ListViewContextProps>(initialListView)

const ListViewProvider: FC<WithChildren> = ({ children }) => {
  const [itemIdForUpdate, setItemIdForUpdate] = useState<string | undefined>(initialListView.itemIdForUpdate)

  return (
    <ListViewContext.Provider
      value={{
        itemIdForUpdate,
        setItemIdForUpdate,
      }}
    >
      {children}
    </ListViewContext.Provider>
  )
}

const useListView = () => useContext(ListViewContext)

export { ListViewProvider, useListView }