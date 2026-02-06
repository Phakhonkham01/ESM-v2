
import { FC, useEffect } from 'react'
import { MenuComponent } from '../../../../../../../_metronic/assets/ts/components'
import { ID, KTIcon } from '../../../../../../../_metronic/helpers'
import { useListView } from '../../core/ListViewProvider'

type Props = {
  id: ID
}

const UserActionsCell: FC<Props> = ({ id }) => {
  const { setItemIdForUpdate } = useListView()

  useEffect(() => {
    MenuComponent.reinitialization()
  }, [])

  const openEditModal = () => {
    setItemIdForUpdate(id)
  }

  return (
    <>
      <a
        href='#'
        className='btn btn-light-primary btn-sm me-2'
        onClick={openEditModal}
      >
        <KTIcon iconName='eye' className='fs-3' />
        Detail
      </a>

    </>
  )
}

export { UserActionsCell }
