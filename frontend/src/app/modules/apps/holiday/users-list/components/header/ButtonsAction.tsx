import { FC } from 'react'
import { KTIcon } from '../../../../../../../_metronic/helpers'
import { useAuth } from '../../../../../auth'

type Props = {
    openAddHolidayModal: () => void
}

const AddHolidayButtons: FC<Props> = ({ openAddHolidayModal }) => {
    const { currentUser } = useAuth()

    const isCEO = currentUser?.role === 'CEO'
    const isAdmin = currentUser?.role === 'admin'
    const isEmployee = currentUser?.role === 'employee'

    return (
        <div className="d-flex gap-2">
            {/* CEO → Add Holiday */}
            {isCEO && (
                <button type="button" className="btn btn-primary" onClick={openAddHolidayModal}>
                    <KTIcon iconName="plus" className="fs-2" />
                    Add Holiday
                </button>
            )}

            {/* Admin → Add Holiday + Leave Request */}
            {isAdmin && (
                <>
                    <button type="button" className="btn btn-primary" onClick={openAddHolidayModal}>
                        <KTIcon iconName="plus" className="fs-2" />
                        Add Holiday
                    </button>
                </>
            )}

            {/* Employee → Add Leave Request */}
            {isEmployee && (
                <button type="button" className="btn btn-secondary" onClick={openAddHolidayModal}>
                    <KTIcon iconName="plus" className="fs-2" />
                    Add Leave Request
                </button>
            )}
        </div>
    )
}

export { AddHolidayButtons }
