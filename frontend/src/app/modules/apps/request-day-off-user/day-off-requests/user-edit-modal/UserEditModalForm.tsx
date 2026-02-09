import { FC, useEffect, useState } from 'react'
import * as Yup from 'yup'
import { useFormik, FormikHelpers } from 'formik'
import clsx from 'clsx'
import { isNotEmpty } from '../../../../../../_metronic/helpers'
import { DayOffRequest, DayOffRequestDTO, initialDayOffRequest, FormattedDayOffRequest } from '../core/_models'
import { useListView } from '../core/ListViewProvider'
import { DayoffrequestsListLoading } from '../components/loading/DayoffrequestsListtLoading'
import { createDayOffRequest, updateDayOffRequest, checkDateOverlap, deleteDayOffRequest } from '../core/_requests'
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

  // ✅ Determine if form should be read-only
  const isStatusFinal = request?.status === 'Accepted' || request?.status === 'Rejected'
  const isEditMode = !!request

  // ✅ Helper function to extract ID from User or string
  const extractId = (item: string | User | undefined): string => {
    if (!item) return ''
    if (typeof item === 'string') return item
    if (typeof item === 'object') {
      return item.id || item._id || ''
    }
    return ''
  }

  // ✅ Helper function to extract supervisor IDs from various formats
  const extractSupervisorIds = (supervisorField: string | string[] | User | User[] | undefined): string[] => {
    if (!supervisorField) return []
    
    if (Array.isArray(supervisorField)) {
      return supervisorField.map(item => extractId(item)).filter(Boolean)
    }
    
    return [extractId(supervisorField)].filter(Boolean)
  }

  /* -------------------- Formik Setup -------------------- */
  const formik = useFormik<DayOffRequestDTO & { _id?: string; id?: string }>({
    initialValues: {
      ...initialDayOffRequest,
      employee_id: currentUser?.id || currentUser?._id || '', // ✅ Set default employee_id
      _id: request?._id || (request as any)?.id,
      id: request?._id || (request as any)?.id,
    },
    validationSchema: isStatusFinal ? undefined : dayOffRequestSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }: FormikHelpers<DayOffRequestDTO & { _id?: string; id?: string }>) => {
      if (isStatusFinal) {
        setSubmitting(false)
        return
      }

      try {
        // ✅ Debug log
        console.log('📝 Form values before submit:', values)
        
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

        // ✅ Ensure all required fields are present
        const submitData: DayOffRequestDTO = {
          user_id: values.user_id || currentUser?.id || currentUser?._id || '',
          employee_id: values.employee_id || currentUser?.id || currentUser?._id || '',
          supervisor_id: values.supervisor_id,
          day_off_type: values.day_off_type,
          start_date_time: values.start_date_time,
          end_date_time: values.end_date_time,
          title: values.title,
        }

        console.log('📤 Submitting day off request:', submitData)

        // ✅ Validate before sending
        if (!submitData.employee_id) {
          throw new Error('Employee ID is missing')
        }
        
        if (!submitData.supervisor_id || submitData.supervisor_id.length === 0) {
          throw new Error('At least one supervisor must be selected')
        }

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
              employee_id: extractId(currentUser),
              supervisor_id: [],
            }
          })
        }

        setItemIdForUpdate(undefined)
      } catch (err: unknown) {
        console.error('❌ Submit error:', err)
        
        // ✅ Show error to user
        Swal.fire({
          icon: 'error',
          title: 'Submission Error',
          text: err instanceof Error ? err.message : 'Failed to submit request',
          confirmButtonText: 'OK'
        })
      } finally {
        setSubmitting(false)
      }
    },
  })

  /* -------------------- Helper Functions -------------------- */
  
  // Fetch all users
  const fetchUsers = async () => {
    if (isStatusFinal) return
    
    setLoadingUsers(true)
    try {
      const res = await axios.get<{ data: User[] }>(`${API_URL}/users`)
      setUsers(res.data.data || [])
      
      // ✅ ถ้ามี currentUser ให้ set เป็น employee_id โดย default
      if (currentUser && !formik.values.employee_id) {
        formik.setFieldValue('employee_id', extractId(currentUser))
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
    if (isStatusFinal) return
    
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

  // Helper function to get user ID
  const getUserId = (user: User): string => {
    return user.id || user._id || ''
  }

  // ✅ Find user by ID
  const findUserById = (id: string): User | undefined => {
    return users.find(user => getUserId(user) === id)
  }

  /* -------------------- Effects -------------------- */

  // Fetch users เมื่อ component mount
  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ✅ Set employee_id เมื่อมี currentUser
  useEffect(() => {
    if (currentUser && !formik.values.employee_id && !request) {
      formik.setFieldValue('employee_id', currentUser.id || currentUser._id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  // Filter supervisors เมื่อ employee เปลี่ยน
  useEffect(() => {
    if (isStatusFinal) return
    
    if (formik.values.employee_id) {
      const employee = users.find(u => getUserId(u) === formik.values.employee_id)
      if (employee) {
        // กรอง supervisor ที่มี role เป็น supervisor หรือ admin
        const supervisors = users.filter(user => 
          (user.role === 'supervisor' || user.role === 'admin') && 
          getUserId(user) !== getUserId(employee)
        )
        setFilteredSupervisors(supervisors)
      } else {
        // ถ้าไม่เจอ employee ใน users list ให้แสดง supervisors ทั้งหมด
        const supervisors = users.filter(user => 
          user.role === 'supervisor' || user.role === 'admin'
        )
        setFilteredSupervisors(supervisors)
      }
    } else {
      // ถ้ายังไม่มี employee ให้แสดง supervisors ทั้งหมด
      const supervisors = users.filter(user => 
        user.role === 'supervisor' || user.role === 'admin'
      )
      setFilteredSupervisors(supervisors)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.employee_id, users])

  // ตรวจสอบการทับซ้อนเมื่อวันที่เปลี่ยน
  useEffect(() => {
    if (isStatusFinal) return
    
    const timer = setTimeout(() => {
      checkForDateOverlap()
    }, 500)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.start_date_time, formik.values.end_date_time, formik.values.employee_id])

  // Set initial values เมื่อมี request
  useEffect(() => {
    if (request) {
      console.log('🔍 Setting initial values from request:', request)
      
      // ✅ Extract employee_id
      let employeeId = ''
      if (request.employee_id) {
        if (typeof request.employee_id === 'string') {
          employeeId = request.employee_id
        } else if (typeof request.employee_id === 'object') {
          const empObj = request.employee_id as any
          employeeId = empObj._id || empObj.id || ''
        }
      }

      // ✅ Extract user_id
      let userId = ''
      if (request.user_id) {
        if (typeof request.user_id === 'string') {
          userId = request.user_id
        } else if (typeof request.user_id === 'object') {
          const userObj = request.user_id as any
          userId = userObj._id || userObj.id || ''
        }
      }

      // ✅ Extract supervisor_ids
      const supervisorIds = extractSupervisorIds(request.supervisor_id)
      console.log('📋 Extracted supervisor IDs:', supervisorIds)

      // Format dates
      const formatDate = (date: Date | string) => {
        if (!date) return ''
        const dateObj = new Date(date)
        return format(dateObj, "yyyy-MM-dd'T'HH:mm")
      }

      formik.setValues({
        user_id: userId || currentUser?.id || currentUser?._id || '',
        employee_id: employeeId || currentUser?.id || currentUser?._id || '',
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

  const deleteMutation = useMutation(
    (id: string) => deleteDayOffRequest(id),
    {
      onSuccess: () => {
        Swal.fire({
          icon: 'success',
          title: '<span style="color: #10b981;">Request Deleted</span>',
          text: 'The day off request has been successfully deleted.',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          invalidateRequests()
          setItemIdForUpdate(undefined)
        })
      },
      onError: (error: AxiosError<{ message?: string }>) => {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete request'
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonText: 'OK',
        })
      },
    }
  )

  /* -------------------- Delete Handler -------------------- */
  const handleDelete = async () => {
    const requestId = request?._id || (request as any)?.id
    if (!requestId) return

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    })

    if (result.isConfirmed) {
      deleteMutation.mutate(requestId)
    }
  }

  /* -------------------- Render Helpers -------------------- */

  const isEditMode = !!request
  const isSubmitting = formik.isSubmitting || createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading
  
  const fieldClass = (name: keyof DayOffRequestDTO) =>
    clsx('form-control form-control-solid', {
      'is-invalid': formik.touched[name] && formik.errors[name],
      'is-valid': formik.touched[name] && !formik.errors[name],
      'bg-light': isStatusFinal,
      'cursor-not-allowed': isStatusFinal,
    })

  const cancel = () => setItemIdForUpdate(undefined)

  // คำนวณจำนวนวันลาแสดงผล
  const calculatedDays = calculateDays(
    formik.values.start_date_time,
    formik.values.end_date_time,
    formik.values.day_off_type
  )

  // Get user name for display
  const getUserDisplayName = (user: User): string => {
    return user.user_name || 
           `${user.first_name_en || ''} ${user.last_name_en || ''}`.trim() || 
           user.user_email || 
           'Unknown'
  }

  return (
    <>
      {isStatusFinal && (
        <div className="alert alert-info mb-5">
          <div className="d-flex align-items-center">
            <i className="bi bi-lock-fill fs-2 me-3"></i>
            <div>
              <h5 className="fw-bold mb-1">Request Finalized</h5>
              <p className="mb-0">
                This request has been <span className="fw-bold">{request?.status}</span> and cannot be modified.
              </p>
            </div>
          </div>
        </div>
      )}

      <form className="form" onSubmit={formik.handleSubmit} noValidate>
        {/* ✅ Debug Info - Remove in production */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="alert alert-info mb-5">
            <small>
              <strong>Debug Info:</strong><br/>
              Employee ID: {formik.values.employee_id || 'Not set'}<br/>
              Supervisors: {formik.values.supervisor_id.length} selected<br/>
              Valid: {formik.isValid ? 'Yes' : 'No'}
            </small>
          </div>
        )} */}

        {/* Title */}
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Title</label>
          <input
            type="text"
            {...formik.getFieldProps('title')}
            placeholder="e.g., Annual Leave, Sick Leave, Personal Leave"
            className={fieldClass('title')}
            disabled={isSubmitting || isRequestLoading || isStatusFinal}
            readOnly={isStatusFinal}
          />
          {!isStatusFinal && formik.touched.title && formik.errors.title && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block text-danger">
                {formik.errors.title}
              </span>
            </div>
          )}
        </div>

        {/* Current User Info */}
        {currentUser && (
          <div className="alert alert-primary d-flex align-items-center mb-7">
            <i className="bi bi-person-check-fill fs-2 me-3"></i>
            <div>
              <div className="fw-bold">Requesting for:</div>
              <div className="text-gray-800">
                {currentUser.user_name || `${currentUser.first_name_en} ${currentUser.last_name_en}`}
              </div>
              <div className="text-muted fs-7">{currentUser.user_email}</div>
            </div>
          </div>
        )}

        {/* Supervisors Selection */}
        {/* <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">
            Supervisor(s)
            {filteredSupervisors.length > 0 && (
              <span className="badge badge-light-primary ms-2">
                {filteredSupervisors.length} available
              </span>
            )}
          </label>
          
          {filteredSupervisors.length === 0 ? (
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              No supervisors available. Please contact your administrator.
            </div>
          ) : (
            <div className="row g-3">
              {filteredSupervisors.map(supervisor => {
                const supervisorId = supervisor.id || supervisor._id
                const isSelected = formik.values.supervisor_id.includes(supervisorId || '')
                
                return (
                  <div key={supervisorId} className="col-12">
                    <div
                      className={`card cursor-pointer border-2 ${isSelected
                        ? 'border-success bg-light-success'
                        : 'border-gray-300 hover-border-primary'
                      }`}
                      onClick={() => {
                        if (!isSubmitting && !isRequestLoading) {
                          const currentSupervisors = [...formik.values.supervisor_id]
                          if (isSelected) {
                            // Remove
                            const filtered = currentSupervisors.filter(id => id !== supervisorId)
                            formik.setFieldValue('supervisor_id', filtered)
                          } else {
                            // Add
                            formik.setFieldValue('supervisor_id', [...currentSupervisors, supervisorId])
                          }
                        }
                      }}
                      style={{ 
                        transition: 'all 0.3s ease',
                        cursor: isSubmitting || isRequestLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <div className='card-body p-4'>
                        <div className='d-flex align-items-center'>
                          <div className={`symbol symbol-40px symbol-circle me-3 ${isSelected ? 'bg-success' : 'bg-light'}`}>
                            <div className='symbol-label'>
                              <i className={`bi ${isSelected ? 'bi-check-circle-fill' : 'bi-person'} fs-2 ${isSelected ? 'text-white' : 'text-gray-600'}`}></i>
                            </div>
                          </div>
                          <div className='flex-grow-1'>
                            <div className='fw-bold text-gray-800'>
                              {supervisor.user_name || `${supervisor.first_name_en} ${supervisor.last_name_en}`}
                            </div>
                            <div className='text-muted fs-7'>{supervisor.user_email}</div>
                          </div>
                          {isSelected && (
                            <div className='badge badge-success'>Selected</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          <div className="text-muted fs-7 mt-2">
            <i className="bi bi-info-circle me-1"></i>
            {formik.values.supervisor_id.length} supervisor(s) selected
          </div>
          
          {formik.touched.supervisor_id && formik.errors.supervisor_id && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block text-danger">
                {formik.errors.supervisor_id}
              </span>
            </div>
          )}
        </div> */}

        {/* Day Off Type */}
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Day Off Type</label>
          {isStatusFinal ? (
            <div className="p-3 bg-light rounded border">
              <div className="d-flex align-items-center">
                <i className={`bi ${formik.values.day_off_type === 'FULL_DAY' ? 'bi-calendar-day' : 'bi-calendar-half'} me-2 fs-4`}></i>
                <span className="fw-bold">
                  {formik.values.day_off_type === 'FULL_DAY' ? 'Full Day' : 'Half Day'}
                </span>
              </div>
            </div>
          ) : (
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
          )}
          {!isStatusFinal && formik.touched.day_off_type && formik.errors.day_off_type && (
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
            {isStatusFinal ? (
              <div className="p-3 bg-light rounded border">
                {formik.values.start_date_time ? (
                  <div className="d-flex align-items-center">
                    <i className="bi bi-calendar-event me-2"></i>
                    <span>{new Date(formik.values.start_date_time).toLocaleString()}</span>
                  </div>
                ) : (
                  <span className="text-muted">Not set</span>
                )}
              </div>
            ) : (
              <input
                type="datetime-local"
                {...formik.getFieldProps('start_date_time')}
                className={fieldClass('start_date_time')}
                disabled={isSubmitting || isRequestLoading}
              />
            )}
            {!isStatusFinal && formik.touched.start_date_time && formik.errors.start_date_time && (
              <div className="fv-plugins-message-container">
                <span role="alert" className="fv-help-block text-danger">
                  {formik.errors.start_date_time}
                </span>
              </div>
            )}
          </div>
          <div className="col-md-6">
            <label className="required fw-bold fs-6 mb-2">End Date & Time</label>
            {isStatusFinal ? (
              <div className="p-3 bg-light rounded border">
                {formik.values.end_date_time ? (
                  <div className="d-flex align-items-center">
                    <i className="bi bi-calendar-event me-2"></i>
                    <span>{new Date(formik.values.end_date_time).toLocaleString()}</span>
                  </div>
                ) : (
                  <span className="text-muted">Not set</span>
                )}
              </div>
            ) : (
              <input
                type="datetime-local"
                {...formik.getFieldProps('end_date_time')}
                className={fieldClass('end_date_time')}
                disabled={isSubmitting || isRequestLoading}
              />
            )}
            {!isStatusFinal && formik.touched.end_date_time && formik.errors.end_date_time && (
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
        {!isStatusFinal && dateOverlap.hasOverlap && (
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
          
          {/* Delete Button - แสดงเฉพาะในโหมดแก้ไข */}
          {isEditMode && (
            <button
              type="button"
              className="btn btn-danger me-3"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {deleteMutation.isLoading ? (
                <>
                  <span className='spinner-border spinner-border-sm align-middle me-2'></span>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="bi bi-trash me-2"></i>
                  Delete Request
                </>
              )}
            </button>
          )}
          
          <button
            type='submit'
            className='btn btn-primary'
            disabled={isSubmitting || isRequestLoading || !formik.isValid || formik.values.supervisor_id.length === 0}
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
          
          {/* Delete Button */}
          {canEdit && (
            <button
              type="button"
              className="btn btn-danger me-3"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {deleteMutation.isLoading ? (
                <>
                  <span className='spinner-border spinner-border-sm align-middle me-2'></span>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="bi bi-trash me-2"></i>
                  Delete Request
                </>
              )}
            </button>
          )}
          
          {/* Submit Button */}
          {!isStatusFinal && (
            <button
              type='submit'
              className='btn btn-primary'
              disabled={isSubmitting || isRequestLoading || !formik.isValid || formik.values.supervisor_id.length === 0}
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
          )}
        </div>
      </form>

      {(isSubmitting || isRequestLoading) && <DayoffrequestsListLoading />}
    </>
  )
}

export { DayOffRequestEditModalForm }