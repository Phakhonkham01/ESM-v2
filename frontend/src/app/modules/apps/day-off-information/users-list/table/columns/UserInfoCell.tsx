
import {FC} from 'react'
type Props = {
  name: string
}

const UserInfoCell: FC<Props> = ({name}) => (
  <div className='d-flex align-items-center'>
    <div className='d-flex flex-column'>
      <p>{name}</p>
    </div>
  </div>
)

export {UserInfoCell}
