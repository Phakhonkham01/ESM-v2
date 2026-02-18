import { FC, useEffect, useState, useMemo, useCallback, useRef } from 'react'
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
// Metronic 8 theme hook — adjust path if needed in your project
import { useThemeMode } from '../../../../../../_metronic/partials/layout/theme-mode/ThemeModeProvider'

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

/* ==================== Custom DatePicker Component ==================== */
interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  minDate?: string
  maxDate?: string
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  conflictDates?: string[]
  isDark?: boolean   // passed from parent reading Metronic theme
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]
const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

const CustomDatePicker: FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date',
  disabled = false,
  hasError = false,
  conflictDates = [],
  isDark = false,
}) => {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value) return new Date(value + 'T00:00:00')
    return new Date()
  })
  const ref = useRef<HTMLDivElement>(null)

  /* ---- Metronic / Bootstrap CSS variable tokens ---- */
  // Light:  --bs-body-bg=#ffffff, --bs-body-color=#181c32
  // Dark:   --bs-body-bg=#1e1e2d, --bs-body-color=#cdcde6
  const tk = useMemo(() => isDark
    ? {
        // trigger
        triggerBg: '#1e1e2d',
        triggerBorder: hasError ? '#f1416c' : open ? '#009ef7' : '#323248',
        triggerColor: value ? '#cdcde6' : '#565674',
        triggerDisabledBg: '#151521',
        // dropdown
        dropdownBg: '#1e1e2d',
        dropdownBorder: '#323248',
        dropdownShadow: '0 8px 32px rgba(0,0,0,0.45)',
        // nav button
        navBtnBg: '#151521',
        navBtnHover: '#2b2b40',
        // month label
        monthLabel: '#cdcde6',
        // day header
        dayHeaderColor: '#565674',
        // day cell colors
        cellDefault: '#cdcde6',
        cellDisabled: '#3d3d5c',
        cellSelected: '#009ef7',
        cellSelectedText: '#ffffff',
        cellToday: '#1b3a4b',
        cellTodayText: '#009ef7',
        cellTodayOutline: '#1a4a5e',
        cellConflictBg: '#2d1b1b',
        cellConflictText: '#f1416c',
        cellHoverBg: '#2b2b40',
        // legend
        legendText: '#565674',
        legendDivider: '#323248',
      }
    : {
        triggerBg: '#f5f8fa',
        triggerBorder: hasError ? '#f1416c' : open ? '#009ef7' : '#e4e6ef',
        triggerColor: value ? '#181c32' : '#a1a5b7',
        triggerDisabledBg: '#eff2f5',
        dropdownBg: '#ffffff',
        dropdownBorder: '#e4e6ef',
        dropdownShadow: '0 8px 32px rgba(0,0,0,0.14)',
        navBtnBg: '#f5f8fa',
        navBtnHover: '#e4e6ef',
        monthLabel: '#181c32',
        dayHeaderColor: '#a1a5b7',
        cellDefault: '#181c32',
        cellDisabled: '#d1d3e0',
        cellSelected: '#009ef7',
        cellSelectedText: '#ffffff',
        cellToday: '#e8f4fd',
        cellTodayText: '#009ef7',
        cellTodayOutline: '#b8dcfa',
        cellConflictBg: '#fff5f8',
        cellConflictText: '#f1416c',
        cellHoverBg: '#e8f4fd',
        legendText: '#a1a5b7',
        legendDivider: '#f5f8fa',
      }, [isDark, hasError, open, value])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Sync view when value changes externally
  useEffect(() => {
    if (value) setViewDate(new Date(value + 'T00:00:00'))
  }, [value])

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const total = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = Array(firstDay).fill(null)
    for (let i = 1; i <= total; i++) days.push(i)
    return days
  }, [viewDate])

  const toDateStr = (day: number): string => {
    const y = viewDate.getFullYear()
    const m = viewDate.getMonth()
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const isDisabledDay = (day: number): boolean => {
    const ds = toDateStr(day)
    if (minDate && ds < minDate) return true
    if (maxDate && ds > maxDate) return true
    if (isLastDayOfMonth(ds)) return true
    return false
  }

  const isConflictDay = (day: number): boolean => conflictDates.includes(toDateStr(day))

  const isSelectedDay = (day: number): boolean => {
    if (!value) return false
    const d = new Date(value + 'T00:00:00')
    return (
      d.getFullYear() === viewDate.getFullYear() &&
      d.getMonth() === viewDate.getMonth() &&
      d.getDate() === day
    )
  }

  const isToday = (day: number): boolean => {
    const now = new Date()
    return (
      now.getFullYear() === viewDate.getFullYear() &&
      now.getMonth() === viewDate.getMonth() &&
      now.getDate() === day
    )
  }

  const handleSelect = (day: number) => {
    if (isDisabledDay(day)) return
    onChange(toDateStr(day))
    setOpen(false)
  }

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))

  const formatDisplay = (ds: string): string => {
    const d = new Date(ds + 'T00:00:00')
    return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      {/* ---- Trigger — styled to match Metronic form-control-solid ---- */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10.5px 12px',
          border: `1px solid ${tk.triggerBorder}`,
          borderRadius: '0.475rem',
          background: disabled ? tk.triggerDisabledBg : tk.triggerBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: open ? '0 0 0 0.25rem rgba(0,158,247,0.25)' : 'none',
          transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
          fontSize: '1.1rem',
          color: tk.triggerColor,
          fontFamily: 'inherit',
          outline: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke={hasError ? '#f1416c' : '#009ef7'} strokeWidth="2"
            style={{ flexShrink: 0 }}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8"  y1="2" x2="8"  y2="6" />
            <line x1="3"  y1="10" x2="21" y2="10" />
          </svg>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke={isDark ? '#565674' : '#a1a5b7'} strokeWidth="2.5"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ---- Dropdown calendar ---- */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 9999,
          background: tk.dropdownBg,
          borderRadius: '0.75rem',
          boxShadow: tk.dropdownShadow,
          padding: '14px',
          width: '286px',
          border: `1px solid ${tk.dropdownBorder}`,
        }}>

          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button
              type="button"
              onClick={prevMonth}
              style={{
                background: tk.navBtnBg, border: 'none', borderRadius: 6,
                width: 28, height: 28, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = tk.navBtnHover)}
              onMouseLeave={e => (e.currentTarget.style.background = tk.navBtnBg)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#009ef7" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <span style={{ fontWeight: 700, color: tk.monthLabel, fontSize: 13 }}>
              {THAI_MONTHS[viewDate.getMonth()]} {viewDate.getFullYear() + 543}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              style={{
                background: tk.navBtnBg, border: 'none', borderRadius: 6,
                width: 28, height: 28, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = tk.navBtnHover)}
              onMouseLeave={e => (e.currentTarget.style.background = tk.navBtnBg)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#009ef7" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {THAI_DAYS_SHORT.map((d) => (
              <div
                key={d}
                style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: tk.dayHeaderColor, padding: '2px 0' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {daysInMonth.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const dis      = isDisabledDay(day)
              const conflict = isConflictDay(day)
              const selected = isSelectedDay(day)
              const today    = isToday(day)

              // Resolve colors
              let bg    = 'transparent'
              let color = tk.cellDefault
              let outline = 'none'

              if (dis) {
                color = tk.cellDisabled
              } else if (selected) {
                bg = tk.cellSelected; color = tk.cellSelectedText
              } else if (conflict) {
                bg = tk.cellConflictBg; color = tk.cellConflictText
              } else if (today) {
                bg = tk.cellToday; color = tk.cellTodayText
                outline = `2px solid ${tk.cellTodayOutline}`
              }

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  disabled={dis}
                  title={
                    conflict ? 'Leave already exists on this date'
                    : dis     ? 'Date not available'
                    : undefined
                  }
                  onMouseEnter={e => {
                    if (!dis && !selected)
                      e.currentTarget.style.background = tk.cellHoverBg
                  }}
                  onMouseLeave={e => {
                    if (!dis && !selected)
                      e.currentTarget.style.background = bg
                  }}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    border: 'none',
                    borderRadius: 6,
                    cursor: dis ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    fontWeight: selected ? 700 : today ? 600 : 400,
                    background: bg,
                    color,
                    transition: 'background 0.15s, color 0.15s',
                    outline,
                    position: 'relative',
                  }}
                >
                  {day}
                  {/* red dot for conflict days */}
                  {conflict && !dis && (
                    <span style={{
                      position: 'absolute', bottom: 2, left: '50%',
                      transform: 'translateX(-50%)',
                      width: 3, height: 3, borderRadius: '50%',
                      background: '#f1416c', display: 'block',
                    }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', gap: 10, marginTop: 10,
            paddingTop: 8, borderTop: `1px solid ${tk.legendDivider}`,
            fontSize: 10, color: tk.legendText,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#009ef7', display: 'inline-block' }} />
              Selected
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: tk.cellConflictBg, border: `1px solid #f1416c`, display: 'inline-block' }} />
              Has leave
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: tk.cellToday, display: 'inline-block' }} />
              Today
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
/* ==================== End CustomDatePicker ==================== */

/* -------------------- Component -------------------- */
export const DayOffRequestEditModalForm: FC<Props> = ({ onSuccess, initialData }) => {

  /* ---- Read Metronic 8 theme mode ---- */
  const { mode } = useThemeMode()
  // mode is 'light' | 'dark' | 'system'
  // For 'system' we fall back to the OS preference
  const isDark = useMemo(() => {
    if (mode === 'dark') return true
    if (mode === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches
    return false
  }, [mode])

  /* -------------------- State -------------------- */
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
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

  /* ---- Build flat conflict date list for datepicker highlight ---- */
  const conflictDateStrings = useMemo<string[]>(() => {
    return existingRequests.flatMap((req) => {
      const start = new Date(req.start_date_time as string)
      const end   = new Date(req.end_date_time   as string)
      const dates: string[] = []
      const cur = new Date(start)
      cur.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      while (cur <= end) {
        dates.push(cur.toISOString().split('T')[0])
        cur.setDate(cur.getDate() + 1)
      }
      return dates
    })
  }, [existingRequests])

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
            return { hasConflict: true, message: `❌ This date is not available. You have a ${req.status || 'Pending'} leave request on this date.` }
          }
          if (!period) {
            return { hasConflict: true, message: `❌ This date is not available. You have a ${req.status || 'Pending'} leave request on this date.` }
          }
        } else {
          return { hasConflict: true, message: `❌ This date is not available. You have a ${req.status || 'Pending'} leave request on this date.` }
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
            ? setHalfDayTime(new Date(values.half_day_date + 'T00:00:00'), values.half_day_period || 'morning', 'start').toISOString()
            : toLocalISOString(values.start_date),
        end_date_time:
          values.day_off_type === 'HALF_DAY'
            ? setHalfDayTime(new Date(values.half_day_date + 'T00:00:00'), values.half_day_period || 'morning', 'end').toISOString()
            : toLocalISOString(values.end_date, 'T23:59:59'),
        date_off_number: values.date_off_number,
        title: values.reason?.trim() || 'Day off request',
      }

      if (isEditMode && currentRequestId) {
        await updateDayOffRequest(currentRequestId, dayOffRequestDTO)
        await Swal.fire({ icon: 'success', title: 'Success', text: 'Day off request updated successfully', timer: 2000, showConfirmButton: false })
      } else {
        await createDayOffRequest(dayOffRequestDTO)
        await Swal.fire({ icon: 'success', title: 'Success', text: 'Day off request submitted successfully', timer: 2000, showConfirmButton: false })
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
  const loadRequestData = useCallback(async (requestId: string, requestData?: FormattedDayOffRequest) => {
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
      const employee = employeesData.find((e) => e._id === employeeId || e.id === employeeId)

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
      const halfDayPeriod = data.day_off_type === 'HALF_DAY' ? getHalfDayPeriodFromTime(data.start_date_time) : undefined
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
      await Promise.all([fetchDepartments(), fetchEmployees(), fetchSupervisors()])
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

  /* ---- Filter employees by selected department ---- */
  useEffect(() => {
    const selectedDeptId = formik.values.department_id

    if (!selectedDeptId) {
      setFilteredEmployees([])
      return
    }

    const filtered = employees.filter((emp) => {
      if (Array.isArray(emp.department_id) && emp.department_id.length > 0) {
        return emp.department_id.some((dept) => dept._id === selectedDeptId || dept.id === selectedDeptId)
      } else if (typeof emp.department_id === 'string') {
        return emp.department_id === selectedDeptId
      }
      return false
    })

    setFilteredEmployees(filtered)

    const currentEmpStillValid = filtered.some(
      (e) => e._id === formik.values.employee_id || e.id === formik.values.employee_id
    )
    if (!currentEmpStillValid) {
      formik.setFieldValue('employee_id', '')
      setDateConflictError('')
    }
  }, [formik.values.department_id, employees])

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
          if ('data' in response && Array.isArray(response.data)) requests = response.data
          else if ('requests' in response && Array.isArray(response.requests)) requests = response.requests
          else if (Array.isArray(response)) requests = response
        }

        const activeRequests = requests.filter((req: DayOffRequest) => {
          if (req.status !== 'Pending' && req.status !== 'Accepted') return false
          if (isEditMode && currentRequestId) {
            const reqId = typeof req._id === 'string' ? req._id : typeof req.id === 'string' ? req.id : ''
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
    if (formik.values.day_off_type === 'FULL_DAY' && formik.values.start_date && formik.values.end_date) {
      const conflict = checkDateRangeConflict(formik.values.start_date, formik.values.end_date)
      setDateConflictError(conflict.message)
    } else if (formik.values.day_off_type === 'HALF_DAY' && formik.values.half_day_date) {
      const conflict = checkDateConflict(formik.values.half_day_date, formik.values.half_day_period)
      setDateConflictError(conflict.message)
    }
  }, [existingRequests])

  // Reset dates when switching day_off_type
  useEffect(() => {
    if (formik.values.day_off_type === 'HALF_DAY') {
      if (!formik.values.half_day_period) formik.setFieldValue('half_day_period', 'morning')
      if (!isEditMode) { formik.setFieldValue('start_date', ''); formik.setFieldValue('end_date', '') }
    } else {
      if (!isEditMode) { formik.setFieldValue('half_day_date', ''); formik.setFieldValue('half_day_period', undefined) }
    }
    setDateConflictError('')
  }, [formik.values.day_off_type, isEditMode])

  // Auto-calculate date_off_number
  useEffect(() => {
    const { day_off_type, half_day_date, start_date, end_date } = formik.values
    if (day_off_type === 'FULL_DAY') {
      if (!start_date || !end_date) { formik.setFieldValue('date_off_number', 0); return }
      const diffDays = Math.ceil(Math.abs(new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
      formik.setFieldValue('date_off_number', diffDays)
    } else {
      formik.setFieldValue('date_off_number', half_day_date ? 0.5 : 0)
    }
  }, [formik.values.start_date, formik.values.end_date, formik.values.half_day_date, formik.values.day_off_type])

  const canSubmit = useMemo(() => {
    return isFormComplete() && formik.isValid && !dateConflictError && !isSubmitting && !loadingRequests
  }, [formik.values, formik.isValid, dateConflictError, isSubmitting, loadingRequests, isFormComplete])

  /* -------------------- Render -------------------- */
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

          {/* Employee — filtered by selected department */}
          <div className="fv-row mb-10">
            <label className="required fs-6 fw-bold mb-2">Employee</label>
            <div className="d-flex align-items-center gap-3">
              <select
                {...formik.getFieldProps('employee_id')}
                className={clsx('form-select form-select-solid', {
                  'is-invalid': formik.touched.employee_id && formik.errors.employee_id
                })}
                disabled={loadingEmployees || isSubmitting || !formik.values.department_id}
                value={formik.values.employee_id || ''}
                onChange={(e) => {
                  formik.setFieldValue('employee_id', e.target.value)
                  setDateConflictError('')
                }}
              >
                <option value="">
                  {!formik.values.department_id
                    ? 'Please select department first'
                    : filteredEmployees.length === 0
                      ? 'No employees in this department'
                      : 'Select Employee'}
                </option>
                {filteredEmployees.map((emp) => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {getEmployeeName(emp)} - {getEmployeeDepartment(emp)}
                  </option>
                ))}
              </select>
              {loadingEmployees && <span className="spinner-border spinner-border-sm text-primary"></span>}
            </div>
            {formik.values.department_id && filteredEmployees.length === 0 && !loadingEmployees && (
              <div className="fv-plugins-message-container">
                <div className="fv-help-block text-warning">⚠️ No employees found in this department</div>
              </div>
            )}
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

          {/* Full Day: Date Range — CustomDatePicker with isDark prop */}
          {formik.values.day_off_type === 'FULL_DAY' && (
            <div className="fv-row mb-10">
              <div className="row g-6">
                <div className="col-md-6">
                  <label className="required fs-6 fw-bold mb-2">Start Date</label>
                  <CustomDatePicker
                    value={formik.values.start_date}
                    onChange={(val) => handleDateChange('start_date', val)}
                    minDate={currentMonthRange.firstDay}
                    maxDate={currentMonthRange.lastDay}
                    placeholder="Select start date"
                    disabled={isSubmitting || loadingRequests}
                    hasError={(formik.touched.start_date && !!formik.errors.start_date) || !!dateConflictError}
                    conflictDates={conflictDateStrings}
                    isDark={isDark}
                  />
                  {formik.touched.start_date && formik.errors.start_date && (
                    <div className="fv-plugins-message-container mt-1">
                      <div className="fv-help-block text-danger">{formik.errors.start_date}</div>
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="required fs-6 fw-bold mb-2">End Date</label>
                  <CustomDatePicker
                    value={formik.values.end_date}
                    onChange={(val) => handleDateChange('end_date', val)}
                    minDate={formik.values.start_date || currentMonthRange.firstDay}
                    maxDate={currentMonthRange.lastDay}
                    placeholder="Select end date"
                    disabled={isSubmitting || loadingRequests}
                    hasError={(formik.touched.end_date && !!formik.errors.end_date) || !!dateConflictError}
                    conflictDates={conflictDateStrings}
                    isDark={isDark}
                  />
                  {formik.touched.end_date && formik.errors.end_date && (
                    <div className="fv-plugins-message-container mt-1">
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

          {/* Half Day — CustomDatePicker with isDark prop */}
          {formik.values.day_off_type === 'HALF_DAY' && (
            <>
              <div className="fv-row mb-10">
                <label className="required fs-6 fw-bold mb-2">Date</label>
                <CustomDatePicker
                  value={formik.values.half_day_date}
                  onChange={(val) => handleDateChange('half_day_date', val)}
                  minDate={currentMonthRange.firstDay}
                  maxDate={currentMonthRange.lastDay}
                  placeholder="Select date"
                  disabled={isSubmitting || loadingRequests}
                  hasError={(formik.touched.half_day_date && !!formik.errors.half_day_date) || !!dateConflictError}
                  conflictDates={conflictDateStrings}
                  isDark={isDark}
                />
                {formik.touched.half_day_date && formik.errors.half_day_date && (
                  <div className="fv-plugins-message-container mt-1">
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
              <span className="input-group-text bg-light border-0">days</span>
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