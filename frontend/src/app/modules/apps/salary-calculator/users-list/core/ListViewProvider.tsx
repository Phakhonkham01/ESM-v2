import { createContext, useContext, useState, ReactNode } from 'react'

export type ListViewContextProps = {
  itemIdForUpdate?: string
  setItemIdForUpdate: (id: string | undefined) => void
}

const ListViewContext = createContext<ListViewContextProps>({} as ListViewContextProps)

export const useListView = () => useContext(ListViewContext)

type Props = {
  children: ReactNode
}

const ListViewProvider = ({ children }: Props) => {
  const [itemIdForUpdate, setItemIdForUpdate] = useState<string | undefined>(undefined)

  return (
    <ListViewContext.Provider value={{ itemIdForUpdate, setItemIdForUpdate }}>
      {children}
    </ListViewContext.Provider>
  )
}

export { ListViewProvider }