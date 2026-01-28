import { FC, useState, useEffect, useMemo } from 'react'
import * as Yup from 'yup'
import { useFormik } from 'formik'
import { Event } from '../core/_models'
import clsx from 'clsx'
import { useListView } from '../core/ListViewProvider'
import { EventsListLoading } from '../components/loading/EventsListLoading'
import { createEvent, updateEvent, getUsers, getEventTypes, createEventType, EventType } from '../core/_requests'
import { useQueryResponse } from '../core/QueryResponseProvider'
import { toast } from 'react-toastify'

type Props = {
  isEventLoading: boolean
  event: Event | null
}

interface EventFormValues {
  user_id: string
  event_name: string
  event_type_id: string
  person_in_charge: string[]
  description?: string
  start_date: string
  end_date: string
  comment?: string
  require_participation_response: boolean
}

const eventSchema = Yup.object().shape({
  user_id: Yup.string().required('User ID is required'),
  event_name: Yup.string()
    .min(3, 'Minimum 3 symbols')
    .max(100, 'Maximum 100 symbols')
    .required('Event name is required'),
  event_type_id: Yup.string().required('Event type is required'),
  start_date: Yup.string().required('Start date is required'),
  end_date: Yup.string()
    .required('End date is required')
    .test('is-after-start', 'End date must be after start date', function (value) {
      const { start_date } = this.parent
      if (!value || !start_date) return true
      return new Date(value) > new Date(start_date)
    }),
  description: Yup.string().max(500, 'Maximum 500 symbols'),
  person_in_charge: Yup.array().of(Yup.string()),
  require_participation_response: Yup.boolean()
})

const eventTypeSchema = Yup.object().shape({
  event_type_name: Yup.string()
    .min(3, 'Minimum 3 characters')
    .max(50, 'Maximum 50 characters')
    .required('Event type name is required'),
  event_type_color: Yup.string()
    .matches(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .required('Color is required'),
})

const PRESET_COLORS = [
  '#FF5733', '#3498DB', '#E74C3C', '#F39C12', 
  '#9B59B6', '#1ABC9C', '#34495E', '#16A085',
  '#2ECC71', '#C0392B', '#8E44AD', '#2C3E50',
  '#27AE60', '#E67E22', '#95A5A6', '#D35400'
]

const formatForDateTimeInput = (date: Date | string | null | undefined): string => {
  if (!date) return ''
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return ''
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const hours = String(dateObj.getHours()).padStart(2, '0')
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

const parseFromDateTimeInput = (value: string): string => {
  if (!value) return ''
  try {
    return new Date(value).toISOString()
  } catch (error) {
    console.error('Error parsing date:', error)
    return ''
  }
}

const getUserId = (user: any): string | undefined => {
  if (!user || user === '' || user === 'undefined' || user === 'null') return undefined
  if (typeof user === 'object') {
    return user._id || user.id || user.user_id
  }
  return user
}

const getEventId = (event: any): string | undefined => {
  if (!event) return undefined
  const actualEvent = event.data || event.event || event
  return (
    actualEvent.event_id ||
    actualEvent._id ||
    actualEvent.id ||
    actualEvent.eventId ||
    event.event_id ||
    event._id ||
    event.id
  )
}

const getCurrentUserFromStorage = (): any => {
  try {
    const localStorageKeys = ['currentUser', 'user', 'auth_user', 'auth']
    for (const key of localStorageKeys) {
      const userData = localStorage.getItem(key)
      if (userData) {
        try {
          return JSON.parse(userData)
        } catch (e) {
          continue
        }
      }
    }
    return null
  } catch (error) {
    console.error('Error getting user from storage:', error)
    return null
  }
}

const getCurrentUserId = (): string | null => {
  const user = getCurrentUserFromStorage()
  if (user) {
    return user._id || user.id || user.user_id || user.userId || null
  }
  return null
}

const EventEditModalForm: FC<Props> = ({ event, isEventLoading }) => {
  const { setItemIdForUpdate } = useListView()
  const { refetch } = useQueryResponse()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loadingEventTypes, setLoadingEventTypes] = useState(false)
  const [showEventTypeModal, setShowEventTypeModal] = useState(false)
  const [selectedPresetColor, setSelectedPresetColor] = useState<string>('#3498DB')

  const fetchEventTypes = async () => {
    setLoadingEventTypes(true)
    try {
      const types = await getEventTypes()
      setEventTypes(types)
    } catch (error) {
      console.error('Error fetching event types:', error)
      toast.error('Unable to load event types')
    } finally {
      setLoadingEventTypes(false)
    }
  }

  useEffect(() => {
    fetchEventTypes()
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true)
      try {
        const response = await getUsers('')
        setUsers(response.data || [])
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Unable to load user list')
      } finally {
        setLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    const userId = getCurrentUserId()
    if (userId) {
      setCurrentUserId(userId)
      setIsInitialized(true)
    } else {
      const dummyUserId = '65f7a8b9c1e6a4b3c8d9e0f1'
      setCurrentUserId(dummyUserId)
      setIsInitialized(true)
      if (process.env.NODE_ENV === 'production') {
        toast.warning('Please log in before creating an event')
      }
    }
  }, [])

  const initialValues = useMemo((): EventFormValues => {
    const actualEvent = (event as any)?.data || (event as any)?.event || event
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

    let userId = ''
    if (actualEvent?.user_id) {
      userId = getUserId(actualEvent.user_id) || ''
    } else if (currentUserId) {
      userId = currentUserId
    }

    let eventTypeId = ''
    if (actualEvent?.event_type_id) {
      eventTypeId = actualEvent.event_type_id._id || actualEvent.event_type_id.id || actualEvent.event_type_id
    } else if (eventTypes.length > 0) {
      eventTypeId = eventTypes[0].id || eventTypes[0]._id || ''
    }

    let personInCharge: string[] = []
    if (actualEvent?.person_in_charge && Array.isArray(actualEvent.person_in_charge)) {
      personInCharge = actualEvent.person_in_charge
        .map((p: any) => {
          // รองรับทั้ง format เดิม (string) และ format ใหม่ (object)
          if (typeof p === 'string') return p
          if (p.user_id) return getUserId(p.user_id)
          return getUserId(p)
        })
        .filter((id: any): id is string => Boolean(id))
    }

    return {
      user_id: userId,
      event_name: actualEvent?.event_name || '',
      event_type_id: eventTypeId,
      person_in_charge: personInCharge,
      description: actualEvent?.description || '',
      start_date: actualEvent?.start_date
        ? formatForDateTimeInput(actualEvent.start_date)
        : formatForDateTimeInput(now),
      end_date: actualEvent?.end_date
        ? formatForDateTimeInput(actualEvent.end_date)
        : formatForDateTimeInput(oneHourLater),
      comment: actualEvent?.comment || '',
      require_participation_response: actualEvent?.require_participation_response || false
    }
  }, [event, currentUserId, eventTypes])

  const eventTypeFormik = useFormik({
    initialValues: {
      event_type_name: '',
      event_type_color: '#3498DB',
    },
    validationSchema: eventTypeSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setSubmitting(true)
      try {
        await createEventType({
          event_type_name: values.event_type_name.trim(),
          event_type_color: values.event_type_color.toUpperCase(),
        })
        toast.success('Event type created successfully!')
        resetForm()
        setShowEventTypeModal(false)
        await fetchEventTypes()
      } catch (ex: any) {
        console.error('Create event type error:', ex)
        const errorMessage = ex.response?.data?.message || ex.message || 'An error occurred'
        toast.error(errorMessage)
      } finally {
        setSubmitting(false)
      }
    },
  })

  const cancel = (withRefresh?: boolean) => {
    if (withRefresh) {
      refetch()
    }
    setItemIdForUpdate(undefined)
  }

  const formik = useFormik<EventFormValues>({
    initialValues,
    validationSchema: eventSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setSubmitting(true)
      try {
        const formData: any = { ...values }

        if (!formData.user_id && currentUserId) {
          formData.user_id = currentUserId
        }

        if (!formData.user_id) {
          const userId = getCurrentUserId()
          if (userId) {
            formData.user_id = userId
          } else {
            toast.error('Please log in before creating an event')
            setSubmitting(false)
            return
          }
        }

        const currentUserData = getCurrentUserFromStorage()
        
        if (currentUserData?.role === 'CEO') {
          formData.status = 'approved'
          formData.approved_by = currentUserData._id || currentUserData.id
        }

        // ✅ ส่ง person_in_charge เป็น array ของ user_ids 
        // Backend จะแปลงเป็น object format เอง
        if (formData.person_in_charge && Array.isArray(formData.person_in_charge) && formData.person_in_charge.length > 0) {
          // ส่งไปเป็น array ของ strings
        } else {
          formData.person_in_charge = []
        }

        if (!formData.comment || formData.comment.trim() === '') {
          delete formData.comment
        }

        if (formData.start_date) {
          formData.start_date = parseFromDateTimeInput(formData.start_date)
        }
        if (formData.end_date) {
          formData.end_date = parseFromDateTimeInput(formData.end_date)
        }

        const actualEvent = (event as any)?.data || (event as any)?.event || event
        const eventId = getEventId(actualEvent)

        if (eventId) {
          const updateData = {
            ...formData,
            requesting_user_id: currentUserId || getCurrentUserId()
          }
          await updateEvent(String(eventId), updateData)
          toast.success('Event updated successfully')
        } else {
          await createEvent(formData)
          if (currentUserData?.role === 'CEO') {
            toast.success('✅ Event created and approved automatically!')
          } else {
            toast.success('Event created successfully. Waiting for approval.')
          }
        }

        resetForm()
        cancel(true)
      } catch (ex: any) {
        console.error('Submit error:', ex)
        if (ex.response?.data) {
          const errorMessage = ex.response.data.message || 'Error saving data'
          toast.error(errorMessage)
        } else {
          toast.error(ex.message || 'An error occurred')
        }
      } finally {
        setSubmitting(false)
      }
    },
  })

  const toggleParticipant = (userId: string) => {
    const current = formik.values.person_in_charge || []
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId]
    formik.setFieldValue('person_in_charge', updated)
  }

  const removeParticipant = (userId: string) => {
    formik.setFieldValue(
      'person_in_charge',
      (formik.values.person_in_charge || []).filter(id => id !== userId)
    )
  }

  const selectedUsers = useMemo(() => {
    return users.filter(user =>
      (formik.values.person_in_charge || []).includes(user.id || user._id)
    )
  }, [formik.values.person_in_charge, users])

  const selectedEventType = useMemo(() => {
    return eventTypes.find(t => (t.id || t._id) === formik.values.event_type_id)
  }, [formik.values.event_type_id, eventTypes])

  if (!isInitialized) {
    return (
      <div className="text-center p-10">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading user data...</p>
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <div className="text-center p-10">
        <div className="alert alert-warning">
          <h3>Please log in</h3>
          <p>You need to log in before creating or editing events</p>
        </div>
      </div>
    )
  }

  const isEditMode = !!getEventId(event)

  const getDepartmentName = (user: any): string => {
    if (!user) return 'No department specified'
    if (user.department_id && user.department_id.department_name) {
      return user.department_id.department_name
    }
    if (user.department_name) return user.department_name
    if (user.department) return user.department
    return 'No department specified'
  }

  const getUserName = (user: any): string => {
    if (!user) return 'Unnamed'
    return (
      user.user_name || 
      user.name || 
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
      'Unnamed'
    )
  }

  return (
    <>
      <form
        key={getEventId((event as any)?.data || (event as any)?.event || event) || 'new-event'}
        id='kt_modal_add_event_form'
        className='form'
        onSubmit={formik.handleSubmit}
        noValidate
      >
        <div
          className='d-flex flex-column scroll-y me-n7 pe-7'
          id='kt_modal_add_event_scroll'
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
          {/* Event Name */}
          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-2'>Event Name</label>
            <input
              placeholder='Enter event name'
              value={formik.values.event_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name='event_name'
              type='text'
              className={clsx(
                'form-control form-control-solid mb-3 mb-lg-0',
                { 'is-invalid': formik.touched.event_name && formik.errors.event_name },
                { 'is-valid': formik.touched.event_name && !formik.errors.event_name }
              )}
              autoComplete='off'
              disabled={formik.isSubmitting || isEventLoading}
            />
            {formik.touched.event_name && formik.errors.event_name && (
              <div className='fv-plugins-message-container'>
                <div className='fv-help-block text-danger'>
                  <span role='alert'>{formik.errors.event_name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Event Type Dropdown */}
          <div className='fv-row mb-7'>
            <div className='d-flex justify-content-between align-items-center mb-2'>
              <label className='required fw-bold fs-6'>Event Type</label>
              <button
                type='button'
                className='btn btn-sm btn-light-primary'
                onClick={() => setShowEventTypeModal(true)}
                disabled={formik.isSubmitting || isEventLoading}
              >
                <i className='bi bi-plus-circle me-1'></i>
                Create New Type
              </button>
            </div>
            
            {loadingEventTypes ? (
              <div className='text-center p-3'>
                <span className='spinner-border spinner-border-sm me-2'></span>
                Loading event types...
              </div>
            ) : eventTypes.length === 0 ? (
              <div className='alert alert-warning d-flex align-items-center'>
                <i className='bi bi-exclamation-triangle me-2'></i>
                <span>No event types available. Please create event types first.</span>
              </div>
            ) : (
              <>
                <select
                  name='event_type_id'
                  value={formik.values.event_type_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={clsx(
                    'form-select form-select-solid',
                    { 'is-invalid': formik.touched.event_type_id && formik.errors.event_type_id },
                    { 'is-valid': formik.touched.event_type_id && !formik.errors.event_type_id }
                  )}
                  disabled={formik.isSubmitting || isEventLoading}
                >
                  <option value=''>Select event type</option>
                  {eventTypes.map((type) => (
                    <option key={type.id || type._id} value={type.id || type._id}>
                      {type.event_type_name}
                    </option>
                  ))}
                </select>
                
                {selectedEventType && (
                  <div className='mt-3'>
                    <div 
                      className='badge p-3 d-inline-flex align-items-center'
                      style={{ 
                        backgroundColor: selectedEventType.event_type_color,
                        color: '#fff'
                      }}
                    >
                      <i className='bi bi-circle-fill me-2'></i>
                      {selectedEventType.event_type_name}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {formik.touched.event_type_id && formik.errors.event_type_id && (
              <div className='fv-plugins-message-container'>
                <div className='fv-help-block text-danger'>
                  <span role='alert'>{formik.errors.event_type_id}</span>
                </div>
              </div>
            )}
          </div>

          {/* Person In Charge Multi-Select */}
          <div className='fv-row mb-7'>
            <label className='fw-bold fs-6 mb-2'>Participants</label>

            {selectedUsers.length > 0 && (
              <div className='mb-3 d-flex flex-wrap gap-2'>
                {selectedUsers.map((user) => (
                  <span
                    key={user.id || user._id}
                    className='badge badge-light-primary d-flex align-items-center gap-2 p-2'
                  >
                    <span>{getUserName(user)}</span>
                    <button
                      type='button'
                      className='btn btn-icon btn-sm btn-active-light-primary'
                      onClick={() => removeParticipant(user.id || user._id)}
                      disabled={formik.isSubmitting}
                      style={{ padding: '0 4px' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className='position-relative'>
              <button
                type='button'
                className='btn btn-light-primary w-100 text-start d-flex justify-content-between align-items-center'
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={loadingUsers || formik.isSubmitting}
              >
                <span>{loadingUsers ? 'Loading...' : '+ Select participants'}</span>
                <span className='badge badge-light-info'>
                  {(formik.values.person_in_charge || []).length} / {users.length}
                </span>
              </button>

              {isDropdownOpen && (
                <div
                  className='position-absolute bg-white border rounded shadow-sm w-100 mt-1'
                  style={{ maxHeight: '300px', overflowY: 'auto', zIndex: 1000 }}
                >
                  <div className='p-3 border-bottom bg-light'>
                    <div className='d-flex justify-content-between align-items-center'>
                      <span className='fw-bold text-gray-700'>
                        Select {(formik.values.person_in_charge || []).length} of {users.length}
                      </span>
                      <div className='d-flex gap-2'>
                        <button
                          type='button'
                          className='btn btn-sm btn-light-primary'
                          onClick={() => {
                            const allUserIds = users.map(u => u.id || u._id)
                            formik.setFieldValue('person_in_charge', allUserIds)
                          }}
                          disabled={formik.isSubmitting}
                        >
                          Select All
                        </button>
                        <button
                          type='button'
                          className='btn btn-sm btn-light-danger'
                          onClick={() => formik.setFieldValue('person_in_charge', [])}
                          disabled={formik.isSubmitting}
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                  </div>

                  {users.length === 0 ? (
                    <div className='p-3 text-center text-muted'>No user data available</div>
                  ) : (
                    users.map((user) => {
                      const userId = user.id || user._id
                      const isSelected = (formik.values.person_in_charge || []).includes(userId)
                      return (
                        <div
                          key={userId}
                          className={`p-3 cursor-pointer border-bottom ${isSelected ? 'bg-light-primary' : ''}`}
                          onClick={() => toggleParticipant(userId)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className='d-flex align-items-center'>
                            <input
                              type='checkbox'
                              className='form-check-input me-3'
                              checked={isSelected}
                              readOnly
                            />
                            <div className='flex-grow-1'>
                              <div className='fw-bold text-gray-800'>{getUserName(user)}</div>
                              <div className='text-muted small'>{getDepartmentName(user)}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ✅ Participation Response Toggle */}
          <div className='fv-row mb-7'>
            <div className='form-check form-switch form-check-custom form-check-solid'>
              <input
                className='form-check-input'
                type='checkbox'
                id='require_participation_response'
                name='require_participation_response'
                checked={formik.values.require_participation_response}
                onChange={formik.handleChange}
                disabled={formik.isSubmitting || isEventLoading || (formik.values.person_in_charge || []).length === 0}
              />
              <label className='form-check-label fw-bold fs-6' htmlFor='require_participation_response'>
                Require participants to confirm attendance
              </label>
            </div>
            <div className='text-muted fs-7 mt-2'>
              <i className='bi bi-info-circle me-1'></i>
              When enabled, selected participants will be asked to confirm if they will attend this event
              {(formik.values.person_in_charge || []).length === 0 && ' (Please select participants first)'}
            </div>
            
            {formik.values.require_participation_response && (formik.values.person_in_charge || []).length > 0 && (
              <div className='alert alert-info d-flex align-items-center mt-3'>
                <i className='bi bi-envelope me-2'></i>
                <span>
                  <strong>{(formik.values.person_in_charge || []).length}</strong> participants will receive a notification to confirm their attendance
                </span>
              </div>
            )}
          </div>

          {/* Start Date */}
          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-2'>Start Date</label>
            <input
              value={formik.values.start_date}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name='start_date'
              type='datetime-local'
              className={clsx(
                'form-control form-control-solid',
                { 'is-invalid': formik.touched.start_date && formik.errors.start_date }
              )}
              disabled={formik.isSubmitting || isEventLoading}
            />
            {formik.touched.start_date && formik.errors.start_date && (
              <div className='fv-help-block text-danger'>{formik.errors.start_date}</div>
            )}
          </div>

          {/* End Date */}
          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-2'>End Date</label>
            <input
              value={formik.values.end_date}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              name='end_date'
              type='datetime-local'
              className={clsx(
                'form-control form-control-solid',
                { 'is-invalid': formik.touched.end_date && formik.errors.end_date }
              )}
              disabled={formik.isSubmitting || isEventLoading}
            />
            {formik.touched.end_date && formik.errors.end_date && (
              <div className='fv-help-block text-danger'>{formik.errors.end_date}</div>
            )}
          </div>

          {/* Description */}
          <div className='fv-row mb-7'>
            <label className='fw-bold fs-6 mb-2'>Description</label>
            <textarea
              placeholder='Enter event description'
              value={formik.values.description || ''}
              onChange={formik.handleChange}
              name='description'
              rows={3}
              className='form-control form-control-solid'
              disabled={formik.isSubmitting || isEventLoading}
            />
          </div>

          {/* Comment */}
          <div className='fv-row mb-7'>
            <label className='fw-bold fs-6 mb-2'>Additional Comments</label>
            <textarea
              placeholder='Any additional comments'
              value={formik.values.comment || ''}
              onChange={formik.handleChange}
              name='comment'
              rows={2}
              className='form-control form-control-solid'
              disabled={formik.isSubmitting || isEventLoading}
            />
          </div>
        </div>

        <input type="hidden" name="user_id" value={formik.values.user_id} />

        {/* Actions */}
        <div className='text-center pt-15'>
          <button
            type='button'
            onClick={() => cancel()}
            className='btn btn-light me-3'
            disabled={formik.isSubmitting || isEventLoading}
          >
            Cancel
          </button>

          <button
            type='submit'
            className='btn btn-primary'
            disabled={formik.isSubmitting || isEventLoading || !formik.isValid}
          >
            <span className='indicator-label'>
              {isEditMode ? 'Update' : 'Create'}
            </span>
            {(formik.isSubmitting || isEventLoading) && (
              <span className='indicator-progress'>
                Please wait...{' '}
                <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Event Type Modal */}
      {showEventTypeModal && (
        <div className='modal fade show d-block' tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className='modal-dialog modal-dialog-centered modal-lg'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>Create New Event Type</h5>
                <button
                  type='button'
                  className='btn-close'
                  onClick={() => setShowEventTypeModal(false)}
                ></button>
              </div>
              <div className='modal-body'>
                <form onSubmit={eventTypeFormik.handleSubmit}>
                  {/* Event Type Name */}
                  <div className='fv-row mb-7'>
                    <label className='required fw-bold fs-6 mb-2'>Event Type Name</label>
                    <input
                      placeholder='e.g., Annual Leave, Training'
                      value={eventTypeFormik.values.event_type_name}
                      onChange={eventTypeFormik.handleChange}
                      name='event_type_name'
                      type='text'
                      className={clsx(
                        'form-control form-control-solid',
                        { 'is-invalid': eventTypeFormik.touched.event_type_name && eventTypeFormik.errors.event_type_name }
                      )}
                    />
                    {eventTypeFormik.touched.event_type_name && eventTypeFormik.errors.event_type_name && (
                      <div className='fv-help-block text-danger'>{eventTypeFormik.errors.event_type_name}</div>
                    )}
                  </div>

                  {/* Color Picker */}
                  <div className='fv-row mb-7'>
                    <label className='required fw-bold fs-6 mb-2'>Color</label>
                    
                    {/* Preset Colors */}
                    <div className='mb-4'>
                      <label className='form-label fs-7 text-muted mb-3'>Preset Colors</label>
                      <div className='d-flex flex-wrap gap-2'>
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type='button'
                            className={clsx(
                              'btn btn-icon btn-sm position-relative',
                              selectedPresetColor === color && 'border border-3 border-primary'
                            )}
                            style={{
                              backgroundColor: color,
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                            }}
                            onClick={() => {
                              eventTypeFormik.setFieldValue('event_type_color', color)
                              setSelectedPresetColor(color)
                            }}
                          >
                            {selectedPresetColor === color && (
                              <i className='bi bi-check-lg text-white fs-4'></i>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Color */}
                    <div>
                      <label className='form-label fs-7 text-muted mb-2'>Custom Color</label>
                      <div className='d-flex align-items-center gap-3'>
                        <input
                          value={eventTypeFormik.values.event_type_color}
                          onChange={(e) => {
                            eventTypeFormik.setFieldValue('event_type_color', e.target.value)
                            setSelectedPresetColor(e.target.value)
                          }}
                          name='event_type_color'
                          type='color'
                          className='form-control form-control-color'
                          style={{ width: '60px', height: '40px' }}
                        />
                        <input
                          placeholder='#RRGGBB'
                          value={eventTypeFormik.values.event_type_color}
                          onChange={(e) => {
                            let value = e.target.value.toUpperCase()
                            if (!value.startsWith('#')) value = '#' + value
                            eventTypeFormik.setFieldValue('event_type_color', value)
                          }}
                          type='text'
                          className='form-control form-control-solid flex-grow-1'
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className='fv-row mb-7'>
                    <label className='fw-bold fs-6 mb-2'>Preview</label>
                    <div 
                      className='p-4 rounded d-flex align-items-center justify-content-center'
                      style={{
                        backgroundColor: eventTypeFormik.values.event_type_color,
                        minHeight: '80px',
                      }}
                    >
                      <span className='text-white fw-bold fs-4'>
                        {eventTypeFormik.values.event_type_name || 'Event Type Name'}
                      </span>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className='text-center pt-3'>
                    <button
                      type='button'
                      onClick={() => setShowEventTypeModal(false)}
                      className='btn btn-light me-3'
                      disabled={eventTypeFormik.isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className='btn btn-primary'
                      disabled={eventTypeFormik.isSubmitting || !eventTypeFormik.isValid}
                    >
                      {eventTypeFormik.isSubmitting ? (
                        <>
                          <span className='spinner-border spinner-border-sm me-2'></span>
                          Creating...
                        </>
                      ) : (
                        'Create Event Type'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {(formik.isSubmitting || isEventLoading) && <EventsListLoading />}
    </>
  )
}

export { EventEditModalForm }