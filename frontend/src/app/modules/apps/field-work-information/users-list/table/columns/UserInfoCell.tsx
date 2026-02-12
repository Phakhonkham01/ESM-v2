
import {FC} from 'react'
import {toAbsoluteUrl} from '../../../../../../../_metronic/helpers'
import {User} from '../../core/_models'

type Props = {
  name: string
}

const UserInfoCell: FC<Props> = ({name}) => (
  <div className='d-flex align-items-center'>
    {/* begin:: Avatar */}
    <div className='d-flex flex-column'>
      <p>{name}</p>
    </div>
  </div>
)

export {UserInfoCell}
