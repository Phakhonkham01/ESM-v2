import clsx from 'clsx'
import {FC} from 'react'
import {Row} from 'react-table'

type Props<T extends object> = {
  row: Row<T>
}

const CustomRow = <T extends object>({row}: Props<T>) => (
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