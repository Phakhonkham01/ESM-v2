import { FC, useEffect, useState, useMemo, useCallback } from 'react'
import * as Yup from 'yup'
import { useFormik } from 'formik'
import clsx from 'clsx'
import axios from 'axios'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import { useListView } from '../core/ListViewProvider'
import { createDayOffRequest, getDayOffRequestById, updateDayOffRequest, getDayOffRequestsByUser } from '../core/_requests'
import { useQueryResponse } from '../core/QueryResponseProvider'
import { DayOffRequest, DayOffRequestDTO, FormattedDayOffRequest } from '../core/_models'

/* -------------------- Types -------------------- */
interface Department {
  _id?: string
  id?: string
  department_name: string
}

interface Employee {
  _id?: string
  id?: string
  user_name: string
  first_name_en: string
  last_name_en: string
  department_id?: string | Department[]
  user_email?: string
  role?: string
}

interface Supervisor {
  _id?: string
  id?: string
  first_name_en: string
  last_name_en: string
  user_name?: string
  department_id?: string | Department[]
  user_email?: string
  role?: string
}

interface LeaveFormValues {
  department_id: string
  employee_id: string
  work_period: string
  supervisor_id: string
  leave_type: string
  day_off_type: 'FULL_DAY' | 'HALF_DAY'
  start_date: string
  end_date: string
  half_day_date: string
  date_off_number: number
  half_day_period?: 'morning' | 'afternoon'
  reason?: string
}

interface Props {
  onSuccess?: () => void
  initialData?: FormattedDayOffRequest
}

/* -------------------- Constants -------------------- */
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8001/api'

/* -------------------- Validation Schema -------------------- */
const leaveSchema = Yup.object().shape({
  department_id: Yup.string().required('Please select department'),
  employee_id: Yup.string().required('Please select employee'),
  supervisor_id: Yup.string().required('Please select supervisor'),
  day_off_type: Yup.string().required('Please select day off type'),
  start_date: Yup.string().when('day_off_type', {
    is: 'FULL_DAY',
    then: (schema) => schema.required('Please select start date'),
    otherwise: (schema) => schema.notRequired(),
  }),
  end_date: Yup.string().when('day_off_type', {
    is: 'FULL_DAY',
    then: (schema) => schema.required('Please select end date'),
    otherwise: (schema) => schema.notRequired(),
  }),
  half_day_date: Yup.string().when('day_off_type', {
    is: 'HALF_DAY',
    then: (schema) => schema.required('Please select date for half day'),
    otherwise: (schema) => schema.notRequired(),
  }),
  date_off_number: Yup.number().min(0.5, 'Date off must be at least 0.5 days'),
  half_day_period: Yup.string().when('day_off_type', {
    is: 'HALF_DAY',
    then: (schema) => schema.required('Please select time period'),
    otherwise: (schema) => schema.notRequired(),
  }),
})

/* -------------------- Utility Functions -------------------- */
const getCurrentMonthRange = () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const formatDate = (date: Date) => date.toISOString().split('T')[0]
  return {
    firstDay: formatDate(firstDay),
    lastDay: formatDate(lastDay),
    today: formatDate(now),
  }
}

const isLastDayOfMonth = (dateString: string): boolean => {
  const date = new Date(dateString)
  const nextDay = new Date(date)
  nextDay.setDate(date.getDate() + 1)
  return nextDay.getMonth() !== date.getMonth()
}

const isInCurrentMonth = (dateString: string): boolean => {
  const date = new Date(dateString)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

const formatDateForInput = (dateString: string | Date): string => {
  const date = dateString instanceof Date ? dateString : new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

const getHalfDayPeriodFromTime = (startTime: string | Date): 'morning' | 'afternoon' | undefined => {
  const date = startTime instanceof Date ? startTime : new Date(startTime)
  if (isNaN(date.getTime())) return undefined
  const hours = date.getHours()
  if (hours >= 8 && hours < 12) return 'morning'
  if (hours >= 13 && hours < 17) return 'afternoon'
  return undefined
}

const setHalfDayTime = (date: Date, period: 'morning' | 'afternoon', timeType: 'start' | 'end'): Date => {
  const newDate = new Date(date)
  if (period === 'morning') {
    newDate.setHours(timeType === 'start' ? 8 : 12, timeType === 'start' ? 30 : 0, 0, 0)
  } else {
    newDate.setHours(timeType === 'start' ? 13 : 17, timeType === 'start' ? 30 : 0, 0, 0)
  }
  return newDate
}

const toLocalISOString = (dateStr: string, time = 'T00:00:00'): string => {
  const date = new Date(dateStr + time)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString()
}

const handleSubmitError = (error: any) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data
    switch (status) {
      case 400:
        if (data?.errors) {
          data.errors.forEach((err: any) => toast.error(`${err.field || err.path}: ${err.message}`))
        } else {
          toast.error(data?.message || 'Invalid request data')
        }
        break
      case 409:
        toast.error('Conflict: This day off request already exists or overlaps with existing request')
        break
      case 500:
        toast.error('Server error. Please try again later.')
        break
      default:
        toast.error(data?.message || error.message || 'An error occurred')
    }
  } else {
    toast.error(error.message || 'An unknown error occurred')
  }
}

/* -------------------- Component -------------------- */
export const DayOffRequestEditModalForm: FC<Props> = ({ onSuccess, initialData }) => {
  /* -------------------- State -------------------- */
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [loadingSupervisors, setLoadingSupervisors] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingRequest, setIsLoadingRequest] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentRequestId, setCurrentRequestId] = useState<string | undefined>(undefined)
  const [existingRequests, setExistingRequests] = useState<DayOffRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [dateConflictError, setDateConflictError] = useState('')
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false)
  const { itemIdForUpdate, setItemIdForUpdate } = useListView()
  const { refetch } = useQueryResponse()
  const currentMonthRange = useMemo(() => getCurrentMonthRange(), [])

  /* -------------------- Formik -------------------- */
  const formik = useFormik<LeaveFormValues>({
    initialValues: {
      department_id: '',
      employee_id: '',
      work_period: '',
      supervisor_id: '',
      leave_type: '',
      day_off_type: 'FULL_DAY',
      start_date: '',
      end_date: '',
      half_day_date: '',
      date_off_number: 0,
      half_day_period: undefined,
      reason: '',
    },
    validationSchema: leaveSchema,
    onSubmit: handleFormSubmit,
  })

  /* -------------------- Helper Functions -------------------- */
  const getEmployeeName = (employee: Employee | null | undefined): string => {
    if (!employee) return 'Unknown Employee'
    return employee.user_name || `${employee.first_name_en || ''} ${employee.last_name_en || ''}`.trim()
  }

  const getEmployeeDepartment = (employee: Employee | null | undefined): string => {
    if (!employee) return 'Unknown Dept'
    if (Array.isArray(employee.department_id) && employee.department_id.length > 0) {
      return employee.department_id[0].department_name || 'Unknown Dept'
    }
    return 'Unknown Dept'
  }

  const getSupervisorName = (supervisor: Supervisor | null | undefined): string => {
    if (!supervisor) return 'Unknown Supervisor'
    return supervisor.user_name || `${supervisor.first_name_en || ''} ${supervisor.last_name_en || ''}`.trim()
  }

  const getSupervisorDepartment = (supervisor: Supervisor | null | undefined): string => {
    if (!supervisor) return 'Unknown Dept'
    if (Array.isArray(supervisor.department_id) && supervisor.department_id.length > 0) {
      return supervisor.department_id[0].department_name || 'Unknown Dept'
    }
    return 'Unknown Dept'
  }

  /* -------------------- Date Conflict Check -------------------- */
  const checkDateConflict = useCallback((dateStr: string, period?: 'morning' | 'afternoon'): { hasConflict: boolean; message: string } => {
    if (!dateStr || !formik.values.employee_id || existingRequests.length === 0) {
      return { hasConflict: false, message: '' }
    }

    const checkDate = new Date(dateStr)
    checkDate.setHours(0, 0, 0, 0)

    for (const req of existingRequests) {
      const reqStart = new Date(req.start_date_time as string)
      const reqEnd = new Date(req.end_date_time as string)
      reqStart.setHours(0, 0, 0, 0)
      reqEnd.setHours(0, 0, 0, 0)

      if (checkDate >= reqStart && checkDate <= reqEnd) {
        if (req.day_off_type === 'HALF_DAY') {
          const reqPeriod = getHalfDayPeriodFromTime(req.start_date_time as string)
          if (period && reqPeriod === period) {
            return {
              hasConflict: true,
              message: `❌ This date is not available. You have a ${req.status || 'Pending'} leave request on this date.`
            }
          }
          if (!period) {
            return {
              hasConflict: true,
              message: `❌ This date is not available. You have a ${req.status || 'Pending'} leave request on this date.`
            }
          }
        } else {
          return {
            hasConflict: true,
            message: `❌ This date is not available. You have a ${req.status || 'Pending'} leave request on this date.`
          }
        }
      }
    }

    return { hasConflict: false, message: '' }
  }, [existingRequests, formik.values.employee_id])

  const checkDateRangeConflict = useCallback((startDateStr: string, endDateStr: string): { hasConflict: boolean; message: string } => {
    if (!startDateStr || !endDateStr || !formik.values.employee_id || existingRequests.length === 0) {
      return { hasConflict: false, message: '' }
    }

    const start = new Date(startDateStr)
    const end = new Date(endDateStr)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    const current = new Date(start)
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      const conflict = checkDateConflict(dateStr)
      if (conflict.hasConflict) return conflict
      current.setDate(current.getDate() + 1)
    }

    return { hasConflict: false, message: '' }
  }, [checkDateConflict, existingRequests, formik.values.employee_id])

  /* -------------------- Date Validation -------------------- */
  const validateDateRestrictions = useCallback((dateString: string): string => {
    if (!dateString) return ''
    if (!isInCurrentMonth(dateString)) return 'Please select a date from the current month only.'
    if (isLastDayOfMonth(dateString)) return 'Last day of the month cannot be selected.'
    return ''
  }, [])

  const filterDateInput = useCallback((dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    date.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    const isCurrentMonth = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
    const nextDay = new Date(date)
    nextDay.setDate(date.getDate() + 1)
    const isLastDay = nextDay.getMonth() !== date.getMonth()
    if (!isCurrentMonth || isLastDay) return ''
    return dateString
  }, [])

  const handleDateChange = useCallback((field: string, value: string) => {
    const filteredValue = filterDateInput(value)

    if (value && !filteredValue) {
      const errorMessage = validateDateRestrictions(value)
      if (errorMessage) toast.error(errorMessage)
    }

    formik.setFieldValue(field, filteredValue)

    if (!filteredValue) {
      setDateConflictError('')
      return
    }

    if (formik.values.day_off_type === 'FULL_DAY') {
      const startDate = field === 'start_date' ? filteredValue : formik.values.start_date
      const endDate = field === 'end_date' ? filteredValue : formik.values.end_date

      if (startDate && endDate) {
        const conflict = checkDateRangeConflict(startDate, endDate)
        setDateConflictError(conflict.message)
      } else {
        const dateToCheck = field === 'start_date' ? filteredValue : formik.values.start_date || filteredValue
        const conflict = checkDateConflict(dateToCheck)
        setDateConflictError(conflict.message)
      }
    } else if (formik.values.day_off_type === 'HALF_DAY') {
      const conflict = checkDateConflict(filteredValue, formik.values.half_day_period)
      setDateConflictError(conflict.message)
    }
  }, [filterDateInput, validateDateRestrictions, checkDateConflict, checkDateRangeConflict, formik.values])

  const handlePeriodChange = useCallback((period: 'morning' | 'afternoon') => {
    formik.setFieldValue('half_day_period', period)
    if (formik.values.half_day_date) {
      const conflict = checkDateConflict(formik.values.half_day_date, period)
      setDateConflictError(conflict.message)
    }
  }, [formik.values.half_day_date, checkDateConflict])

  const validateDateRange = useCallback((values: LeaveFormValues): boolean => {
    if (values.day_off_type === 'FULL_DAY') {
      if (!values.start_date || !values.end_date) return false

      const start = new Date(values.start_date)
      const end = new Date(values.end_date)

      if (end < start) {
        toast.error('End date cannot be before start date')
        return false
      }

      const diffDays = Math.ceil(
        Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1

      if (diffDays > 30) {
        toast.error('Maximum 30 days allowed for continuous leave')
        return false
      }
    }
    return true
  }, [])

  /* -------------------- API Functions -------------------- */
  const fetchDepartments = async (): Promise<Department[]> => {
    setLoadingDepartments(true)
    try {
      const res = await axios.get<{ data: Department[] }>(`${API_URL}/departments`)
      const data = res.data.data || []
      setDepartments(data)
      return data
    } catch {
      toast.error('Unable to load departments')
      return []
    } finally {
      setLoadingDepartments(false)
    }
  }

  const fetchEmployees = async (): Promise<Employee[]> => {
    setLoadingEmployees(true)
    try {
      const res = await axios.get<Employee[]>(`${API_URL}/users?role=employee`)
      const data = res.data || []
      setEmployees(data)
      return data
    } catch {
      toast.error('Unable to load employees')
      return []
    } finally {
      setLoadingEmployees(false)
    }
  }

  const fetchSupervisors = async (): Promise<Supervisor[]> => {
    setLoadingSupervisors(true)
    try {
      const res = await axios.get(`${API_URL}/users?role=supervisor`)
      const data = res.data || []
      setSupervisors(data)
      return data
    } catch {
      toast.error('Unable to load supervisors')
      return []
    } finally {
      setLoadingSupervisors(false)
    }
  }

  /* -------------------- Form Validation -------------------- */
  const isFormComplete = useCallback((): boolean => {
    const { department_id, employee_id, supervisor_id, day_off_type, start_date, end_date, half_day_date, half_day_period } = formik.values
    if (!department_id || !employee_id || !supervisor_id || !day_off_type) return false
    if (day_off_type === 'FULL_DAY') return !!(start_date && end_date)
    return !!(half_day_date && half_day_period)
  }, [formik.values])

  /* -------------------- Form Submission -------------------- */
  async function handleFormSubmit(values: LeaveFormValues, { resetForm }: any) {
    if (dateConflictError) {
      toast.error('Please fix the date conflict before submitting')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(true)
    try {
      if (!values.employee_id) { toast.error('Please select an employee'); setIsSubmitting(false); return }
      if (!values.supervisor_id) { toast.error('Please select a supervisor'); setIsSubmitting(false); return }
      if (!validateDateRange(values)) { setIsSubmitting(false); return }

      if (values.day_off_type === 'FULL_DAY') {
        const startErr = validateDateRestrictions(values.start_date)
        const endErr = validateDateRestrictions(values.end_date)
        if (startErr) { toast.error(`Start date: ${startErr}`); setIsSubmitting(false); return }
        if (endErr) { toast.error(`End date: ${endErr}`); setIsSubmitting(false); return }
        if (!values.start_date || !values.end_date) {
          toast.error('Please select both start and end dates')
          setIsSubmitting(false)
          return
        }
      } else {
        if (!values.half_day_date) { toast.error('Please select a date for half day'); setIsSubmitting(false); return }
        const halfErr = validateDateRestrictions(values.half_day_date)
        if (halfErr) { toast.error(`Half day date: ${halfErr}`); setIsSubmitting(false); return }
        if (!values.half_day_period) { toast.error('Please select time period for half day'); setIsSubmitting(false); return }
      }

      const dayOffRequestDTO: DayOffRequestDTO = {
        user_id: values.employee_id,
        employee_id: values.employee_id,
        supervisor_id: [values.supervisor_id],
        day_off_type: values.day_off_type,
        start_date_time:
          values.day_off_type === 'HALF_DAY'
            ? setHalfDayTime(
              new Date(values.half_day_date + 'T00:00:00'),
              values.half_day_period || 'morning',
              'start'
            ).toISOString()
            : toLocalISOString(values.start_date),
        end_date_time:
          values.day_off_type === 'HALF_DAY'
            ? setHalfDayTime(
              new Date(values.half_day_date + 'T00:00:00'),
              values.half_day_period || 'morning',
              'end'
            ).toISOString()
            : toLocalISOString(values.end_date, 'T23:59:59'),
        date_off_number: values.date_off_number,
        title: values.reason?.trim() || 'Day off request',
      }

      if (isEditMode && currentRequestId) {
        await updateDayOffRequest(currentRequestId, dayOffRequestDTO)
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Day off request updated successfully',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        await createDayOffRequest(dayOffRequestDTO)
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Day off request submitted successfully',
          timer: 2000,
          showConfirmButton: false
        })
      }

      resetForm()
      setItemIdForUpdate(undefined)
      setIsEditMode(false)
      setCurrentRequestId(undefined)
      setDateConflictError('')
      setExistingRequests([])
      await refetch()
      if (onSuccess) onSuccess()
    } catch (error: any) {
      handleSubmitError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  /* -------------------- Load Request Data -------------------- */
  const loadRequestData = useCallback(async (
    requestId: string,
    requestData?: FormattedDayOffRequest
  ) => {
    setIsLoadingRequest(true)
    try {
      const data = requestData ?? await getDayOffRequestById(requestId)
      if (!data) return

      const employeesData = employees.length === 0 ? await fetchEmployees() : employees
      const supervisorsData = supervisors.length === 0 ? await fetchSupervisors() : supervisors
      if (departments.length === 0) await fetchDepartments()

      const extractId = (obj: any): string => {
        if (!obj) return ''
        if (typeof obj === 'string') return obj
        return obj.id || obj._id || ''
      }

      const employeeId = extractId(data.employee_id)

      const employee = employeesData.find(
        (e) => e._id === employeeId || e.id === employeeId
      )

      let departmentId = ''
      if (employee) {
        if (Array.isArray(employee.department_id) && employee.department_id.length > 0) {
          departmentId = extractId(employee.department_id[0])
        } else {
          departmentId = extractId(employee.department_id)
        }
      }

      let supervisorId = ''
      if (data.supervisor_id) {
        supervisorId = Array.isArray(data.supervisor_id)
          ? extractId(data.supervisor_id[0])
          : extractId(data.supervisor_id)
      }

      const startDate = formatDateForInput(data.start_date_time)
      const endDate = formatDateForInput(data.end_date_time)
      const halfDayPeriod = data.day_off_type === 'HALF_DAY'
        ? getHalfDayPeriodFromTime(data.start_date_time)
        : undefined
      const halfDayDate = data.day_off_type === 'HALF_DAY' ? startDate : ''

      formik.setValues({
        department_id: departmentId,
        employee_id: employeeId,
        work_period: '',
        supervisor_id: supervisorId,
        leave_type: '',
        day_off_type: data.day_off_type,
        start_date: data.day_off_type === 'FULL_DAY' ? startDate : '',
        end_date: data.day_off_type === 'FULL_DAY' ? endDate : '',
        half_day_date: halfDayDate,
        date_off_number: data.date_off_number,
        half_day_period: halfDayPeriod,
        reason: data.title || '',
      })

      setCurrentRequestId(requestId)
      setIsEditMode(true)
    } catch (error) {
      toast.error('Failed to load request data')
    } finally {
      setIsLoadingRequest(false)
    }
  }, [employees, supervisors, departments])

  /* -------------------- Effects -------------------- */
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchDepartments(),
        fetchEmployees(),
        fetchSupervisors(),
      ])
      setIsInitialDataLoaded(true)
    }
    loadInitialData()
  }, [])


  useEffect(() => {
    if (!isInitialDataLoaded) return

    if (itemIdForUpdate) {
      loadRequestData(itemIdForUpdate, initialData)
    } else {
      setIsEditMode(false)
      setCurrentRequestId(undefined)
      formik.resetForm()
      setDateConflictError('')
      setExistingRequests([])
    }
  }, [itemIdForUpdate, isInitialDataLoaded, initialData])

  useEffect(() => {
    const loadExistingRequests = async () => {
      const employeeId = formik.values.employee_id
      if (!employeeId) {
        setExistingRequests([])
        setDateConflictError('')
        return
      }

      try {
        setLoadingRequests(true)
        const response = await getDayOffRequestsByUser(employeeId)

        let requests: DayOffRequest[] = []
        if (response && typeof response === 'object') {
          if ('data' in response && Array.isArray(response.data)) {
            requests = response.data
          } else if ('requests' in response && Array.isArray(response.requests)) {
            requests = response.requests
          } else if (Array.isArray(response)) {
            requests = response
          }
        }

        const activeRequests = requests.filter((req: DayOffRequest) => {
          if (req.status !== 'Pending' && req.status !== 'Accepted') return false
          if (isEditMode && currentRequestId) {
            const reqId = typeof req._id === 'string' ? req._id :
              typeof req.id === 'string' ? req.id : ''
            return reqId !== currentRequestId
          }
          return true
        })

        setExistingRequests(activeRequests)
      } catch (error) {
        setExistingRequests([])
      } finally {
        setLoadingRequests(false)
      }
    }

    loadExistingRequests()
  }, [formik.values.employee_id, isEditMode, currentRequestId])

  useEffect(() => {
    if (existingRequests.length === 0) return

    if (formik.values.day_off_type === 'FULL_DAY' &&
      formik.values.start_date &&
      formik.values.end_date) {
      const conflict = checkDateRangeConflict(formik.values.start_date, formik.values.end_date)
      setDateConflictError(conflict.message)
    } else if (formik.values.day_off_type === 'HALF_DAY' &&
      formik.values.half_day_date) {
      const conflict = checkDateConflict(formik.values.half_day_date, formik.values.half_day_period)
      setDateConflictError(conflict.message)
    }
  }, [existingRequests])

  // Reset dates เมื่อเปลี่ยน day_off_type
  useEffect(() => {
    if (formik.values.day_off_type === 'HALF_DAY') {
      if (!formik.values.half_day_period) {
        formik.setFieldValue('half_day_period', 'morning')
      }
      if (!isEditMode) {
        formik.setFieldValue('start_date', '')
        formik.setFieldValue('end_date', '')
      }
    } else {
      if (!isEditMode) {
        formik.setFieldValue('half_day_date', '')
        formik.setFieldValue('half_day_period', undefined)
      }
    }
    setDateConflictError('')
  }, [formik.values.day_off_type, isEditMode])

  // Calculate days
  useEffect(() => {
    const { day_off_type, half_day_date, start_date, end_date } = formik.values
    if (day_off_type === 'FULL_DAY') {
      if (!start_date || !end_date) { formik.setFieldValue('date_off_number', 0); return }
      const diffDays = Math.ceil(
        Math.abs(new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
      formik.setFieldValue('date_off_number', diffDays)
    } else {
      formik.setFieldValue('date_off_number', half_day_date ? 0.5 : 0)
    }
  }, [formik.values.start_date, formik.values.end_date, formik.values.half_day_date, formik.values.day_off_type])

  const canSubmit = useMemo(() => {
    return isFormComplete() &&
      formik.isValid &&
      !dateConflictError &&
      !isSubmitting &&
      !loadingRequests
  }, [formik.values, formik.isValid, dateConflictError, isSubmitting, loadingRequests, isFormComplete])

  /* -------------------- Render -------------------- */
  // ✅ แสดง loading ขณะโหลด initial data
  if (!isInitialDataLoaded) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '300px' }}>
        <div className='text-center'>
          <span className='spinner-border spinner-border-lg text-primary mb-3'></span>
          <p className='text-muted mt-2'>Loading form data...</p>
        </div>
      </div>
    )
  }

  return (
    <form className="form" onSubmit={formik.handleSubmit} noValidate>
      <div>
        <div className="card-body">
          {/* Department */}
          <div className="fv-row mb-10">
            <label className="required fs-6 fw-bold mb-2">Department</label>
            <div className="d-flex align-items-center gap-3">
              <select
                {...formik.getFieldProps('department_id')}
                className={clsx('form-select form-select-solid', {
                  'is-invalid': formik.touched.department_id && formik.errors.department_id
                })}
                disabled={loadingDepartments || isSubmitting}
                value={formik.values.department_id || ''}
                onChange={(e) => formik.setFieldValue('department_id', e.target.value)}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id || dept.id} value={dept._id || dept.id}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
              {loadingDepartments && <span className="spinner-border spinner-border-sm text-primary"></span>}
            </div>
            {formik.touched.department_id && formik.errors.department_id && (
              <div className="fv-plugins-message-container">
                <div className="fv-help-block text-danger">{formik.errors.department_id}</div>
              </div>
            )}
          </div>

          {/* Employee */}
          <div className="fv-row mb-10">
            <label className="required fs-6 fw-bold mb-2">Employee</label>
            <div className="d-flex align-items-center gap-3">
              <select
                {...formik.getFieldProps('employee_id')}
                className={clsx('form-select form-select-solid', {
                  'is-invalid': formik.touched.employee_id && formik.errors.employee_id
                })}
                disabled={loadingEmployees || isSubmitting}
                value={formik.values.employee_id || ''}
                onChange={(e) => {
                  formik.setFieldValue('employee_id', e.target.value)
                  setDateConflictError('')
                }}
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {getEmployeeName(emp)} - {getEmployeeDepartment(emp)}
                  </option>
                ))}
              </select>
              {loadingEmployees && <span className="spinner-border spinner-border-sm text-primary"></span>}
            </div>
            {formik.touched.employee_id && formik.errors.employee_id && (
              <div className="fv-plugins-message-container">
                <div className="fv-help-block text-danger">{formik.errors.employee_id}</div>
              </div>
            )}
          </div>

          {/* Supervisor */}
          <div className="fv-row mb-10">
            <label className="required fs-6 fw-bold mb-2">Supervisor</label>
            <div className="d-flex align-items-center gap-3">
              <select
                {...formik.getFieldProps('supervisor_id')}
                className={clsx('form-select form-select-solid', {
                  'is-invalid': formik.touched.supervisor_id && formik.errors.supervisor_id
                })}
                disabled={loadingSupervisors || isSubmitting}
                value={formik.values.supervisor_id || ''}
                onChange={(e) => formik.setFieldValue('supervisor_id', e.target.value)}
              >
                <option value="">Select Supervisor</option>
                {supervisors.map((sup) => (
                  <option key={sup._id || sup.id} value={sup._id || sup.id}>
                    {getSupervisorName(sup)} ({getSupervisorDepartment(sup)})
                  </option>
                ))}
              </select>
              {loadingSupervisors && <span className="spinner-border spinner-border-sm text-primary"></span>}
            </div>
            {formik.touched.supervisor_id && formik.errors.supervisor_id && (
              <div className="fv-plugins-message-container">
                <div className="fv-help-block text-danger">{formik.errors.supervisor_id}</div>
              </div>
            )}
          </div>

          {/* Day off Type */}
          <div className="fv-row mb-10">
            <label className="required fs-6 fw-bold mb-2">Day off Type</label>
            <div className="d-flex flex-wrap gap-4">
              {['FULL_DAY', 'HALF_DAY'].map((type) => (
                <div key={type} className="form-check form-check-custom form-check-solid">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="day_off_type"
                    id={`type-${type}`}
                    value={type}
                    checked={formik.values.day_off_type === type}
                    onChange={formik.handleChange}
                    disabled={isSubmitting}
                  />
                  <label className="form-check-label fw-semibold" htmlFor={`type-${type}`}>
                    {type === 'FULL_DAY' ? 'Full Day' : 'Half Day'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Full Day: Date Range */}
          {formik.values.day_off_type === 'FULL_DAY' && (
            <div className="fv-row mb-10">
              <div className="row g-6">
                <div className="col-md-6">
                  <label className="required fs-6 fw-bold mb-2">Start Date</label>
                  <input
                    type="date"
                    className={clsx('form-control form-control-solid', {
                      'is-invalid': (formik.touched.start_date && formik.errors.start_date) || !!dateConflictError
                    })}
                    disabled={isSubmitting || loadingRequests}
                    min={currentMonthRange.firstDay}
                    max={currentMonthRange.lastDay}
                    onChange={(e) => handleDateChange('start_date', e.target.value)}
                    value={formik.values.start_date || ''}
                  />
                  {formik.touched.start_date && formik.errors.start_date && (
                    <div className="fv-plugins-message-container">
                      <div className="fv-help-block text-danger">{formik.errors.start_date}</div>
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="required fs-6 fw-bold mb-2">End Date</label>
                  <input
                    type="date"
                    className={clsx('form-control form-control-solid', {
                      'is-invalid': (formik.touched.end_date && formik.errors.end_date) || !!dateConflictError
                    })}
                    disabled={isSubmitting || loadingRequests}
                    min={formik.values.start_date || currentMonthRange.firstDay}
                    max={currentMonthRange.lastDay}
                    onChange={(e) => handleDateChange('end_date', e.target.value)}
                    value={formik.values.end_date || ''}
                  />
                  {formik.touched.end_date && formik.errors.end_date && (
                    <div className="fv-plugins-message-container">
                      <div className="fv-help-block text-danger">{formik.errors.end_date}</div>
                    </div>
                  )}
                </div>
              </div>
              {dateConflictError && (
                <div className="invalid-feedback d-block mt-2" style={{ fontSize: '0.95rem' }}>
                  {dateConflictError}
                </div>
              )}
            </div>
          )}

          {/* Half Day */}
          {formik.values.day_off_type === 'HALF_DAY' && (
            <>
              <div className="fv-row mb-10">
                <label className="required fs-6 fw-bold mb-2">Date</label>
                <input
                  type="date"
                  className={clsx('form-control form-control-solid', {
                    'is-invalid': (formik.touched.half_day_date && formik.errors.half_day_date) || !!dateConflictError
                  })}
                  disabled={isSubmitting || loadingRequests}
                  min={currentMonthRange.firstDay}
                  max={currentMonthRange.lastDay}
                  onChange={(e) => handleDateChange('half_day_date', e.target.value)}
                  value={formik.values.half_day_date || ''}
                />
                {formik.touched.half_day_date && formik.errors.half_day_date && (
                  <div className="fv-plugins-message-container">
                    <div className="fv-help-block text-danger">{formik.errors.half_day_date}</div>
                  </div>
                )}
                {dateConflictError && (
                  <div className="invalid-feedback d-block mt-2" style={{ fontSize: '0.95rem' }}>
                    {dateConflictError}
                  </div>
                )}
              </div>

              <div className="fv-row mb-10">
                <label className="required fs-6 fw-bold mb-2">Time Period</label>
                <div className="row g-3">
                  <div className="col-md-6">
                    <select
                      className={clsx('form-select form-select-solid', {
                        'is-invalid': formik.touched.half_day_period && formik.errors.half_day_period
                      })}
                      disabled={isSubmitting}
                      value={formik.values.half_day_period || ''}
                      onChange={(e) => handlePeriodChange(e.target.value as 'morning' | 'afternoon')}
                    >
                      <option value="">Select Time Period</option>
                      <option value="morning">Morning (08:30 - 12:00)</option>
                      <option value="afternoon">Afternoon (13:30 - 17:00)</option>
                    </select>
                    {formik.touched.half_day_period && formik.errors.half_day_period && (
                      <div className="fv-plugins-message-container">
                        <div className="fv-help-block text-danger">{formik.errors.half_day_period}</div>
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <div className="form-control form-control-solid bg-light">
                      {formik.values.half_day_period === 'morning' ? '08:30 - 12:00'
                        : formik.values.half_day_period === 'afternoon' ? '13:30 - 17:00'
                          : 'Please select time period'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Date off Number */}
          <div className="fv-row mb-10">
            <label className="required fs-6 fw-bold mb-2">Date Off Number</label>
            <div className="input-group">
              <input
                type="number"
                step="0.5"
                min="0.5"
                {...formik.getFieldProps('date_off_number')}
                className={clsx('form-control form-control-solid', {
                  'is-invalid': formik.touched.date_off_number && formik.errors.date_off_number
                })}
                disabled
                readOnly
                value={formik.values.date_off_number || ''}
              />
              <span className="input-group-text bg-light">days</span>
            </div>
            <div className="mt-2">
              <small className="text-muted">
                {formik.values.day_off_type === 'FULL_DAY'
                  ? 'Each day counts as 1 full day'
                  : 'Half day counts as 0.5 day'}
              </small>
            </div>
          </div>

          {/* Reason */}
          <div className="fv-row mb-10">
            <label className="fs-6 fw-bold mb-2">Reason (Optional)</label>
            <textarea
              {...formik.getFieldProps('reason')}
              className="form-control form-control-solid"
              rows={3}
              placeholder="Enter reason for leave (optional)"
              disabled={isSubmitting}
              value={formik.values.reason || ''}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="card-footer d-flex justify-content-end py-6 px-9 gap-3">
          <button
            type="button"
            className="btn btn-light"
            onClick={() => {
              setItemIdForUpdate(undefined)
              setIsEditMode(false)
              formik.resetForm()
              setDateConflictError('')
              setExistingRequests([])
            }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={clsx('btn', {
              'btn-primary': canSubmit,
              'btn-secondary': !canSubmit
            })}
            disabled={!canSubmit || isSubmitting}
            title={!canSubmit ? 'Please fill all required fields and resolve conflicts' : ''}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm align-middle me-2"></span>
                {isEditMode ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              isEditMode ? 'Update Request' : 'Submit Request'
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

export default DayOffRequestEditModalForm