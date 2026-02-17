import { FC, useEffect, useState } from 'react'
import * as Yup from 'yup'
import { useFormik, FormikHelpers } from 'formik'
import clsx from 'clsx'
import { isNotEmpty } from '../../../../../../_metronic/helpers'
import { 
  SatSunRequest, 
  initialSatSunRequest, 
  DayChoice, 
  DayOffType,
  SatSunRequestStatus,
  getSatSunStatusBadgeClass
} from '../core/_models'
import { useListView } from '../core/ListViewProvider'
import { SatSunListLoading } from '../components/loading/UsersListLoading' // เปลี่ยนชื่อให้ตรง
import { 
  createSatSunRequest, 
  updateSatSunRequest, 
  updateSatSunRequestStatus, 
  deleteSatSunRequest, 
  checkSatSunConflict,
  SatSunRequestFormData, 
  SatSunRequestUpdateData 
} from '../core/_requests'
import { useQueryResponse } from '../core/QueryResponseProvider'
import { QUERIES } from '../../../../../../_metronic/helpers/crud-helper/consts'
import { useMutation, useQueryClient, QueryKey } from 'react-query'
import axios, { AxiosError } from 'axios'
import Swal from 'sweetalert2'
import { format } from 'date-fns'

// Define User interface
interface User {
  _id?: string
  id?: string
  user_name?: string
  first_name_en?: string
  last_name_en?: string
  nickname_en?: string
  user_email?: string
  role?: string
  department_id?: { _id: string; department_name: string } | string
  position_id?: { _id: string; position_name: string } | string
  leave_days?: number
}

type Props = {
  isRequestLoading: boolean
  request?: SatSunRequest
  currentUser?: User
}

// Validation Schema
const satSunSchema = Yup.object().shape({
  employee_id: Yup.string().required('Employee is required'),
  supervisor_id: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one supervisor is required')
    .required('Supervisor(s) is required'),
  day_choice: Yup.string()
    .oneOf(['Saturday', 'Sunday'], 'Invalid day choice')
    .required('Day choice is required'),
  day_off_type: Yup.string()
    .oneOf(['Full day', 'Half day'], 'Invalid day off type')
    .required('Day off type is required'),
  start_date_time: Yup.string().required('Start date is required'),
  end_date_time: Yup.string().required('End date is required'),
  description: Yup.string().max(500, 'Maximum 500 characters'),
})

// Half day time slots
const HALF_DAY_SLOTS = [
  { label: 'Morning (08:30 – 12:00)', start: '08:30', end: '12:00' },
  { label: 'Afternoon (13:30 – 17:00)', start: '13:30', end: '17:00' },
]

const SatSunRequestEditModalForm: FC<Props> = ({ request, isRequestLoading, currentUser }) => {
  const { setItemIdForUpdate } = useListView()
  const { query } = useQueryResponse()
  const queryClient = useQueryClient()

  // State
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [filteredSupervisors, setFilteredSupervisors] = useState<User[]>([])
  const [selectedHalfDaySlot, setSelectedHalfDaySlot] = useState<number>(0)
  const [conflictWarning, setConflictWarning] = useState<string>('')

  // API URL
  const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8001/api'

  // Determine if form should be read-only
  const isStatusFinal = request?.status === 'Accepted' || request?.status === 'Rejected'
  const isEditMode = !!request

  // Helper function to extract ID from User or string
  const extractId = (item: string | User | undefined): string => {
    if (!item) return ''
    if (typeof item === 'string') return item
    return item.id || item._id || ''
  }

  // Helper function to extract supervisor IDs from various formats
  const extractSupervisorIds = (
  supervisorField: any // ใช้ any ชั่วคราวเพื่อให้ผ่าน
): string[] => {
  if (!supervisorField) return []
  if (Array.isArray(supervisorField)) {
    return supervisorField.map(item => extractId(item)).filter(Boolean)
  }
  return [extractId(supervisorField)].filter(Boolean)
}
  // Format date for input
  const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return ''
    const dateObj = new Date(date)
    return format(dateObj, "yyyy-MM-dd'T'HH:mm")
  }

  // Calculate leave days
  const calculateDays = (start: string, end: string, type: DayOffType): number => {
    if (!start || !end) return 0
    if (type === 'Half day') return 0.5

    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = endDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  // Check if date matches day choice
  const validateDayOfWeek = (dateStr: string, dayChoice: DayChoice): boolean => {
    if (!dateStr) return true
    const day = new Date(dateStr).getDay()
    return dayChoice === 'Saturday' ? day === 6 : day === 0
  }

  // Get user display name
  const getUserDisplayName = (user: User): string => {
    if (user.first_name_en && user.last_name_en) {
      return `${user.first_name_en} ${user.last_name_en}${user.nickname_en ? ` (${user.nickname_en})` : ''}`
    }
    return user.user_name || user.user_email || 'Unknown'
  }

  // Get user ID
  const getUserId = (user: User): string => {
    return user.id || user._id || ''
  }

  // Find user by ID
  const findUserById = (id: string): User | undefined => {
    return users.find(user => getUserId(user) === id)
  }

  // Formik setup
  const formik = useFormik<SatSunRequestFormData & { _id?: string; id?: string }>({
    initialValues: {
      user_id: extractId(currentUser),
      employee_id: extractId(currentUser),
      supervisor_id: request ? extractSupervisorIds(request.supervisor_id) : [],
      day_choice: request?.day_choice || 'Saturday',
      day_off_type: request?.day_off_type || 'Full day',
      start_date_time: request ? formatDateForInput(request.start_date_time) : '',
      end_date_time: request ? formatDateForInput(request.end_date_time) : '',
      description: request?.description || '',
      _id: request?._id || (request as any)?.id,
      id: request?._id || (request as any)?.id,
    },
    validationSchema: isStatusFinal ? undefined : satSunSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      if (isStatusFinal) {
        setSubmitting(false)
        return
      }

      try {
        // Check conflict before submit
        if (values.employee_id && values.start_date_time) {
          const conflictParams = values.day_off_type === 'Half day'
            ? {
                employee_id: values.employee_id,
                date: values.start_date_time.split('T')[0],
                exclude_id: values._id,
              }
            : {
                employee_id: values.employee_id,
                start_date: values.start_date_time.split('T')[0],
                end_date: values.end_date_time.split('T')[0],
                exclude_id: values._id,
              }

          const conflictResult = await checkSatSunConflict(conflictParams)
          
          if (conflictResult.has_conflict) {
            const confirm = await Swal.fire({
              title: 'Date Conflict Detected',
              text: `Found ${conflictResult.conflict_count} overlapping request(s). Do you want to proceed?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Yes, proceed',
              cancelButtonText: 'Cancel',
            })
            
            if (!confirm.isConfirmed) {
              setSubmitting(false)
              return
            }
          }
        }

        // Prepare submit data
        const submitData: SatSunRequestFormData = {
          user_id: values.user_id || extractId(currentUser),
          employee_id: values.employee_id || extractId(currentUser),
          supervisor_id: values.supervisor_id,
          day_choice: values.day_choice,
          day_off_type: values.day_off_type,
          start_date_time: values.start_date_time,
          end_date_time: values.end_date_time,
          description: values.description,
        }

        if (isNotEmpty(values._id || values.id)) {
          // Update
          await updateMutation.mutateAsync({ 
            id: (values._id || values.id)!, 
            data: submitData 
          })
        } else {
          // Create
          await createMutation.mutateAsync(submitData)
        }

        setItemIdForUpdate(undefined)
      } catch (err) {
        console.error('Submit error:', err)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err instanceof Error ? err.message : 'Failed to submit request',
        })
      } finally {
        setSubmitting(false)
      }
    },
  })

  // Fetch users
  const fetchUsers = async () => {
    if (isStatusFinal) return
    
    setLoadingUsers(true)
    try {
      const res = await axios.get<{ data: User[] }>(`${API_URL}/users`)
      setUsers(res.data.data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Unable to load users',
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  // Check for conflicts
  const checkForConflict = async () => {
    if (isStatusFinal || !formik.values.employee_id || !formik.values.start_date_time) return

    try {
      const params = formik.values.day_off_type === 'Half day'
        ? {
            employee_id: formik.values.employee_id,
            date: formik.values.start_date_time.split('T')[0],
            exclude_id: formik.values._id,
          }
        : {
            employee_id: formik.values.employee_id,
            start_date: formik.values.start_date_time.split('T')[0],
            end_date: formik.values.end_date_time.split('T')[0],
            exclude_id: formik.values._id,
          }

      const result = await checkSatSunConflict(params)
      setConflictWarning(
        result.has_conflict
          ? `⚠️ Found ${result.conflict_count} overlapping request(s)`
          : ''
      )
    } catch {
      setConflictWarning('')
    }
  }

  // Effects
  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter supervisors when employee changes
  useEffect(() => {
    if (isStatusFinal) return

    if (formik.values.employee_id) {
      const employee = users.find(u => getUserId(u) === formik.values.employee_id)
      if (employee) {
        const supervisors = users.filter(u => 
          (u.role === 'supervisor' || u.role === 'admin') && 
          getUserId(u) !== getUserId(employee)
        )
        setFilteredSupervisors(supervisors)
      }
    } else {
      const supervisors = users.filter(u => u.role === 'supervisor' || u.role === 'admin')
      setFilteredSupervisors(supervisors)
    }
  }, [formik.values.employee_id, users])

  // Auto-set half-day times
  useEffect(() => {
    if (formik.values.day_off_type !== 'Half day') return
    if (!formik.values.start_date_time) return

    const dateOnly = formik.values.start_date_time.split('T')[0]
    const slot = HALF_DAY_SLOTS[selectedHalfDaySlot]
    formik.setFieldValue('start_date_time', `${dateOnly}T${slot.start}`)
    formik.setFieldValue('end_date_time', `${dateOnly}T${slot.end}`)
  }, [selectedHalfDaySlot, formik.values.day_off_type])

  // Debounced conflict check
  useEffect(() => {
    if (isStatusFinal) return

    const timer = setTimeout(() => {
      checkForConflict()
    }, 500)

    return () => clearTimeout(timer)
  }, [
    formik.values.start_date_time,
    formik.values.end_date_time,
    formik.values.employee_id,
    formik.values.day_off_type,
  ])

  // Mutations
  const invalidateRequests = () =>
    queryClient.invalidateQueries([`${QUERIES.USERS_LIST}-sat-sun-requests-${query}`] as QueryKey)

  const createMutation = useMutation(createSatSunRequest, {
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: '<span style="color: #10b981; font-weight: bold;">Request Created</span>',
        text: 'Saturday/Sunday request has been successfully created.',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => invalidateRequests())
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message || 'Something went wrong!',
      })
    },
  })

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: SatSunRequestUpdateData }) => 
      updateSatSunRequest(id, data),
    {
      onSuccess: () => {
        Swal.fire({
          icon: 'success',
          title: '<span style="color: #10b981;">Request Updated</span>',
          text: 'Saturday/Sunday request has been successfully updated.',
          confirmButtonText: 'OK',
        }).then(() => invalidateRequests())
      },
      onError: (error: AxiosError<{ message?: string }>) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || error.message || 'Failed to update request',
        })
      },
    }
  )

  const deleteMutation = useMutation(
    (id: string) => deleteSatSunRequest(id),
    {
      onSuccess: () => {
        Swal.fire({
          icon: 'success',
          title: '<span style="color: #10b981;">Request Deleted</span>',
          text: 'Saturday/Sunday request has been successfully deleted.',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          invalidateRequests()
          setItemIdForUpdate(undefined)
        })
      },
      onError: (error: AxiosError<{ message?: string }>) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || error.message || 'Failed to delete request',
        })
      },
    }
  )

  const statusMutation = useMutation(
    ({ id, status }: { id: string; status: SatSunRequestStatus }) => 
      updateSatSunRequestStatus(id, status),
    {
      onSuccess: () => {
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          timer: 1500,
          showConfirmButton: false,
        }).then(() => invalidateRequests())
      },
      onError: (error: AxiosError<{ message?: string }>) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || error.message || 'Failed to update status',
        })
      },
    }
  )

  // Handlers
  const handleSupervisorChange = (supervisorId: string, checked: boolean) => {
    if (isStatusFinal) {
      Swal.fire({
        icon: 'info',
        title: 'Read Only',
        text: 'This request cannot be modified because it has been finalized.',
      })
      return
    }

    const current = formik.values.supervisor_id
    const updated = checked
      ? [...current, supervisorId]
      : current.filter(id => id !== supervisorId)
    
    formik.setFieldValue('supervisor_id', updated)
  }

  const handleDelete = async () => {
    if (isStatusFinal) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Delete',
        text: 'Accepted or Rejected requests cannot be deleted.',
      })
      return
    }

    const requestId = request?._id || (request as any)?.id
    if (!requestId) return

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    })

    if (result.isConfirmed) {
      deleteMutation.mutate(requestId)
    }
  }

  const handleStatusChange = async (status: SatSunRequestStatus) => {
    const requestId = request?._id || (request as any)?.id
    if (!requestId) return

    const action = status === 'Accepted' ? 'approve' : 'reject'
    const result = await Swal.fire({
      title: `Confirm ${status}`,
      text: `Are you sure you want to ${action} this request?`,
      icon: status === 'Accepted' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: status === 'Accepted' ? '#10b981' : '#d33',
      confirmButtonText: `Yes, ${action}`,
    })

    if (result.isConfirmed) {
      statusMutation.mutate({ id: requestId, status })
    }
  }

  // Computed values
  const calculatedDays = calculateDays(
    formik.values.start_date_time,
    formik.values.end_date_time,
    formik.values.day_off_type
  )

  const dayChoiceValid = validateDayOfWeek(
    formik.values.start_date_time,
    formik.values.day_choice
  )

  const canEdit = isEditMode && !isStatusFinal
  const canApprove = isEditMode && request?.status === 'Pending'
  const isSubmitting = formik.isSubmitting || 
    createMutation.isLoading || 
    updateMutation.isLoading || 
    deleteMutation.isLoading || 
    statusMutation.isLoading

  const fieldClass = (name: keyof SatSunRequestFormData) =>
    clsx('form-control form-control-solid', {
      'is-invalid': formik.touched[name] && formik.errors[name],
      'is-valid': formik.touched[name] && !formik.errors[name],
      'bg-light': isStatusFinal,
    })

  const cancel = () => setItemIdForUpdate(undefined)

  // Get employee leave days
  const employee = users.find(u => getUserId(u) === formik.values.employee_id)
  const employeeLeaveDays = employee?.leave_days || 0

  return (
    <>
      {/* Status Banner */}
      {isStatusFinal && (
        <div className={clsx('alert d-flex align-items-center mb-5', {
          'alert-success': request?.status === 'Accepted',
          'alert-danger': request?.status === 'Rejected',
        })}>
          <i className={clsx('fs-2 me-3', {
            'bi bi-check-circle-fill': request?.status === 'Accepted',
            'bi bi-x-circle-fill': request?.status === 'Rejected',
          })} />
          <div>
            <h5 className='fw-bold mb-1'>Request {request?.status}</h5>
            <p className='mb-0 fs-7'>
              This request has been finalized and cannot be modified.
            </p>
          </div>
        </div>
      )}

      <form className='form' onSubmit={formik.handleSubmit} noValidate>
        {/* Debug Info - Development Only */}
        {process.env.NODE_ENV === 'development' && (
          <div className='alert alert-secondary mb-5'>
            <small>
              <strong>Debug Info:</strong><br />
              Request ID: {request?._id || 'None'}<br />
              Employee ID: {formik.values.employee_id}<br />
              Supervisors: {formik.values.supervisor_id.join(', ') || 'None'}<br />
              Day Choice: {formik.values.day_choice}<br />
              Day Off Type: {formik.values.day_off_type}
            </small>
          </div>
        )}

        {/* Employee Info Banner */}
        {currentUser && (
          <div className='alert alert-primary d-flex align-items-center mb-7 p-4'>
            <div className='symbol symbol-40px symbol-circle me-4'>
              <div className='symbol-label bg-primary'>
                <i className='bi bi-person-fill fs-4 text-white' />
              </div>
            </div>
            <div className='flex-grow-1'>
              <div className='fw-bold text-gray-800'>{getUserDisplayName(currentUser)}</div>
              <div className='text-muted fs-7'>{currentUser.user_email}</div>
            </div>
            <div className='text-end'>
              <div className='fs-7 text-muted'>Leave Balance</div>
              <div
                className={clsx('fw-bold fs-5', {
                  'text-success': employeeLeaveDays > 3,
                  'text-warning': employeeLeaveDays > 0 && employeeLeaveDays <= 3,
                  'text-danger': employeeLeaveDays <= 0,
                })}
              >
                {employeeLeaveDays} days
              </div>
            </div>
          </div>
        )}

        {/* Day Choice */}
        <div className='fv-row mb-7'>
          <label className='required fw-bold fs-6 mb-3'>Day</label>
          {isStatusFinal ? (
            <div className='p-3 bg-light rounded border'>
              <div className='d-flex align-items-center'>
                <i className={`bi ${formik.values.day_choice === 'Saturday' ? 'bi-brightness-high' : 'bi-sun'} me-2 fs-4`} />
                <span className='fw-bold'>{formik.values.day_choice}</span>
              </div>
            </div>
          ) : (
            <div className='d-flex gap-4'>
              {(['Saturday', 'Sunday'] as DayChoice[]).map((day) => (
                <div key={day} className='form-check form-check-custom form-check-solid flex-grow-1'>
                  <input
                    className='form-check-input'
                    type='radio'
                    id={`day-${day}`}
                    value={day}
                    checked={formik.values.day_choice === day}
                    onChange={() => {
                      formik.setFieldValue('day_choice', day)
                      formik.setFieldValue('start_date_time', '')
                      formik.setFieldValue('end_date_time', '')
                    }}
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor={`day-${day}`}
                    className={clsx('form-check-label fw-bold px-4 py-3 rounded border flex-grow-1 cursor-pointer', {
                      'bg-info text-white border-info': formik.values.day_choice === day && day === 'Saturday',
                      'bg-primary text-white border-primary': formik.values.day_choice === day && day === 'Sunday',
                      'border-gray-300 text-gray-600': formik.values.day_choice !== day,
                    })}
                  >
                    <i className={clsx('me-2', {
                      'bi bi-brightness-high': day === 'Saturday',
                      'bi bi-sun': day === 'Sunday',
                    })} />
                    {day}
                  </label>
                </div>
              ))}
            </div>
          )}
          {!isStatusFinal && formik.touched.day_choice && formik.errors.day_choice && (
            <div className='fv-plugins-message-container'>
              <span role='alert' className='fv-help-block text-danger'>
                {formik.errors.day_choice}
              </span>
            </div>
          )}
        </div>

        {/* Day Off Type */}
        <div className='fv-row mb-7'>
          <label className='required fw-bold fs-6 mb-3'>Type</label>
          {isStatusFinal ? (
            <div className='p-3 bg-light rounded border'>
              <div className='d-flex align-items-center'>
                <i className={`bi ${formik.values.day_off_type === 'Full day' ? 'bi-calendar-day' : 'bi-calendar-half'} me-2 fs-4`} />
                <span className='fw-bold'>{formik.values.day_off_type}</span>
              </div>
            </div>
          ) : (
            <div className='d-flex gap-4'>
              {(['Full day', 'Half day'] as DayOffType[]).map((type) => (
                <div key={type} className='form-check form-check-custom form-check-solid flex-grow-1'>
                  <input
                    className='form-check-input'
                    type='radio'
                    id={`type-${type}`}
                    value={type}
                    checked={formik.values.day_off_type === type}
                    onChange={() => formik.setFieldValue('day_off_type', type)}
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor={`type-${type}`}
                    className={clsx('form-check-label fw-bold px-4 py-3 rounded border flex-grow-1 cursor-pointer', {
                      'bg-success text-white border-success': formik.values.day_off_type === type && type === 'Full day',
                      'bg-warning text-white border-warning': formik.values.day_off_type === type && type === 'Half day',
                      'border-gray-300 text-gray-600': formik.values.day_off_type !== type,
                    })}
                  >
                    <i className={clsx('me-2', {
                      'bi bi-calendar-day': type === 'Full day',
                      'bi bi-calendar-half': type === 'Half day',
                    })} />
                    {type}
                  </label>
                </div>
              ))}
            </div>
          )}
          {!isStatusFinal && formik.touched.day_off_type && formik.errors.day_off_type && (
            <div className='fv-plugins-message-container'>
              <span role='alert' className='fv-help-block text-danger'>
                {formik.errors.day_off_type}
              </span>
            </div>
          )}
        </div>

        {/* Half Day Slot Picker */}
        {!isStatusFinal && formik.values.day_off_type === 'Half day' && (
          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-3'>Time Slot</label>
            <div className='d-flex gap-4'>
              {HALF_DAY_SLOTS.map((slot, idx) => (
                <div key={idx} className='form-check form-check-custom form-check-solid flex-grow-1'>
                  <input
                    className='form-check-input'
                    type='radio'
                    id={`slot-${idx}`}
                    checked={selectedHalfDaySlot === idx}
                    onChange={() => setSelectedHalfDaySlot(idx)}
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor={`slot-${idx}`}
                    className={clsx('form-check-label fw-semibold px-4 py-3 rounded border flex-grow-1 cursor-pointer', {
                      'bg-warning bg-opacity-10 border-warning text-warning': selectedHalfDaySlot === idx,
                      'border-gray-300 text-gray-600': selectedHalfDaySlot !== idx,
                    })}
                  >
                    <i className={clsx('me-2', idx === 0 ? 'bi bi-sunrise' : 'bi bi-sunset')} />
                    {slot.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date Selection */}
        <div className='row g-6 mb-7'>
          <div className={formik.values.day_off_type === 'Full day' ? 'col-md-6' : 'col-12'}>
            <label className='required fw-bold fs-6 mb-2'>
              {formik.values.day_off_type === 'Half day' ? 'Date' : 'Start Date'}
            </label>
            {isStatusFinal ? (
              <div className='p-3 bg-light rounded border'>
                {formik.values.start_date_time ? (
                  <div className='d-flex align-items-center'>
                    <i className='bi bi-calendar-event me-2' />
                    <span>
                      {new Date(formik.values.start_date_time).toLocaleString('en-GB', {
                        timeZone: 'Asia/Bangkok',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ) : (
                  <span className='text-muted'>Not set</span>
                )}
              </div>
            ) : (
              <>
                <input
                  type={formik.values.day_off_type === 'Half day' ? 'date' : 'datetime-local'}
                  value={
                    formik.values.day_off_type === 'Half day'
                      ? formik.values.start_date_time.split('T')[0] || ''
                      : formik.values.start_date_time
                  }
                  onChange={(e) => {
                    const value = e.target.value
                    if (formik.values.day_off_type === 'Half day' && value) {
                      const slot = HALF_DAY_SLOTS[selectedHalfDaySlot]
                      formik.setFieldValue('start_date_time', `${value}T${slot.start}`)
                      formik.setFieldValue('end_date_time', `${value}T${slot.end}`)
                    } else {
                      formik.setFieldValue('start_date_time', value)
                    }
                  }}
                  onBlur={() => formik.setFieldTouched('start_date_time', true)}
                  className={fieldClass('start_date_time')}
                  disabled={isSubmitting}
                />
                {formik.values.start_date_time && !dayChoiceValid && (
                  <div className='text-danger fs-7 mt-1'>
                    <i className='bi bi-exclamation-circle me-1' />
                    Selected date is not a {formik.values.day_choice}
                  </div>
                )}
                {formik.touched.start_date_time && formik.errors.start_date_time && (
                  <div className='fv-plugins-message-container'>
                    <span role='alert' className='fv-help-block text-danger'>
                      {formik.errors.start_date_time}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {formik.values.day_off_type === 'Full day' && (
            <div className='col-md-6'>
              <label className='required fw-bold fs-6 mb-2'>End Date</label>
              {isStatusFinal ? (
                <div className='p-3 bg-light rounded border'>
                  {formik.values.end_date_time ? (
                    <div className='d-flex align-items-center'>
                      <i className='bi bi-calendar-event me-2' />
                      <span>
                        {new Date(formik.values.end_date_time).toLocaleString('en-GB', {
                          timeZone: 'Asia/Bangkok',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ) : (
                    <span className='text-muted'>Not set</span>
                  )}
                </div>
              ) : (
                <>
                  <input
                    type='datetime-local'
                    {...formik.getFieldProps('end_date_time')}
                    className={fieldClass('end_date_time')}
                    disabled={isSubmitting}
                    min={formik.values.start_date_time}
                  />
                  {formik.touched.end_date_time && formik.errors.end_date_time && (
                    <div className='fv-plugins-message-container'>
                      <span role='alert' className='fv-help-block text-danger'>
                        {formik.errors.end_date_time}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Summary Card */}
        {(calculatedDays > 0 || formik.values.start_date_time) && (
          <div className='card border border-dashed border-primary bg-light-primary mb-7'>
            <div className='card-body p-4'>
              <div className='d-flex align-items-center justify-content-between'>
                <div className='d-flex align-items-center'>
                  <div className='symbol symbol-45px symbol-circle me-4'>
                    <div className='symbol-label bg-primary bg-opacity-10'>
                      <i className='bi bi-calendar-check text-primary fs-3' />
                    </div>
                  </div>
                  <div>
                    <div className='fs-7 text-muted'>Total Leave Days</div>
                    <div className='fs-2 fw-bold text-primary'>
                      {calculatedDays} day{calculatedDays !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className='text-end'>
                  <div className='fs-7 text-muted'>Remaining after</div>
                  <div
                    className={clsx('fw-bold fs-4', {
                      'text-success': employeeLeaveDays - calculatedDays > 3,
                      'text-warning': employeeLeaveDays - calculatedDays > 0 && employeeLeaveDays - calculatedDays <= 3,
                      'text-danger': employeeLeaveDays - calculatedDays <= 0,
                    })}
                  >
                    {employeeLeaveDays - calculatedDays} days
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conflict Warning */}
        {!isStatusFinal && conflictWarning && (
          <div className='alert alert-warning d-flex align-items-center mb-7'>
            <i className='bi bi-exclamation-triangle-fill fs-2 me-3 text-warning' />
            <div>
              <div className='fw-bold'>Date Conflict Detected</div>
              <div className='fs-7'>{conflictWarning}</div>
            </div>
          </div>
        )}

        {/* Supervisor Selection */}
        <div className='fv-row mb-7'>
          <label className='required fw-bold fs-6 mb-2'>Supervisor(s)</label>
          {isStatusFinal ? (
            <div className='p-3 bg-light rounded border'>
              {formik.values.supervisor_id.length > 0 ? (
                <ul className='list-unstyled mb-0'>
                  {formik.values.supervisor_id.map((sid) => {
                    const supervisor = findUserById(sid)
                    return supervisor ? (
                      <li key={sid} className='mb-2'>
                        <div className='d-flex align-items-center'>
                          <i className='bi bi-person-check me-2 text-success' />
                          <div>
                            <div className='fw-semibold'>{getUserDisplayName(supervisor)}</div>
                            <div className='text-muted fs-7'>{supervisor.user_email}</div>
                            <div className='badge bg-secondary fs-8'>{supervisor.role}</div>
                          </div>
                        </div>
                      </li>
                    ) : (
                      <li key={sid} className='text-muted'>
                        <i className='bi bi-person-x me-2' />
                        Supervisor ID: {sid.substring(0, 8)}...
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <span className='text-muted'>No supervisors selected</span>
              )}
            </div>
          ) : (
            <div>
              <div className='form-control form-control-solid p-3'>
                {loadingUsers ? (
                  <div className='text-center py-3'>
                    <span className='spinner-border spinner-border-sm me-2' />
                    Loading supervisors...
                  </div>
                ) : filteredSupervisors.length > 0 ? (
                  <div className='d-flex flex-column gap-2'>
                    {filteredSupervisors.map((supervisor) => {
                      const supervisorId = getUserId(supervisor)
                      return (
                        <div key={supervisorId} className='form-check form-check-custom form-check-solid'>
                          <input
                            className='form-check-input'
                            type='checkbox'
                            id={`supervisor-${supervisorId}`}
                            value={supervisorId}
                            checked={formik.values.supervisor_id.includes(supervisorId)}
                            onChange={(e) => handleSupervisorChange(e.target.value, e.target.checked)}
                            disabled={isSubmitting}
                          />
                          <label
                            className='form-check-label d-flex align-items-center'
                            htmlFor={`supervisor-${supervisorId}`}
                          >
                            <div>
                              <div className='fw-semibold text-gray-800'>
                                {getUserDisplayName(supervisor)}
                              </div>
                              <div className='text-muted fs-7'>{supervisor.user_email}</div>
                              <div className='badge bg-secondary fs-8'>{supervisor.role}</div>
                            </div>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className='text-muted'>No supervisors available</div>
                )}
              </div>
              <div className='mt-2'>
                {formik.values.supervisor_id.length > 0 && (
                  <div className='badge bg-primary'>
                    <i className='bi bi-check-circle me-1' />
                    {formik.values.supervisor_id.length} supervisor(s) selected
                  </div>
                )}
              </div>
              {!isStatusFinal && formik.touched.supervisor_id && formik.errors.supervisor_id && (
                <div className='fv-plugins-message-container mt-2'>
                  <span role='alert' className='fv-help-block text-danger'>
                    {formik.errors.supervisor_id}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className='fv-row mb-7'>
          <label className='fw-bold fs-6 mb-2'>
            Description
            <span className='text-muted fw-normal ms-2 fs-7'>(optional)</span>
          </label>
          {isStatusFinal ? (
            <div className='p-3 bg-light rounded border text-gray-700 fs-6'>
              {request?.description || (
                <span className='text-muted'>No description</span>
              )}
            </div>
          ) : (
            <>
              <textarea
                {...formik.getFieldProps('description')}
                rows={3}
                maxLength={500}
                placeholder='Add a note or reason (optional)...'
                className={clsx('form-control form-control-solid', {
                  'is-invalid': formik.touched.description && !!formik.errors.description,
                })}
                disabled={isSubmitting}
              />
              <div className='text-end text-muted fs-8 mt-1'>
                {(formik.values.description || '').length}/500
              </div>
            </>
          )}
        </div>

        {/* Approve/Reject Section */}
        {canApprove && (
          <div className='card border border-dashed mb-7'>
            <div className='card-body p-4'>
              <div className='fw-bold fs-6 mb-3 text-gray-700'>
                <i className='bi bi-shield-check me-2 text-primary' />
                Supervisor Action
              </div>
              <div className='d-flex gap-3'>
                <button
                  type='button'
                  className='btn btn-success flex-grow-1'
                  onClick={() => handleStatusChange('Accepted')}
                  disabled={isSubmitting}
                >
                  {statusMutation.isLoading ? (
                    <span className='spinner-border spinner-border-sm me-2' />
                  ) : (
                    <i className='bi bi-check-circle me-2' />
                  )}
                  Approve
                </button>
                <button
                  type='button'
                  className='btn btn-danger flex-grow-1'
                  onClick={() => handleStatusChange('Rejected')}
                  disabled={isSubmitting}
                >
                  {statusMutation.isLoading ? (
                    <span className='spinner-border spinner-border-sm me-2' />
                  ) : (
                    <i className='bi bi-x-circle me-2' />
                  )}
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Status Display */}
        {isEditMode && request?.status && (
          <div className='fv-row mb-7'>
            <label className='fw-bold fs-6 mb-2'>Current Status</label>
            <div>
              <span className={`badge ${getSatSunStatusBadgeClass(request.status)} fs-6 px-4 py-2`}>
                {request.status}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className='d-flex justify-content-between align-items-center pt-3 border-top'>
          <div>
            {canEdit && (
              <button
                type='button'
                className='btn btn-danger'
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {deleteMutation.isLoading ? (
                  <>
                    <span className='spinner-border spinner-border-sm me-2' />
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className='bi bi-trash me-2' />
                    Delete
                  </>
                )}
              </button>
            )}
          </div>
          <div className='d-flex gap-3'>
            <button
              type='button'
              className='btn btn-light'
              onClick={cancel}
              disabled={isSubmitting}
            >
              {isStatusFinal ? 'Close' : 'Cancel'}
            </button>
            {!isStatusFinal && (
              <button
                type='submit'
                className='btn btn-primary'
                disabled={
                  isSubmitting ||
                  isRequestLoading ||
                  !formik.isValid ||
                  formik.values.supervisor_id.length === 0 ||
                  !dayChoiceValid
                }
              >
                {isSubmitting ? (
                  <>
                    <span className='spinner-border spinner-border-sm me-2' />
                    Please wait...
                  </>
                ) : (
                  <>
                    <i className={clsx('me-2', {
                      'bi bi-plus-circle': !isEditMode,
                      'bi bi-pencil-square': isEditMode,
                    })} />
                    {isEditMode ? 'Update Request' : 'Submit Request'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {(isSubmitting || isRequestLoading) && <SatSunListLoading />}
    </>
  )
}

export { SatSunRequestEditModalForm }