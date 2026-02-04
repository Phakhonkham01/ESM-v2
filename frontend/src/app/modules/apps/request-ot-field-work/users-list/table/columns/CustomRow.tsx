import clsx from 'clsx'
import {FC} from 'react'
import {Row} from 'react-table'
import { RequestData } from '../../core/_models'

type Props = {
  row: Row<RequestData>
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
