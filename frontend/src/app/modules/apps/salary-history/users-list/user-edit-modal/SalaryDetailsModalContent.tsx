import { FC} from 'react'
import { useQuery } from 'react-query'
import { useListView } from '../core/ListViewProvider'
import { getSalaryById } from '../core/_requests'
import { KTIcon } from '../../../../../../_metronic/helpers'
import { SalaryDetailsComponent } from './SalaryDetailsComponent'

const SalaryDetailsModalContent: FC = () => {
  const { itemIdForUpdate } = useListView()
  

  const { data: salary, isLoading } = useQuery(
    `salary-${itemIdForUpdate}`,
    () => getSalaryById(itemIdForUpdate!),
    {
      enabled: !!itemIdForUpdate,
      cacheTime: 0,
    }
  )

  const handleExport = async () => {
    // Export functionality here
  }

  const handleSendEmail = async () => {
    // Email sending functionality here
  }

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="text-muted mt-2">Loading salary details...</div>
      </div>
    )
  }

  if (!salary) {
    return (
      <div className="text-center py-10">
        <KTIcon iconName="cross-circle" className="fs-3x text-danger mb-3" />
        <p className="text-danger">Salary not found</p>
      </div>
    )
  }

  return (
    <div>
      <SalaryDetailsComponent 
        salary={salary}
        onExport={handleExport}
        onSendEmail={handleSendEmail}
        isExporting={false}
        isSendingEmail={false}
        emailStatus={null}
      />                                                                                            
    </div>
  )
}

export { SalaryDetailsModalContent }