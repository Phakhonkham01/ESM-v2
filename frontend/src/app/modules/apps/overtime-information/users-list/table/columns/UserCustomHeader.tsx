import clsx from 'clsx'
import {FC, PropsWithChildren, useMemo} from 'react'
import {HeaderProps} from 'react-table'
import {initialQueryState} from '../../../../../../../_metronic/helpers'
import {useQueryRequest} from '../../core/QueryRequestProvider'
import {User} from '../../core/_models'

type Props = {
  className?: string
  title: string
  tableProps: PropsWithChildren<HeaderProps<User>>
}

const NON_SORTABLE_COLUMNS = ['actions', 'selection']

const UserCustomHeader: FC<Props> = ({className, title, tableProps}) => {
  const columnId = tableProps.column.id
  const {state, updateState} = useQueryRequest()

  const isSorted = useMemo(
    () => state.sort === columnId,
    [state.sort, columnId]
  )

  const order = state.order

  const handleSort = () => {
    if (NON_SORTABLE_COLUMNS.includes(columnId)) return

    if (!isSorted) {
      updateState({
        ...initialQueryState,
        sort: columnId,
        order: 'asc',
      })
      return
    }

    if (order === 'asc') {
      updateState({
        ...initialQueryState,
        sort: columnId,
        order: 'desc',
      })
      return
    }

    updateState({
      ...initialQueryState,
      sort: undefined,
      order: undefined,
    })
  }

  return (
    <th
      {...tableProps.column.getHeaderProps()}
      className={clsx(
        className,
        isSorted && order && `table-sort-${order}`
      )}
      onClick={handleSort}
      style={{cursor: 'pointer'}}
    >
      {title}
    </th>
  )
}

export {UserCustomHeader}
