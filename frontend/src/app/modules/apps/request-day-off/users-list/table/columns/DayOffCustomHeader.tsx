// supervisor-day-off/users-list/table/columns/DayOffCustomHeader.tsx
import {FC} from 'react'
import {HeaderGroup} from 'react-table'
import {DayOffItem} from '../../core/_models'

type Props = {
  tableProps: any
  title: string
  className?: string
}

const DayOffCustomHeader: FC<Props> = ({tableProps, title, className}) => {
  const { column } = tableProps

  return (
    <th
      {...column.getHeaderProps()}
      className={`${className || ''} ${
        column.canSort ? 'cursor-pointer select-none' : ''
      }`}
      onClick={() => {
        if (column.canSort) {
          column.toggleSortOrder()
        }
      }}
    >
      {title}
      {column.canSort && (
        <span className="svg-icon svg-icon-2 ml-1">
          {column.isSorted ? (
            column.isSortedDesc ? (
              <i className="fas fa-sort-down"></i>
            ) : (
              <i className="fas fa-sort-up"></i>
            )
          ) : (
            <i className="fas fa-sort"></i>
          )}
        </span>
      )}
    </th>
  )
}

export {DayOffCustomHeader}