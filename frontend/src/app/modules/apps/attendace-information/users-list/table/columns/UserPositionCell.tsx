import { FC } from 'react'
import { Position } from '../../core/_models'

type Props = {
  position_id?: string | Position | null
}

const UserPositionCell: FC<Props> = ({ position_id }) => {
  // ถ้าไม่มี position
  if (!position_id) {
    return <span className="text-muted">-</span>
  }

  // ถ้า position_id เป็น object (มี populate)
  if (typeof position_id === 'object' && position_id !== null) {
    const position = position_id as Position
    return (
      <span className="fw-bold">{position.position_name}</span>
    )
  }

  // ถ้าเป็น string (แสดง ID)
  return <span className="">Position ID: {position_id}</span>
}

export { UserPositionCell }