import { FC, useState } from 'react'
import { KTIcon } from '../../../../../../../_metronic/helpers'
import { SalaryData } from '../../core/_models'
import { useListView } from '../../core/ListViewProvider'
import Swal from 'sweetalert2'
import { deleteSalary } from '../../core/_requests'

type Props = {
  salary: SalaryData
}

const SalaryActionsCell: FC<Props> = ({ salary }) => {
  const { setItemIdForUpdate } = useListView()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleView = () => {
    setItemIdForUpdate(salary._id || salary.id)
  }

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    })

    if (result.isConfirmed) {
      setIsDeleting(true)
      try {
        await deleteSalary(salary._id || salary.id || '')
        Swal.fire('Deleted!', 'Salary record has been deleted.', 'success')
        // You might want to refresh the list here
      } catch (error) {
        Swal.fire('Error!', 'Failed to delete salary record.', 'error')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="d-flex justify-content-end">
      <button
        className="btn btn-sm btn-light-primary me-2"
        onClick={handleView}
        title="View Details"
      >
        <KTIcon iconName="eye" className="fs-3" />
        View
      </button>
      
      {salary.status === 'pending' && (
        <button
          className="btn btn-sm btn-light-danger"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete"
        >
          {isDeleting ? (
            <span className="spinner-border spinner-border-sm"></span>
          ) : (
            <KTIcon iconName="trash" className="fs-3" />
          )}
        </button>
      )}
    </div>
  )
}

export { SalaryActionsCell }