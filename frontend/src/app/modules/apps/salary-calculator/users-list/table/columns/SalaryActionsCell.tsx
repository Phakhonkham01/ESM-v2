import { FC, useState } from 'react'
import { User } from '../../core/_models'
import { useListView } from '../../core/ListViewProvider'

type Props = {
  user: User
}

const SalaryActionsCell: FC<Props> = ({ user }) => {
  const { setItemIdForUpdate } = useListView()
  const [isLoading, setIsLoading] = useState(false)

  const handleCalculate = () => {
    setItemIdForUpdate(user._id)
  }

  return (
    <div className="d-flex justify-content-end">
      <button
        className={`btn btn-sm ${user.status === 'Active' ? 'btn-success' : 'btn-secondary'}`}
        onClick={handleCalculate}
        disabled={user.status !== 'Active' || isLoading}
        title={user.status === 'Active' ? 'Calculate Salary' : 'Inactive user'}
      >
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Processing...
          </>
        ) : (
          'Calculate'
        )}
      </button>
    </div>
  )
}

export { SalaryActionsCell }