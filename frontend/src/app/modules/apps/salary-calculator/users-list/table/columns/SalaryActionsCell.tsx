import { FC, useState } from 'react'
import { User } from '../../core/_models'
import { useListView } from '../../core/ListViewProvider'

type Props = {
  user: User
}

const SalaryActionsCell: FC<Props> = ({ user }) => {
  const { setItemIdForUpdate, setItemIdForStep5 } = useListView() // ✅ เพิ่ม setItemIdForStep5
  const [isLoading, setIsLoading] = useState(false)
  const [isHover, setIsHover] = useState(false)

  const handleCalculateStep5 = async () => {
    setIsLoading(true)
    try {
      // ✅ เปิด Step 5 โดยตรง
      if (setItemIdForStep5) {
        setItemIdForStep5(user._id)
      } else {
        // fallback ถ้าไม่มี setItemIdForStep5
        setItemIdForUpdate(user._id, 4)
      }
    } catch (error) {
      console.error('Error opening step 5:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCalculateFull = () => {
    // เปิด Step 1
    setItemIdForUpdate(user._id, 0)
  }

  // สีสำหรับปุ่ม
  const baseColor = '#45cc67'
  const hoverColor = '#3bb35a'

  return (
    <div className="d-flex justify-content-end gap-2">
      {/* ปุ่ม View Step 5 */}
      <button
        className="btn btn-sm text-white fw-bold"
        style={{
          backgroundColor: isHover ? hoverColor : baseColor,
          borderColor: isHover ? hoverColor : baseColor,
          transition: 'all 0.2s ease',
          display: user.status === 'Active' ? 'inline-block' : 'none'
        }}
        onClick={handleCalculateStep5}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        disabled={user.status !== 'Active' || isLoading}
        title={user.status === 'Active' ? 'View Salary Summary (Step 5)' : 'Inactive user'}
      >
        {isLoading ? (
          <span className="indicator-progress" style={{ display: 'block' }}>
            Loading...
            <span className="spinner-border spinner-border-sm align-middle ms-2"></span>
          </span>
        ) : (
          <>
            <span className="indicator-label">View</span>
            <i className="bi bi-arrow-right-circle ms-1"></i>
          </>
        )}
      </button>

      {/* ปุ่ม Calculate ปกติ */}
      <button
        className="btn btn-sm btn-light fw-bold"
        onClick={handleCalculateFull}
        disabled={user.status !== 'Active'}
        title={user.status === 'Active' ? 'Calculate Salary (Full Process)' : 'Inactive user'}
      >
        <i className="bi bi-calculator me-1"></i>
        Calculate
      </button>
    </div>
  )
}

export { SalaryActionsCell }