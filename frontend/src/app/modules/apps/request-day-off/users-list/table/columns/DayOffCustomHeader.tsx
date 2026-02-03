import clsx from 'clsx'
import { FC, PropsWithChildren } from 'react'
import { HeaderProps } from 'react-table'
import { DayOffRequest } from '../../core/_models'

type Props = {
  className?: string
  title?: string
  tableProps: PropsWithChildren<HeaderProps<DayOffRequest>>
}

const DayOffCustomHeader: FC<Props> = ({ className, title, tableProps }) => {
  return (
    <th {...tableProps.column.getHeaderProps()} className={clsx(className)}>
      {title}
    </th>
  )
}

export { DayOffCustomHeader }