import clsx from 'clsx'
import { FC, PropsWithChildren } from 'react'
import { HeaderProps } from 'react-table'
import { SalaryData } from '../../core/_models'

type Props = {
  className?: string
  title?: string
  tableProps: PropsWithChildren<HeaderProps<SalaryData>>
}

const SalaryCustomHeader: FC<Props> = ({ className, title, tableProps }) => {
  return (
    <th {...tableProps.column.getHeaderProps()} className={clsx(className)}>
      {title}
    </th>
  )
}

export { SalaryCustomHeader }