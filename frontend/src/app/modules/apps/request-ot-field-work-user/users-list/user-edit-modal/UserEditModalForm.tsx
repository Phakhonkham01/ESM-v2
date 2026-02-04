import { FC, useEffect, useState } from 'react'
import * as Yup from 'yup'
import { useFormik, FormikHelpers } from 'formik'
import clsx from 'clsx'
import { isNotEmpty } from '../../../../../../_metronic/helpers'
import { initialRequestOTFieldWork, RequestOTFieldWorkDTO, RequestOTFieldWork } from '../core/_models'
import { useListView } from '../core/ListViewProvider'
import { UsersListLoading } from '../components/loading/UsersListLoading'
import { createRequest, updateRequest } from '../core/_requests'
import { useQueryResponse } from '../core/QueryResponseProvider'
import { QUERIES } from '../../../../../../_metronic/helpers/crud-helper/consts'
import { useMutation, useQueryClient, QueryKey } from 'react-query'
import axios, { AxiosError } from 'axios'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'

type Props = {
  isUserLoading: boolean
  request?: RequestOTFieldWork
}

interface User {
  _id?: string
  id?: string
  user_name: string
  user_email: string
  first_name_en: string
  last_name_en: string
  role: 'admin' | 'employee' | 'supervisor'
}

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
    status?: number
  }
  message?: string
}

/* -------------------- Validation -------------------- */
const requestSchema = Yup.object().shape({
  user_id: Yup.string().required('User is required'),
  supervisor_id: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one supervisor is required')
    .required('Supervisor is required'),
  date: Yup.string().required('Date is required'),
  title: Yup.string()
    .oneOf(['OT', 'FIELD_WORK'], 'Invalid title')
    .required('Title is required'),
  start_hour: Yup.string()
    .matches(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)')
    .required('Start hour is required'),
  end_hour: Yup.string()
    .matches(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)')
    .required('End hour is required'),
  fuel: Yup.number().min(0, 'Fuel must be >= 0').required('Fuel is required'),
  date_off: Yup.string().nullable(),
  description: Yup.string().max(500, 'Description must not exceed 500 characters'),
  reason: Yup.string()
    .min(3, 'Reason must be at least 3 characters')
    .required('Reason is required'),
})

/* -------------------- Component -------------------- */
const UserEditModalForm: FC<Props> = ({ request, isUserLoading }) => {
  const { setItemIdForUpdate } = useListView()
  const { query } = useQueryResponse()
  const queryClient = useQueryClient()

  const [users, setUsers] = useState<User[]>([])
  const [supervisors, setSupervisors] = useState<User[]>([])
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([])

  const API_URL = import.meta.env.VITE_APP_API_URL

  // ✅ Extract user ID helper
  const extractUserId = (userId: string | User | null | undefined): string => {
    if (!userId) return ''
    if (typeof userId === 'string') return userId
    if (typeof userId === 'object' && userId !== null) {
      return (userId as User)._id || (userId as User).id || ''
    }
    return ''
  }

  // ✅ Extract supervisor IDs helper
  const extractSupervisorIds = (
    supervisorId: string | string[] | User | User[] | null | undefined
  ): string[] => {
    if (!supervisorId) return []

    if (Array.isArray(supervisorId)) {
      return supervisorId
        .map((sup) => {
          if (typeof sup === 'string') return sup
          if (typeof sup === 'object' && sup !== null) {
            return (sup as User)._id || (sup as User).id || ''
          }
          return ''
        })
        .filter(Boolean)
    }

    if (typeof supervisorId === 'string') return [supervisorId]

    if (typeof supervisorId === 'object' && supervisorId !== null) {
      const supId = (supervisorId as User)._id || (supervisorId as User).id || ''
      return supId ? [supId] : []
    }

    return []
  }

  const formik = useFormik<RequestOTFieldWorkDTO>({
    initialValues: {
      user_id: extractUserId(request?.user_id) || '',
      supervisor_id: extractSupervisorIds(request?.supervisor_id) || [],
      date: request?.date
        ? new Date(request.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      title: request?.title || 'OT',
      start_hour: request?.start_hour || '08:00',
      end_hour: request?.end_hour || '17:00',
      fuel: request?.fuel || 0,
      date_off: request?.date_off
        ? new Date(request.date_off).toISOString().split('T')[0]
        : null,
      description: request?.description || '',
      reason: request?.reason || '',
    },
    validationSchema: requestSchema,
    enableReinitialize: true,
    onSubmit: async (
      values,
      { setSubmitting, resetForm }: FormikHelpers<RequestOTFieldWorkDTO>
    ) => {
      try {
        const submitData = {
          ...values,
          supervisor_id: selectedSupervisors.length > 0 ? selectedSupervisors : values.supervisor_id,
        }

        console.log('📤 Submitting request data:', submitData)

        if (request?._id || request?.id) {
  // ✅ ส่งเป็น object ที่มี id และ data แยกกัน
  const requestId = request._id || request.id || ''
  await updateMutation.mutateAsync({ 
    id: requestId, 
    data: submitData  // ✅ ต้องใส่ data: ข้างหน้า
  })
} else {
  await createMutation.mutateAsync(submitData)
}

        // ✅ Reset form after success
        if (!request?._id && !request?.id) {
          resetForm({
            values: {
              ...initialRequestOTFieldWork,
            },
          })
          setSelectedSupervisors([])
        }

        setItemIdForUpdate(undefined)
      } catch (err: unknown) {
        console.error('❌ Submit error:', err)
      } finally {
        setSubmitting(false)
      }
    },
  })

  // ✅ Fetch users and supervisors
  const fetchUsers = async () => {
    try {
      const res = await axios.get<{ data: User[] }>(`${API_URL}/users`)
      const allUsers = res.data.data || []
      setUsers(allUsers)

      // Filter supervisors
      const sups = allUsers.filter((u) => u.role === 'supervisor' || u.role === 'admin')
      setSupervisors(sups)
    } catch (err: unknown) {
      console.error('Error fetching users', err)
      toast.error('Unable to load users')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (request?.supervisor_id) {
      const ids = extractSupervisorIds(request.supervisor_id)
      setSelectedSupervisors(ids)
    }
  }, [request])

  const invalidateRequests = () =>
    queryClient.invalidateQueries([`${QUERIES.USERS_LIST}-${query}`] as QueryKey)

  const createMutation = useMutation(createRequest, {
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: '<span style="color: #10b981; font-weight: bold;">Request Created</span>',
        text: 'The request has been successfully created.',
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

  const updateMutation = useMutation(updateRequest, {
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: '<span style="color: #10b981;">Request Updated</span>',
        text: 'The request has been successfully updated.',
        confirmButtonText: 'OK',
      }).then(() => {
        invalidateRequests()
      })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to update request'
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonText: 'OK',
      })
    },
  })

  const isEditMode = !!request?._id || !!request?.id
  const isSubmitting =
    formik.isSubmitting || createMutation.isLoading || updateMutation.isLoading

  const fieldClass = (name: keyof RequestOTFieldWorkDTO) =>
    clsx('form-control form-control-solid', {
      'is-invalid': formik.touched[name] && formik.errors[name],
    })

  const cancel = () => setItemIdForUpdate(undefined)

  const handleSupervisorChange = (supervisorId: string, checked: boolean) => {
    let newSelected: string[]
    if (checked) {
      newSelected = [...selectedSupervisors, supervisorId]
    } else {
      newSelected = selectedSupervisors.filter((id) => id !== supervisorId)
    }
    setSelectedSupervisors(newSelected)
    formik.setFieldValue('supervisor_id', newSelected)
  }

  return (
    <>
      <form className="form" onSubmit={formik.handleSubmit} noValidate>
        {/* User Selection */}
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Employee</label>
          <select
            {...formik.getFieldProps('user_id')}
            className={fieldClass('user_id')}
            disabled={isSubmitting || isUserLoading || isEditMode}
          >
            <option value="">Select employee</option>
            {users
              .filter((u) => u.role === 'employee')
              .map((user) => (
                <option key={user._id || user.id} value={user._id || user.id}>
                  {user.user_name || `${user.first_name_en} ${user.user_name}`}
                </option>
              ))}
          </select>
          {formik.touched.user_id && formik.errors.user_id && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block">
                {formik.errors.user_id}
              </span>
            </div>
          )}
        </div>

        {/* Supervisor Selection (Multiple) */}
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Supervisors</label>
          <div className="border rounded p-3 bg-light">
            {supervisors.length === 0 ? (
              <div className="text-muted">No supervisors available</div>
            ) : (
              supervisors.map((sup) => (
                <div key={sup._id || sup.id} className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`sup-${sup._id || sup.id}`}
                    checked={selectedSupervisors.includes(sup._id || sup.id || '')}
                    onChange={(e) =>
                      handleSupervisorChange(sup._id || sup.id || '', e.target.checked)
                    }
                    disabled={isSubmitting || isUserLoading}
                  />
                  <label className="form-check-label" htmlFor={`sup-${sup._id || sup.id}`}>
                    {sup.user_name || `${sup.first_name_en}`} ({sup.role})
                  </label>
                </div>
              ))
            )}
          </div>
          {formik.touched.supervisor_id && formik.errors.supervisor_id && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block">
                {formik.errors.supervisor_id}
              </span>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Date</label>
          <input
            type="date"
            {...formik.getFieldProps('date')}
            className={fieldClass('date')}
            disabled={isSubmitting || isUserLoading}
          />
          {formik.touched.date && formik.errors.date && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block">
                {formik.errors.date}
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Type</label>
          <div className="d-flex gap-5">
            <div className="form-check form-check-custom form-check-solid">
              <input
                className="form-check-input"
                type="radio"
                id="title-ot"
                value="OT"
                checked={formik.values.title === 'OT'}
                onChange={() => formik.setFieldValue('title', 'OT')}
                disabled={isSubmitting || isUserLoading}
              />
              <label className="form-check-label fw-bold" htmlFor="title-ot">
                Over Time (OT)
              </label>
            </div>
            <div className="form-check form-check-custom form-check-solid">
              <input
                className="form-check-input"
                type="radio"
                id="title-field"
                value="FIELD_WORK"
                checked={formik.values.title === 'FIELD_WORK'}
                onChange={() => formik.setFieldValue('title', 'FIELD_WORK')}
                disabled={isSubmitting || isUserLoading}
              />
              <label className="form-check-label fw-bold" htmlFor="title-field">
                Field Work
              </label>
            </div>
          </div>
          {formik.touched.title && formik.errors.title && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block">
                {formik.errors.title}
              </span>
            </div>
          )}
        </div>

        {/* Time Range */}
        <div className="row g-6 mb-7">
          <div className="col-md-6">
            <label className="required fw-bold fs-6 mb-2">Start Hour</label>
            <input
              type="time"
              {...formik.getFieldProps('start_hour')}
              className={fieldClass('start_hour')}
              disabled={isSubmitting || isUserLoading}
            />
            {formik.touched.start_hour && formik.errors.start_hour && (
              <div className="fv-plugins-message-container">
                <span role="alert" className="fv-help-block">
                  {formik.errors.start_hour}
                </span>
              </div>
            )}
          </div>
          <div className="col-md-6">
            <label className="required fw-bold fs-6 mb-2">End Hour</label>
            <input
              type="time"
              {...formik.getFieldProps('end_hour')}
              className={fieldClass('end_hour')}
              disabled={isSubmitting || isUserLoading}
            />
            {formik.touched.end_hour && formik.errors.end_hour && (
              <div className="fv-plugins-message-container">
                <span role="alert" className="fv-help-block">
                  {formik.errors.end_hour}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fuel */}
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Fuel Cost (LAK)</label>
          <div className="input-group">
            <input
              type="number"
              {...formik.getFieldProps('fuel')}
              className={fieldClass('fuel')}
              disabled={isSubmitting || isUserLoading}
              min="0"
            />
            <span className="input-group-text">LAK</span>
          </div>
          {formik.touched.fuel && formik.errors.fuel && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block">
                {formik.errors.fuel}
              </span>
            </div>
          )}
        </div>

        {/* Date Off (Optional) */}
        <div className="fv-row mb-7">
          <label className="fw-bold fs-6 mb-2">Compensation Date Off (Optional)</label>
          <input
            type="date"
            {...formik.getFieldProps('date_off')}
            className={fieldClass('date_off')}
            disabled={isSubmitting || isUserLoading}
          />
        </div>

        {/* Reason */}
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Reason</label>
          <textarea
            {...formik.getFieldProps('reason')}
            className={fieldClass('reason')}
            disabled={isSubmitting || isUserLoading}
            rows={3}
            placeholder="Please provide a reason for this request..."
          />
          {formik.touched.reason && formik.errors.reason && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block">
                {formik.errors.reason}
              </span>
            </div>
          )}
        </div>

        {/* Description (Optional) */}
        <div className="fv-row mb-7">
          <label className="fw-bold fs-6 mb-2">Additional Description (Optional)</label>
          <textarea
            {...formik.getFieldProps('description')}
            className={fieldClass('description')}
            disabled={isSubmitting || isUserLoading}
            rows={4}
            placeholder="Add any additional details..."
            maxLength={500}
          />
          <div className="text-muted fs-7 mt-1">
            {formik.values.description?.length || 0} / 500 characters
          </div>
          {formik.touched.description && formik.errors.description && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block">
                {formik.errors.description}
              </span>
            </div>
          )}
        </div>

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
            type="submit"
            className="btn btn-primary"
            disabled={formik.isSubmitting || isUserLoading || !formik.isValid}
          >
            <span className="indicator-label">{isEditMode ? 'Update' : 'Create'}</span>
            {(formik.isSubmitting || isUserLoading) && (
              <span className="indicator-progress">
                Please wait...{' '}
                <span className="spinner-border spinner-border-sm align-middle ms-2"></span>
              </span>
            )}
          </button>
        </div>
      </form>

      {isSubmitting && <UsersListLoading />}
    </>
  )
}

export { UserEditModalForm }