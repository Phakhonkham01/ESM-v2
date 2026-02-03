interface DayOffRequestStatusCellProps {
  status: 'Pending' | 'Accepted' | 'Rejected'
}

const DayOffRequestStatusCell = ({ status }: DayOffRequestStatusCellProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Pending':
        return {
          label: 'Pending',
          color: 'warning',
          className: 'badge-light-warning'
        }
      case 'Accepted':
        return {
          label: 'Accepted',
          color: 'success',
          className: 'badge-light-success'
        }
      case 'Rejected':
        return {
          label: 'Rejected',
          color: 'danger',
          className: 'badge-light-danger'
        }
      default:
        return {
          label: status,
          color: 'secondary',
          className: 'badge-light-secondary'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <div className="d-flex align-items-center">
      <span className={`badge ${config.className} fw-bold`}>
        {config.label}
      </span>
    </div>
  )
}

export { DayOffRequestStatusCell }