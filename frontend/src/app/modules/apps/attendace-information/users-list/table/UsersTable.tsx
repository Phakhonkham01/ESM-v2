import {useMemo} from 'react'
import {useTable, ColumnInstance, Row} from 'react-table'
import {useQueryResponseData, useQueryResponseLoading} from '../core/QueryResponseProvider'
import {User} from '../core/_models'
import {UsersListLoading} from '../components/loading/UsersListLoading'
import {UsersListPagination} from '../components/pagination/UsersListPagination'
import {KTCardBody} from '../../../../../../_metronic/helpers'

const UsersTable = () => {
  const isLoading = useQueryResponseLoading()
  return (
    <KTCardBody className='py-4'>
      <UsersListPagination />
      {isLoading && <UsersListLoading />}
    </KTCardBody>
  )
}

export {UsersTable}
