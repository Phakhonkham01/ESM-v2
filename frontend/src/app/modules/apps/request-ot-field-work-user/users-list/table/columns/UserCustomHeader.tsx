import {FC} from 'react'
import {ColumnInstance} from 'react-table'
import {FormattedRequestOTFieldWork} from '../../core/_models'

type Props = {
  tableProps: {
    column: ColumnInstance<FormattedRequestOTFieldWork>
  }
  title: string
  className?: string
}

const RequestCustomHeader: FC<Props> = ({tableProps, title, className}) => {
  return (
    <th {...tableProps.column.getHeaderProps()} className={className}>
      {title}
    </th>
  )
}

export {RequestCustomHeader}