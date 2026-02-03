import { FC, useEffect, useState } from 'react'
import * as Yup from 'yup'
import { useFormik, FormikHelpers } from 'formik'
import clsx from 'clsx'
import { isNotEmpty } from '../../../../../../_metronic/helpers'
import { DayOffRequest, DayOffRequestDTO, initialDayOffRequest, FormattedDayOffRequest } from '../core/_models'
import { useListView } from '../core/ListViewProvider'
import { DayoffrequestsListLoading } from '../components/loading/DayoffrequestsListtLoading'
import { createDayOffRequest, updateDayOffRequest, checkDateOverlap } from '../core/_requests'
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
  user_email?: string
  role?: string
  status?: string
}

type Props = {
  isRequestLoading: boolean
  request?: DayOffRequest | FormattedDayOffRequest
  currentUser?: User
}

/* -------------------- Validation -------------------- */
const dayOffRequestSchema = Yup.object().shape({
  employee_id: Yup.string().required('Employee is required'),
  supervisor_id: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one supervisor is required')
    .required('Supervisor(s) is required'),
  day_off_type: Yup.string()
    .oneOf(['FULL_DAY', 'HALF_DAY'], 'Invalid day off type')
    .required('Day off type is required'),
  start_date_time: Yup.date()
    .required('Start date is required')
    .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Start date cannot be in the past'),
  end_date_time: Yup.date()
    .required('End date is required')
    .min(Yup.ref('start_date_time'), 'End date must be after start date'),
  title: Yup.string()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
})

/* -------------------- Component -------------------- */
const DayOffRequestEditModalForm: FC<Props> = ({ request, isRequestLoading, currentUser }) => {
  const { setItemIdForUpdate } = useListView()
  const { query } = useQueryResponse()
  const queryClient = useQueryClient()
  
  // State
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [dateOverlap, setDateOverlap] = useState<{hasOverlap: boolean; message: string}>({
    hasOverlap: false,
    message: ''
  })
  const [filteredSupervisors, setFilteredSupervisors] = useState<User[]>([])

  // API URL
  const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8001/api'

  /* -------------------- Formik Setup -------------------- */
  const formik = useFormik<DayOffRequestDTO & { _id?: string; id?: string }>({
    initialValues: {
      ...initialDayOffRequest,
      _id: request?._id || (request as any)?.id,
      id: request?._id || (request as any)?.id,
    },
    validationSchema: dayOffRequestSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }: FormikHelpers<DayOffRequestDTO & { _id?: string; id?: string }>) => {
      try {
        // ตรวจสอบวันที่ทับซ้อนอีกครั้งก่อนส่ง
        await checkForDateOverlap()
        if (dateOverlap.hasOverlap) {
          const confirm = await Swal.fire({
            title: 'Date Overlap Detected',
            text: 'There are overlapping requests. Do you want to proceed anyway?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, proceed',
            cancelButtonText: 'Cancel'
          })
          
          if (!confirm.isConfirmed) {
            setSubmitting(false)
            return
          }
        }

        const submitData: DayOffRequestDTO = {
          user_id: values.user_id || currentUser?.id || currentUser?._id || '',
          employee_id: values.employee_id,
          supervisor_id: values.supervisor_id,
          day_off_type: values.day_off_type,
          start_date_time: values.start_date_time,
          end_date_time: values.end_date_time,
          title: values.title,
        }

        console.log('📤 Submitting day off request:', submitData)

        if (isNotEmpty(values._id || values.id)) {
          await updateMutation.mutateAsync({ id: (values._id || values.id)!, data: submitData })
        } else {
          await createMutation.mutateAsync(submitData)
        }

        // Reset form หลังจาก success (เฉพาะกรณีสร้างใหม่)
        if (!isNotEmpty(values._id || values.id)) {
          resetForm({
            values: {
              ...initialDayOffRequest,
              employee_id: currentUser?.id || currentUser?._id || '',
            }
          })
        }

        setItemIdForUpdate(undefined)
      } catch (err: unknown) {
        console.error('❌ Submit error:', err)
      } finally {
        setSubmitting(false)
      }
    },
  })

  /* -------------------- Helper Functions -------------------- */
  
  // Fetch all users
  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await axios.get<{ data: User[] }>(`${API_URL}/users`)
      setUsers(res.data.data || [])
      
      // ถ้ามี currentUser ให้ set เป็น employee_id โดย default
      if (currentUser && !formik.values.employee_id) {
        formik.setFieldValue('employee_id', currentUser.id || currentUser._id)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Unable to load users',
        confirmButtonText: 'OK'
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  // คำนวณจำนวนวันลา
  const calculateDays = (startDate: string, endDate: string, dayOffType: string): number => {
    if (!startDate || !endDate) return 0
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (dayOffType === 'HALF_DAY') {
      return 0.5
    }
    
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  // ตรวจสอบวันที่ทับซ้อน
  const checkForDateOverlap = async () => {
    const employeeId = formik.values.employee_id
    const startDate = formik.values.start_date_time
    const endDate = formik.values.end_date_time
    const excludeId = request?._id || (request as any)?.id
    
    if (!employeeId || !startDate || !endDate) return
    
    try {
      const result = await checkDateOverlap(employeeId, startDate, endDate, excludeId)
      
      if (result.hasOverlap) {
        setDateOverlap({
          hasOverlap: true,
          message: `Dates overlap with ${result.overlappingRequests?.length || 0} existing request(s)`
        })
      } else {
        setDateOverlap({ hasOverlap: false, message: '' })
      }
    } catch (error) {
      console.error('Error checking date overlap:', error)
    }
  }

  /* -------------------- Effects -------------------- */

  // Fetch users เมื่อ component mount
  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter supervisors เมื่อ employee เปลี่ยน
  useEffect(() => {
    if (formik.values.employee_id) {
      const employee = users.find(u => (u.id || u._id) === formik.values.employee_id)
      if (employee) {
        // กรอง supervisor ที่มี role เป็น supervisor หรือ admin
        const supervisors = users.filter(user => 
          (user.role === 'supervisor' || user.role === 'admin') && 
          (user.id || user._id) !== (employee.id || employee._id)
        )
        setFilteredSupervisors(supervisors)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.employee_id, users])

  // ตรวจสอบการทับซ้อนเมื่อวันที่เปลี่ยน
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForDateOverlap()
    }, 500)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.start_date_time, formik.values.end_date_time, formik.values.employee_id])

  // Set initial values เมื่อมี request
  useEffect(() => {
    if (request) {
      // Convert supervisor_id จาก string/object เป็น array ของ string
      let supervisorIds: string[] = []
      if (request.supervisor_id) {
        if (Array.isArray(request.supervisor_id)) {
          supervisorIds = request.supervisor_id.map(sup => {
            if (typeof sup === 'string') return sup
            if (typeof sup === 'object' && sup !== null) {
              const supObj = sup as any
              return supObj._id || supObj.id || ''
            }
            return ''
          }).filter(Boolean)
        } else if (typeof request.supervisor_id === 'string') {
          supervisorIds = [request.supervisor_id]
        } else if (typeof request.supervisor_id === 'object') {
          const supObj = request.supervisor_id as any
          supervisorIds = [supObj._id || supObj.id || ''].filter(Boolean)
        }
      }

      // Convert employee_id
      let employeeId = ''
      if (request.employee_id) {
        if (typeof request.employee_id === 'string') {
          employeeId = request.employee_id
        } else if (typeof request.employee_id === 'object') {
          const empObj = request.employee_id as any
          employeeId = empObj._id || empObj.id || ''
        }
      }

      // Convert user_id
      let userId = ''
      if (request.user_id) {
        if (typeof request.user_id === 'string') {
          userId = request.user_id
        } else if (typeof request.user_id === 'object') {
          const userObj = request.user_id as any
          userId = userObj._id || userObj.id || ''
        }
      }

      // Format dates
      const formatDate = (date: Date | string) => {
        if (!date) return ''
        const dateObj = new Date(date)
        return format(dateObj, "yyyy-MM-dd'T'HH:mm")
      }

      formik.setValues({
        user_id: userId || currentUser?.id || currentUser?._id || '',
        employee_id: employeeId,
        supervisor_id: supervisorIds,
        day_off_type: request.day_off_type || 'FULL_DAY',
        start_date_time: formatDate(request.start_date_time),
        end_date_time: formatDate(request.end_date_time),
        title: request.title || '',
        _id: request._id || (request as any)?.id,
        id: request._id || (request as any)?.id,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request])

  /* -------------------- Mutations -------------------- */

  const invalidateRequests = () =>
    queryClient.invalidateQueries([`${QUERIES.DAY_OFF_REQUESTS_LIST}-${query}`] as QueryKey)

  const createMutation = useMutation(createDayOffRequest, {
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: '<span style="color: #10b981; font-weight: bold;">Request Created</span>',
        text: 'The day off request has been successfully created.',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        invalidateRequests()
      })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Something went wrong!'

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonText: 'OK',
      })
    },
  })

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<DayOffRequestDTO> }) => 
      updateDayOffRequest(id, data),
    {
      onSuccess: () => {
        Swal.fire({
          icon: 'success',
          title: '<span style="color: #10b981;">Request Updated</span>',
          text: 'The day off request has been successfully updated.',
          confirmButtonText: 'OK',
        }).then(() => {
          invalidateRequests()
        })
      },
      onError: (error: AxiosError<{ message?: string }>) => {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update request'
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonText: 'OK',
        })
      },
    }
  )

  /* -------------------- Render Helpers -------------------- */

  const isEditMode = !!request
  const isSubmitting = formik.isSubmitting || createMutation.isLoading || updateMutation.isLoading
  
  const fieldClass = (name: keyof DayOffRequestDTO) =>
    clsx('form-control form-control-solid', {
      'is-invalid': formik.touched[name] && formik.errors[name],
      'is-valid': formik.touched[name] && !formik.errors[name],
    })

  const cancel = () => setItemIdForUpdate(undefined)

  // คำนวณจำนวนวันลาแสดงผล
  const calculatedDays = calculateDays(
    formik.values.start_date_time,
    formik.values.end_date_time,
    formik.values.day_off_type
  )

  return (
    <>
      <form className="form" onSubmit={formik.handleSubmit} noValidate>
        {/* Title */}
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Title</label>
          <input
            type="text"
            {...formik.getFieldProps('title')}
            placeholder="e.g., Annual Leave, Sick Leave, Personal Leave"
            className={fieldClass('title')}
            disabled={isSubmitting || isRequestLoading}
          />
          {formik.touched.title && formik.errors.title && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block text-danger">
                {formik.errors.title}
              </span>
            </div>
          )}
        </div>

        {/* Employee (Dropdown) */}
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Employee</label>
          <select
            {...formik.getFieldProps('employee_id')}
            className={fieldClass('employee_id')}
            disabled={isSubmitting || isRequestLoading || loadingUsers || !!currentUser}
          >
            <option value="">Select Employee</option>
            {users
              .filter(user => user.role === 'employee' && user.status === 'Active')
              .map(user => (
                <option key={user.id || user._id} value={user.id || user._id}>
                  {user.user_name || `${user.first_name_en} ${user.last_name_en}`} - {user.user_email}
                </option>
              ))}
          </select>
          {formik.touched.employee_id && formik.errors.employee_id && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block text-danger">
                {formik.errors.employee_id}
              </span>
            </div>
          )}
          {currentUser && (
            <div className="text-muted fs-7 mt-1">
              <i className="bi bi-info-circle me-1"></i>
              You are requesting for yourself
            </div>
          )}
        </div>

        {/* Supervisors (Multiple Select) */}
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Supervisor(s)</label>
          <select
            multiple
            {...formik.getFieldProps('supervisor_id')}
            className={`${fieldClass('supervisor_id')} form-select`}
            disabled={isSubmitting || isRequestLoading || loadingUsers}
            size={4}
            value={formik.values.supervisor_id}
            onChange={(e) => {
              const options = e.target.options
              const selectedValues: string[] = []
              for (let i = 0; i < options.length; i++) {
                if (options[i].selected) {
                  selectedValues.push(options[i].value)
                }
              }
              formik.setFieldValue('supervisor_id', selectedValues)
            }}
          >
            <option value="" disabled>Select Supervisor(s) - Hold Ctrl/Cmd to select multiple</option>
            {filteredSupervisors.map(user => (
              <option key={user.id || user._id} value={user.id || user._id}>
                {user.user_name || `${user.first_name_en} ${user.last_name_en}`} ({user.role})
              </option>
            ))}
          </select>
          <div className="text-muted fs-7 mt-1">
            <i className="bi bi-info-circle me-1"></i>
            Selected: {formik.values.supervisor_id.length} supervisor(s)
          </div>
          {formik.touched.supervisor_id && formik.errors.supervisor_id && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block text-danger">
                {formik.errors.supervisor_id}
              </span>
            </div>
          )}
        </div>

        {/* Day Off Type */}
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Day Off Type</label>
          <div className="d-flex gap-4">
            <div className="form-check form-check-custom form-check-solid">
              <input
                className="form-check-input"
                type="radio"
                id="fullDay"
                value="FULL_DAY"
                checked={formik.values.day_off_type === 'FULL_DAY'}
                onChange={() => formik.setFieldValue('day_off_type', 'FULL_DAY')}
                disabled={isSubmitting || isRequestLoading}
              />
              <label className="form-check-label fw-bold text-gray-800" htmlFor="fullDay">
                Full Day
              </label>
            </div>
            <div className="form-check form-check-custom form-check-solid">
              <input
                className="form-check-input"
                type="radio"
                id="halfDay"
                value="HALF_DAY"
                checked={formik.values.day_off_type === 'HALF_DAY'}
                onChange={() => formik.setFieldValue('day_off_type', 'HALF_DAY')}
                disabled={isSubmitting || isRequestLoading}
              />
              <label className="form-check-label fw-bold text-gray-800" htmlFor="halfDay">
                Half Day
              </label>
            </div>
          </div>
          {formik.touched.day_off_type && formik.errors.day_off_type && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block text-danger">
                {formik.errors.day_off_type}
              </span>
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="row g-6 mb-7">
          <div className="col-md-6">
            <label className="required fw-bold fs-6 mb-2">Start Date & Time</label>
            <input
              type="datetime-local"
              {...formik.getFieldProps('start_date_time')}
              className={fieldClass('start_date_time')}
              disabled={isSubmitting || isRequestLoading}
            />
            {formik.touched.start_date_time && formik.errors.start_date_time && (
              <div className="fv-plugins-message-container">
                <span role="alert" className="fv-help-block text-danger">
                  {formik.errors.start_date_time}
                </span>
              </div>
            )}
          </div>
          <div className="col-md-6">
            <label className="required fw-bold fs-6 mb-2">End Date & Time</label>
            <input
              type="datetime-local"
              {...formik.getFieldProps('end_date_time')}
              className={fieldClass('end_date_time')}
              disabled={isSubmitting || isRequestLoading}
            />
            {formik.touched.end_date_time && formik.errors.end_date_time && (
              <div className="fv-plugins-message-container">
                <span role="alert" className="fv-help-block text-danger">
                  {formik.errors.end_date_time}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Calculated Days Display */}
        <div className="fv-row mb-7">
          <div className="card bg-light-primary border border-primary border-dashed">
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div className="symbol symbol-40px symbol-circle me-4">
                  <div className="symbol-label bg-primary bg-opacity-10">
                    <i className="bi bi-calendar-check text-primary fs-2"></i>
                  </div>
                </div>
                <div>
                  <div className="fs-6 text-gray-600">Total Leave Days</div>
                  <div className="fs-2 fw-bold text-primary">
                    {calculatedDays} day{calculatedDays !== 1 ? 's' : ''}
                  </div>
                  {formik.values.day_off_type === 'HALF_DAY' && (
                    <div className="fs-7 text-muted">(Half day leave)</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Overlap Warning */}
        {dateOverlap.hasOverlap && (
          <div className="alert alert-warning d-flex align-items-center mb-7">
            <i className="bi bi-exclamation-triangle-fill fs-2 me-3"></i>
            <div className="d-flex flex-column">
              <span className="fw-bold">Warning: Date Overlap Detected</span>
              <span className="fs-7">{dateOverlap.message}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="text-end pt-3">
          <button
            type="button"
            className="btn btn-light me-3"
            onClick={cancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type='submit'
            className='btn btn-primary'
            disabled={isSubmitting || isRequestLoading || !formik.isValid}
          >
            {!isSubmitting && (
              <span className='indicator-label'>
                {isEditMode ? 'Update Request' : 'Create Request'}
              </span>
            )}
            {isSubmitting && (
              <span className='indicator-progress'>
                Please wait...{' '}
                <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
              </span>
            )}
          </button>
        </div>
      </form>

      {(isSubmitting || isRequestLoading) && <DayoffrequestsListLoading />}
    </>
  )
}

export { DayOffRequestEditModalForm }