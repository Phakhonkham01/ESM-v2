import { FC, useState } from 'react'
import { User } from '../../core/_models'
import { useListView } from '../../core/ListViewProvider'

type Props = {
  user: User
}
const SalaryActionsCell: FC<Props> = ({ user }) => {
  const { setItemIdForUpdate } = useListView()
  const [isLoading, setIsLoading] = useState(false)
  const [isHover, setIsHover] = useState(false) // สร้าง State สำหรับ Hover

  const handleCalculate = () => {
    setItemIdForUpdate(user._id)
  }

  // สีปกติ และ สีตอน Hover (เข้มขึ้นเล็กน้อย)
  const baseColor = '#45cc67'
  const hoverColor = '#3bb35a' 

  return (
    <div className="d-flex justify-content-end">
      <button
        className="btn btn-sm text-white fw-bold" 
        style={{ 
          backgroundColor: isHover ? hoverColor : baseColor, 
          borderColor: isHover ? hoverColor : baseColor,
          transition: 'all 0.2s ease', // เพิ่มความสมูทแบบ Metronic
          display: user.status === 'Active' ? 'inline-block' : 'none'
        }}
        onClick={handleCalculate}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        disabled={user.status !== 'Active' || isLoading}
        title={user.status === 'Active' ? 'Calculate Salary' : 'Inactive user'}
      >
        {isLoading ? (
          <span className="indicator-progress" style={{display: 'block'}}>
            Processing...
            <span className="spinner-border spinner-border-sm align-middle ms-2"></span>
          </span>
        ) : (
          <span className="indicator-label">Calculate</span>
        )}
      </button>
    </div>
  )
}
export { SalaryActionsCell }