import clsx from 'clsx'
import { FC, PropsWithChildren } from 'react'
import { HeaderProps } from 'react-table'
import { RequestData } from '../../core/_models'

type Props = {
  className?: string
  title?: string
  tableProps: PropsWithChildren<HeaderProps<RequestData>>
}

const RequestCustomHeader: FC<Props> = ({ className, title, tableProps }) => {
  // ดึง key และ props อื่นๆ ออกมาแยกกัน
  const { key, ...restProps } = tableProps.column.getHeaderProps()
  
  return (
    <th
      key={key}
      {...restProps}
      className={clsx(className, 'text-start text-muted fw-bold fs-7 text-uppercase gs-0')}
    >
      {title}
    </th>
  )
}

export { RequestCustomHeader }