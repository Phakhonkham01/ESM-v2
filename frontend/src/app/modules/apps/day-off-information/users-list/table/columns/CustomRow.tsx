import clsx from 'clsx'
import {FC} from 'react'
import {Row} from 'react-table'
import {User} from '../../../../user-management/users-list/core/_models'

type Props = {
  row: Row<User>
}

const CustomRow: FC<Props> = ({row}) => (
  <tr {...row.getRowProps()} key={row.id}>
    {row.cells.map((cell) => {
      return (
        <td
          {...cell.getCellProps()}
          className={clsx({'text-end min-w-100px': cell.column.id === 'actions'})}
          key={cell.column.id}
        >
          {cell.render('Cell')}
        </td>
      )
    })}
  </tr>
)

export {CustomRow}
