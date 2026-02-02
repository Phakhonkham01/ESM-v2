import {FC} from 'react'

type Props = {
  leave_days?: number
}

const UserLeaveDaysCell: FC<Props> = ({leave_days}) => (
  <> <div>{leave_days}</div></>
)

export {UserLeaveDaysCell}
