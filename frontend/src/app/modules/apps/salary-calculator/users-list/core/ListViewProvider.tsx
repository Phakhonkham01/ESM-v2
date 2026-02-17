import { createContext, useContext, useState, ReactNode } from 'react'

export type ListViewContextProps = {
  itemIdForUpdate?: string
  setItemIdForUpdate: (id: string | undefined, step?: number) => void  // ✅ เพิ่ม step parameter
  // ✅ เพิ่มสำหรับ Step 5
  itemIdForStep5?: string
  setItemIdForStep5: (id: string | undefined) => void
  // ✅ เพิ่ม initialStep
  initialStep: number
}

const ListViewContext = createContext<ListViewContextProps>({} as ListViewContextProps)

export const useListView = () => useContext(ListViewContext)

type Props = {
  children: ReactNode
}

const ListViewProvider = ({ children }: Props) => {
  const [itemIdForUpdate, setItemIdForUpdateState] = useState<string | undefined>(undefined)
  const [itemIdForStep5, setItemIdForStep5State] = useState<string | undefined>(undefined)
  const [initialStep, setInitialStep] = useState<number>(0)

  // ✅ ฟังก์ชันสำหรับเปิด modal พร้อม step
  const setItemIdForUpdate = (id: string | undefined, step: number = 0) => {
    setItemIdForUpdateState(id)
    setInitialStep(step)
    // ถ้าเป็น step อื่นที่ไม่ใช่ 4 ให้ clear step5
    if (step !== 4) {
      setItemIdForStep5State(undefined)
    }
  }

  // ✅ ฟังก์ชันสำหรับเปิด Step 5 โดยตรง
  const setItemIdForStep5 = (id: string | undefined) => {
    setItemIdForStep5State(id)
    setItemIdForUpdateState(id)
    setInitialStep(4) // Step 5 = index 4
  }

  return (
    <ListViewContext.Provider 
      value={{ 
        itemIdForUpdate, 
        setItemIdForUpdate,
        itemIdForStep5,
        setItemIdForStep5,
        initialStep
      }}
    >
      {children}
    </ListViewContext.Provider>
  )
}

export { ListViewProvider }