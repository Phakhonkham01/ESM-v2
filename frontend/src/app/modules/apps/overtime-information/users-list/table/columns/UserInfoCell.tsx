
import {FC} from 'react'
import {toAbsoluteUrl} from '../../../../../../../_metronic/helpers'
import {User} from '../../core/_models'

type Props = {
  name: string
}

const UserInfoCell: FC<Props> = ({name}) => (
  <div className='d-flex align-items-center'>
    {/* begin:: Avatar */}
    {/* <div className='symbol symbol-circle symbol-50px overflow-hidden me-3'>
      <a href='#'>
        {user.avatar ? (
          <div className='symbol-label'>
            <img src={toAbsoluteUrl(`media/${user.avatar}`)} alt={user.name} className='w-100' />
          </div>
        ) : (
          <div
            className={clsx(
              'symbol-label fs-3',
              `bg-light-${user.initials?.state}`,
              `text-${user.initials?.state}`
            )}
          >
            {user.initials?.label}
          </div>
        )}
      </a>
    </div> */}
    <div className='d-flex flex-column'>
      <p>{name}</p>
    </div>
  </div>
)

export {UserInfoCell}
