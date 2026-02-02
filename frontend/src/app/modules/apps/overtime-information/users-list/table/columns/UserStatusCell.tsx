import clsx from 'clsx'

type Props = {
  status?: string | number
}

const UserStatusCell: React.FC<Props> = ({ status }) => {
  // แปลง status จาก backend format เป็น UI format
  const getDisplayStatus = () => {
    if (status === 'work day') return 'Active'
    if (status === 'leave day') return 'Inactive'
    if (status === 'on leave' || status === 'On Leave') return 'On Leave'
    if (status === 1) return 'Active'
    if (status === 0) return 'Inactive'
    return status?.toString() || 'Inactive'
  }

  const getStatusClass = () => {
    const displayStatus = getDisplayStatus()
    
    switch (displayStatus) {
      case 'Active':
        return 'badge-light-success' // สีเขียว
      case 'Inactive':
        return 'badge-light-danger'  // สีแดง
      case 'On Leave':
        return 'badge-light-warning' // สีเหลือง/ส้ม
      default:
        return 'badge-light-secondary' // สีเทาสำหรับสถานะอื่นๆ
    }
  }

  const displayStatus = getDisplayStatus()

  return (
    <span
      className={clsx(
        'badge fw-bolder',
        getStatusClass()
      )}
    >
      {displayStatus}
    </span>
  )
}

export { UserStatusCell }