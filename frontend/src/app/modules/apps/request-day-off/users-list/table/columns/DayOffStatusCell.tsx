// supervisor-day-off/users-list/table/columns/DayOffStatusCell.tsx
import { FC } from 'react'

type Props = {
  status: 'Pending' | 'Accepted' | 'Rejected'
}

const DayOffStatusCell: FC<Props> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Pending':
        return {
          label: 'Pending',
          className: 'badge-light-warning',
          icon: 'fas fa-clock'
        }
      case 'Accepted':
        return {
          label: 'Approved',
          className: 'badge-light-success',
          icon: 'fas fa-check-circle'
        }
      case 'Rejected':
        return {
          label: 'Rejected',
          className: 'badge-light-danger',
          icon: 'fas fa-times-circle'
        }
      default:
        return {
          label: status,
          className: 'badge-light-secondary',
          icon: 'fas fa-question-circle'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`badge badge-lg fw-bold ${config.className}`}>
      <i className={`${config.icon} me-1`}></i>
      {config.label}
    </div>
  )
}

export { DayOffStatusCell }