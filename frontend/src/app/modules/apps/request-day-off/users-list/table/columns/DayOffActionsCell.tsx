import {FC, useEffect} from 'react'
import {useMutation, useQueryClient} from 'react-query'
import Swal from 'sweetalert2'
import {MenuComponent} from '../../../../../../../_metronic/assets/ts/components'
import {KTIcon, QUERIES} from '../../../../../../../_metronic/helpers'
import {DayOffRequest} from '../../core/_models'
import {approveDayOff, rejectDayOff} from '../../core/_requests'
import {useQueryResponse} from '../../core/QueryResponseProvider'

type Props = {
  dayOff: DayOffRequest
}

const DayOffActionsCell: FC<Props> = ({dayOff}) => {
  const {query} = useQueryResponse()
  const queryClient = useQueryClient()

  // Re-initialize Metronic Menu เมื่อ component render
  useEffect(() => {
    MenuComponent.reinitialization()
  }, [])

  // การจัดการ Mutation
  const invalidateQueries = () => {
    queryClient.invalidateQueries(`${QUERIES.USERS_LIST}-dayoff-${query}`)
  }

  const approveMutation = useMutation(() => approveDayOff(dayOff._id || dayOff.id!), {
    onSuccess: () => {
      Swal.fire('Approved!', 'Leave request has been approved.', 'success')
      invalidateQueries()
    },
    onError: () => Swal.fire('Error!', 'Failed to approve request', 'error'),
  })

  const rejectMutation = useMutation(() => rejectDayOff(dayOff._id || dayOff.id!), {
    onSuccess: () => {
      Swal.fire('Rejected!', 'Leave request has been rejected.', 'success')
      invalidateQueries()
    },
    onError: () => Swal.fire('Error!', 'Failed to reject request', 'error'),
  })

  // Handlers สำหรับปุ่มต่างๆ
  const handleApprove = async () => {
    const result = await Swal.fire({
      title: 'Approve Leave Request?',
      text: `Are you sure you want to approve this request?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      confirmButtonText: 'Yes, Approve',
    })
    if (result.isConfirmed) approveMutation.mutate()
  }

  const handleReject = async () => {
    const result = await Swal.fire({
      title: 'Reject Leave Request?',
      text: 'Please confirm to reject this request.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Yes, Reject',
    })
    if (result.isConfirmed) rejectMutation.mutate()
  }

  const isPending = dayOff.status === 'Pending'

  return (
    <>
      <button
        disabled={!isPending}
        className='btn btn-light btn-active-light-primary btn-sm'
        data-kt-menu-trigger='click'
        data-kt-menu-placement='bottom-end'
      >
        Actions
        <KTIcon iconName='down' className='fs-5 m-0' />
      </button>
      
      {/* begin::Menu */}
      <div
        className='menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-bold fs-7 w-125px py-4'
        data-kt-menu='true'
      >
        {/* Approve Menu Item */}
        <div className='menu-item px-3'>
          <a className='menu-link px-3 text-success' onClick={handleApprove}>
            <KTIcon iconName='check' className='fs-3 me-2 text-success' />
            Approve
          </a>
        </div>

        {/* Reject Menu Item */}
        <div className='menu-item px-3'>
          <a className='menu-link px-3 text-danger' onClick={handleReject}>
            <KTIcon iconName='cross' className='fs-3 me-2 text-danger' />
            Reject
          </a>
        </div>
      </div>
      {/* end::Menu */}
    </>
  )
}

export {DayOffActionsCell}