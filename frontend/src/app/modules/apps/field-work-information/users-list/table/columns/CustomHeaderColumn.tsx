import {FC} from 'react'
import {ColumnInstance} from 'react-table'
import {FormattedRequestOTFieldWork} from '../../core/_models'

// Type it specifically for FormattedRequestOTFieldWork
type Props = {
  column: ColumnInstance<FormattedRequestOTFieldWork>
}

const CustomHeaderColumn: FC<Props> = ({column}) => (
  <>
    {column.Header && typeof column.Header === 'string' ? <th {...column.getHeaderProps()}>{column.render('Header')}</th> : column.render('Header')}
  </>
)

export {CustomHeaderColumn}