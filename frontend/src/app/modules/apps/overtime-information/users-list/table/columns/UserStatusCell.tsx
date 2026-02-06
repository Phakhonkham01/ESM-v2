import {FC} from 'react'

type Props = {
  status: 'Pending' | 'Accepted' | 'Rejected'
  color: 'warning' | 'success' | 'danger'
}

const RequestStatusCell: FC<Props> = ({status, color}) => {
  return (
    <div className={`badge badge-light-${color} fw-bold`}>
      {status}
    </div>
  )
}

export {RequestStatusCell}