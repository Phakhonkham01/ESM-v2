import { FC } from 'react'
import { Department } from '../../core/_models'

type Props = {
  department_id?: string | string[] | Department | Department[] | null
}

const UserDepartmentCell: FC<Props> = ({ department_id }) => {
  // ถ้าไม่มี department
  if (!department_id) {
    return <span className="text-muted">No department</span>
  }

  // ✅ กรณีเป็น Array (สำหรับ Supervisor ที่มีหลาย departments)
  if (Array.isArray(department_id)) {
    // ถ้าเป็น array ว่าง
    if (department_id.length === 0) {
      return <span className="text-muted">No department</span>
    }

    // ถ้ามีหลาย departments
    return (
      <div className="d-flex flex-column gap-1">
        {department_id.map((dept, index) => {
          const deptName = typeof dept === 'object' && dept !== null
            ? dept.department_name
            : `Dept ID: ${dept}`
          
          return (
            <span key={index} className="badge badge-light-info">
              {deptName}
            </span>
          )
        })}
      </div>
    )
  }

  // ✅ กรณีเป็น Object (มี populate)
  if (typeof department_id === 'object' && department_id !== null) {
    const department = department_id as Department
    return <span className="text-dark fw-bold">{department.department_name}</span>
  }

  // ✅ กรณีเป็น String (แสดง ID)
  return <span className="text-muted">Dept ID: {department_id}</span>
}

export { UserDepartmentCell }