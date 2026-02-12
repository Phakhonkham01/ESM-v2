import {FC} from 'react'

type Props = {
  email?: string
}

const UserEmailCell: FC<Props> = ({email}) => (
  <div className='d-flex align-items-center'>
    {/* begin:: Avatar */}
    <div className='d-flex flex-column'>
      <p>{email}</p>
    </div>
  </div>
)

export {UserEmailCell}
