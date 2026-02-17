import { FC } from 'react'
import { ColumnInstance, HeaderProps } from 'react-table'
import { SatSunRequest } from '../../core/_models'

// ── Used inside each column's Header: (props) => <SatSunCustomHeader tableProps={props} ... />
type HeaderRendererProps = {
  tableProps: HeaderProps<SatSunRequest>
  title: string
  className?: string
}

const SatSunCustomHeader: FC<HeaderRendererProps> = ({ tableProps, title, className }) => (
  <th {...tableProps.column.getHeaderProps()} className={className}>
    {title}
  </th>
)

// ── Used in the table loop: headers.map(column => <SatSunColumnHeader column={column} />)
type ColumnHeaderProps = {
  column: ColumnInstance<SatSunRequest>
}

const SatSunColumnHeader: FC<ColumnHeaderProps> = ({ column }) => (
  <>
    {column.Header && typeof column.Header === 'string'
      ? <th {...column.getHeaderProps()}>{column.render('Header')}</th>
      : column.render('Header')
    }
  </>
)

export { SatSunCustomHeader, SatSunColumnHeader }