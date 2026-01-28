import { FC, useEffect, useState } from 'react'
import * as Yup from 'yup'
import { useFormik } from 'formik'
import clsx from 'clsx'
import { toast } from 'react-toastify'
import { Holiday } from '../core/_models'
import { createHoliday, updateHoliday } from '../core/_requests'
import { useListView } from '../core/ListViewProvider'
import { useQueryResponse } from '../core/QueryResponseProvider'

type Props = {
  holiday: Holiday | null
  isLoading: boolean
}

interface HolidayFormValues {
  holiday_type: 'public' | 'private'
  holiday_name: string
  start_date: string
  end_date: string
  comment?: string
}

// ------------------ Validation Schema ------------------
const holidaySchema = Yup.object().shape({
  holiday_type: Yup.string().oneOf(['public', 'private']).required(),
  holiday_name: Yup.string().min(3).required('Name is required'),
  start_date: Yup.string().required('Start date is required'),
  end_date: Yup.string()
    .required('End date is required')
    .test('is-after-start', 'End date must be after start date', function (value) {
      const { start_date } = this.parent
      if (!value || !start_date) return true
      return new Date(value) >= new Date(start_date)
    }),
  comment: Yup.string(),
})

// ------------------ Helper ------------------
const formatDateTimeLocal = (date?: string | Date) => {
  if (!date) return ''
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const getHolidayId = (holiday?: Holiday | null) =>
  holiday?._id || holiday?.id || holiday?.holiday_id

// ------------------ Component ------------------
const HolidayEditModalForm: FC<Props> = ({ holiday, isLoading }) => {
  const { setItemIdForUpdate } = useListView()
  const { refetch } = useQueryResponse()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [initialValues, setInitialValues] = useState<HolidayFormValues | null>(null)

  // Load current user
  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
  }, [])

  // Set initial form values
  useEffect(() => {
    if (!currentUser) return
    const role = currentUser.role
    const now = new Date()
    let holiday_type: 'public' | 'private' = 'private'

    if (role === 'CEO') holiday_type = 'public'
    else if (role === 'admin') holiday_type = holiday?.holiday_type || 'public'
    else if (role === 'employee') holiday_type = 'private'

    setInitialValues({
      holiday_type,
      holiday_name: holiday?.holiday_name || '',
      start_date: holiday?.start_date
        ? formatDateTimeLocal(holiday.start_date)
        : formatDateTimeLocal(now),
      end_date: holiday?.end_date
        ? formatDateTimeLocal(holiday.end_date)
        : formatDateTimeLocal(now),
      comment: holiday?.comment || '',
    })
  }, [currentUser, holiday])

  const isEdit = !!getHolidayId(holiday)

  const formik = useFormik<HolidayFormValues>({
    initialValues: initialValues || {
      holiday_type: 'private',
      holiday_name: '',
      start_date: formatDateTimeLocal(new Date()),
      end_date: formatDateTimeLocal(new Date()),
      comment: '',
    },
    enableReinitialize: true,
    validationSchema: holidaySchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (!currentUser) {
        toast.error('Please login')
        return
      }

      try {
        setSubmitting(true)
        const payload: Partial<Holiday> = {
          ...values,
          user_id: currentUser._id,
          start_date: new Date(values.start_date).toISOString(),
          end_date: new Date(values.end_date).toISOString(),
        }

        const role = currentUser.role
        if (role === 'CEO') {
          payload.holiday_type = 'public'
          payload.status = 'approved'
          payload.approvedBy = currentUser._id
        } else if (role === 'admin') {
          payload.status = 'pending'
        } else if (role === 'employee') {
          payload.holiday_type = 'private'
          payload.status = 'pending'
        }

        if (isEdit) {
          await updateHoliday(String(getHolidayId(holiday)), payload)
          toast.success('Updated successfully')
        } else {
          await createHoliday(payload)
          toast.success(
            payload.holiday_type === 'public'
              ? 'Holiday created successfully'
              : 'Leave request submitted'
          )
        }

        resetForm()
        refetch()
        setItemIdForUpdate(undefined)
      } catch (err: any) {
        console.error(err)
        toast.error(err?.response?.data?.message || 'Something went wrong')
      } finally {
        setSubmitting(false)
      }
    },
  })

  if (!currentUser || !initialValues) return <div>Loading...</div>

  const role = currentUser.role
  if (role === 'employee' && formik.values.holiday_type === 'public')
    return <div>No permission</div>

  return (
    <form onSubmit={formik.handleSubmit} className="form">
      {/* Admin type selector */}
      {role === 'admin' && (
        <div className="fv-row mb-7">
          <label className="fw-bold fs-6 mb-2">Type</label>
          <select
            {...formik.getFieldProps('holiday_type')}
            className="form-select form-select-solid"
            disabled={formik.isSubmitting || isLoading}
          >
            <option value="public">Holiday</option>
            <option value="private">Leave Request</option>
          </select>
        </div>
      )}

      {/* Name / Reason */}
      <div className="fv-row mb-7">
        <label className="required fw-bold fs-6 mb-2">
          {role === 'employee' || formik.values.holiday_type === 'private'
            ? 'Leave Reason'
            : 'Holiday Name'}
        </label>
        <input
          type="text"
          {...formik.getFieldProps('holiday_name')}
          className={clsx('form-control form-control-solid', {
            'is-invalid': formik.touched.holiday_name && formik.errors.holiday_name,
          })}
          disabled={formik.isSubmitting || isLoading}
        />
      </div>

      {/* Start Date */}
      <div className="fv-row mb-7">
        <label className=" fw-bold fs-6 mb-2">Start Date</label>
        <input
          type="datetime-local"
          {...formik.getFieldProps('start_date')}
          className="form-control form-control-solid"
          disabled={formik.isSubmitting || isLoading}
        />
      </div>

      {/* End Date */}
      <div className="fv-row mb-7">
        <label className=" fw-bold fs-6 mb-2">End Date</label>
        <input
          type="datetime-local"
          {...formik.getFieldProps('end_date')}
          className="form-control form-control-solid"
          disabled={formik.isSubmitting || isLoading}
        />
      </div>

      {/* Comment */}
      {currentUser?.role === 'CEO' && (
        <div className="fv-row mb-7">
          <label className="fw-bold fs-6 mb-2">Comment</label>
          <textarea
            {...formik.getFieldProps('comment')}
            className="form-control form-control-solid"
            rows={3}
          />
        </div>
      )}

      {/* Actions */}
      <div className="text-center pt-10">
        <button
          type="button"
          className="btn btn-light me-3"
          onClick={() => setItemIdForUpdate(undefined)}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={formik.isSubmitting || !formik.isValid}
        >
          {isEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

export { HolidayEditModalForm }
