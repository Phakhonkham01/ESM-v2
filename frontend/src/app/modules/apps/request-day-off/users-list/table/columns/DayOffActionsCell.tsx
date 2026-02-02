// supervisor-day-off/users-list/table/columns/DayOffActionsCell.tsx
import { FC, useEffect } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { MenuComponent } from '../../../../../../../_metronic/assets/ts/components'
import { ID, KTIcon, QUERIES } from '../../../../../../../_metronic/helpers'
import { useListView } from '../../core/ListViewProvider'
import { useQueryResponse } from '../../core/QueryResponseProvider'
import { approveDayOffRequest, rejectDayOffRequest } from '../../core/_requests'
import Swal from 'sweetalert2'
import { DayOffItem } from '../../core/_models'

type Props = {
  item: DayOffItem
}

const DayOffActionsCell: FC<Props> = ({ item }) => {
  const { setItemIdForUpdate } = useListView()
  const { query } = useQueryResponse()
  const queryClient = useQueryClient()

  useEffect(() => {
    MenuComponent.reinitialization()
  }, [])

  const openEditModal = () => {
    setItemIdForUpdate(item.id)
  }

  // Approve mutation
  const approveMutation = useMutation(() => approveDayOffRequest(item.id || item._id), {
    onSuccess: () => {
      queryClient.invalidateQueries([`${QUERIES.DAY_OFF_LIST}-${query}`])
      Swal.fire({
        icon: 'success',
        title: 'Approved!',
        text: 'Leave request has been approved.',
        timer: 2000,
        showConfirmButton: false
      })
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message || 'Failed to approve request',
      })
    }
  })

  // Reject mutation
  const rejectMutation = useMutation(() => rejectDayOffRequest(item.id || item._id), {
    onSuccess: () => {
      queryClient.invalidateQueries([`${QUERIES.DAY_OFF_LIST}-${query}`])
      Swal.fire({
        icon: 'success',
        title: 'Rejected!',
        text: 'Leave request has been rejected.',
        timer: 2000,
        showConfirmButton: false
      })
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message || 'Failed to reject request',
      })
    }
  })

  const handleApprove = async () => {
    const result = await Swal.fire({
      title: 'Approve Leave Request?',
      html: `
        <div class="text-left">
          <p class="mb-3 text-gray-600">Are you sure you want to approve this leave request?</p>
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div class="flex justify-between mb-2">
              <span class="text-gray-500">Employee:</span>
              <span class="font-medium">${item.employee_name || 'Unknown'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Type:</span>
              <span class="font-medium">${item.day_off_type === 'HALF_DAY' ? 'Half Day' : 'Full Day'}</span>
            </div>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    })

    if (result.isConfirmed) {
      await approveMutation.mutateAsync()
    }
  }

  const handleReject = async () => {
    const result = await Swal.fire({
      title: 'Reject Leave Request?',
      html: `
        <div class="text-left">
          <p class="mb-3 text-gray-600">Are you sure you want to reject this leave request?</p>
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div class="flex justify-between mb-2">
              <span class="text-gray-500">Employee:</span>
              <span class="font-medium">${item.employee_name || 'Unknown'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Type:</span>
              <span class="font-medium">${item.day_off_type === 'HALF_DAY' ? 'Half Day' : 'Full Day'}</span>
            </div>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    })

    if (result.isConfirmed) {
      await rejectMutation.mutateAsync()
    }
  }

  return (
    <>
      <a
        href='#'
        className='btn btn-light btn-active-light-primary btn-sm'
        data-kt-menu-trigger='click'
        data-kt-menu-placement='bottom-end'
      >
        Actions
        <KTIcon iconName='down' className='fs-5 m-0' />
      </a>
      {/* begin::Menu */}
      <div
        className='menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-bold fs-7 w-125px py-4'
        data-kt-menu='true'
      >
        {/* View Details */}
        <div className='menu-item px-3'>
          <a className='menu-link px-3' onClick={openEditModal}>
            <i className="fas fa-eye me-2"></i>
            View
          </a>
        </div>

        {/* Approve (only for pending) */}
        {item.status === 'Pending' && (
          <div className='menu-item px-3'>
            <a
              className='menu-link px-3 text-success'
              onClick={handleApprove}
              style={{cursor: 'pointer'}}
            >
              <i className="fas fa-check me-2"></i>
              Approve
            </a>
          </div>
        )}

        {/* Reject (only for pending) */}
        {item.status === 'Pending' && (
          <div className='menu-item px-3'>
            <a
              className='menu-link px-3 text-danger'
              onClick={handleReject}
              style={{cursor: 'pointer'}}
            >
              <i className="fas fa-times me-2"></i>
              Reject
            </a>
          </div>
        )}
      </div>
      {/* end::Menu */}
    </>
  )
}

export { DayOffActionsCell }