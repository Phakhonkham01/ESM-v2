// SalaryCalculatorModalContent.tsx
import { FC, useState, useEffect, useCallback } from 'react'
import { useQueryClient } from 'react-query'
import { KTIcon } from '../../../../../../_metronic/helpers'
import { QUERIES } from '../../../../../../_metronic/helpers'
import Swal from 'sweetalert2'
import axios from 'axios'
import {
  getMonthName,
  formatCurrency,
} from './constants'
import {
  Step1BasicInfo,
  Step2OtRates,
  Step3AdditionalIncome,
  Step4Deductions,
  Step5Summary
} from './SalaryStepComponents'
import type {
  PrefillData,
  SalaryFormData,
  ManualOTState,
  ExistingSalary
} from './interfaces'

// ✅ Import types
import type { SystemOTData } from './SalaryStepComponents'

// ✅ Add SatSunData type
interface SatSunData {
  acceptedRequests: any[]
  totalDaysOff: number
  totalHolidayPay: number
}

// Add API URL configuration
const API_URL = import.meta.env.VITE_APP_API_URL
const USERS_URL = `${API_URL}/users`
const SALARIES_URL = `${API_URL}/salaries`

interface SalaryCalculatorModalContentProps {
  userId: string
  onClose: () => void
  user?: any
  initialStep?: number
}

const SalaryCalculatorModalContent: FC<SalaryCalculatorModalContentProps> = ({
  userId,
  onClose,
  user: propUser,
  initialStep = 0,
}) => {
  const [activeStep, setActiveStep] = useState(initialStep)
  
  const [loading, setLoading] = useState(false)
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(propUser)

  const [existingSalaries, setExistingSalaries] = useState<ExistingSalary[]>([])
  
  // Month and year state
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear())
  
  // ✅ systemOTData state
  const [systemOTData, setSystemOTData] = useState<SystemOTData>({
    systemOTDetails: [],
    totalFuelCosts: 0,
    totalOTAmount: 0,
  })
  
  // ✅ satSunData state
  const [satSunData, setSatSunData] = useState<SatSunData>({
    acceptedRequests: [],
    totalDaysOff: 0,
    totalHolidayPay: 0,
  })
  
  // ✅ State สำหรับ loading ข้อมูลเพิ่มเติม
  const [loadingOTData, setLoadingOTData] = useState(false)
  const [loadingSatSunData, setLoadingSatSunData] = useState(false)
  
  const queryClient = useQueryClient()
  const API_BASE_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8001'

  const [formData, setFormData] = useState<SalaryFormData>({
    user_id: userId,
    month: selectedMonth,
    year: selectedYear,
    bonus: 0,
    fuel_costs: 0,
    commission: 0,
    money_not_spent_on_holidays: 0,
    other_income: 0,
    office_expenses: 0,
    cut_off_pay_days: 0,
    cut_off_pay_amount: 0,
    salary: 0,
    social_security: 0,
    working_days: 22,
    notes: '',
  })

  const [manualOT, setManualOT] = useState<ManualOTState>({
    weekday: {
      hours: 0,
      rate_per_hour: 0,
    },
    weekend: {
      hours: 0,
      days: 0,
      rate_per_hour: 0,
      rate_per_day: 0,
    },
  })

  const [manualOTDetails, setManualOTDetails] = useState<any[]>([])

  // Debug effects
  useEffect(() => {
    console.log('📌 SalaryCalculatorModalContent - initialStep:', initialStep)
    console.log('📌 SalaryCalculatorModalContent - activeStep set to:', activeStep)
  }, [initialStep, activeStep])

  useEffect(() => {
    console.log('📌 Active step set to:', activeStep)
  }, [activeStep])

  // Update formData when selectedMonth or selectedYear changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      month: selectedMonth,
      year: selectedYear,
    }))
  }, [selectedMonth, selectedYear])

  // Fetch user data if not provided
  useEffect(() => {
    if (!propUser && userId) {
      fetchUserData()
    } else {
      setUser(propUser)
    }
  }, [userId, propUser])

  // Fetch existing salaries
  useEffect(() => {
    if (userId) {
      fetchExistingSalaries()
    }
  }, [userId])

  // ✅ useEffect โหลดข้อมูลเมื่อ userId, month, year เปลี่ยน
  useEffect(() => {
    if (userId && selectedMonth && selectedYear) {
      // ถ้าเปิด Step 5 โดยตรง (initialStep = 4) ให้โหลดข้อมูลทั้งหมดทันที
      if (initialStep === 4) {
        console.log('📌 Step 5 direct access - loading all data immediately')
        Promise.all([
          fetchPrefillData(),
          fetchOTandFuelData(),
          fetchSatSunData()
        ]).catch(error => {
          console.error('Error loading data for Step 5:', error)
        })
      } else {
        // ถ้าเป็น step อื่น ให้โหลดเฉพาะ prefillData
        fetchPrefillData()
      }
    }
  }, [userId, selectedMonth, selectedYear, initialStep])

  // Debug effects for data updates
  useEffect(() => {
    console.log('🔍 [Parent] systemOTData updated:', systemOTData)
  }, [systemOTData])

  useEffect(() => {
    console.log('📅 [Parent] satSunData updated:', satSunData)
  }, [satSunData])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${USERS_URL}/${userId}`)
      const userData = response.data.user || response.data
      setUser(userData)
      console.log('User data loaded:', userData)
    } catch (err: any) {
      setError('Failed to load user data')
      console.error('Error fetching user:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchExistingSalaries = async () => {
    try {
      const response = await axios.get(`${SALARIES_URL}?userId=${userId}`)
      if (response.data && response.data.salaries) {
        setExistingSalaries(response.data.salaries)
      }
    } catch (err) {
      console.error('Error fetching existing salaries:', err)
    }
  }

  const fetchPrefillData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(
        `${SALARIES_URL}/prefill/${userId}`,
        {
          params: {
            month: selectedMonth,
            year: selectedYear,
          },
        }
      )

      if (response.data && response.data.data) {
        const data = response.data.data
        setPrefillData(data)
        
        if (data.user.social_security !== undefined) {
          setFormData(prev => ({ ...prev, social_security: data.user.social_security }));
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to load prefill data',
      )
      console.error('Error fetching prefill data:', err)
    } finally {
      setLoading(false)
    }
  }

  // ✅ ฟังก์ชันโหลด OT และ Fuel Data
  const fetchOTandFuelData = async () => {
    if (!userId) return
    
    setLoadingOTData(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/requestOTandFieldWorkRoutes/user/${userId}`
      )
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const data = await response.json()
      console.log('📦 OT API response:', data)

      let requests = []
      if (Array.isArray(data)) requests = data
      else if (data?.data && Array.isArray(data.data)) requests = data.data
      else if (data?.requests && Array.isArray(data.requests)) requests = data.requests
      else requests = []

      const acceptedRequests = requests.filter((req: any) => {
        if (!req?.date || !req?.status) return false
        const requestDate = new Date(req.date)
        if (isNaN(requestDate.getTime())) return false
        const requestMonth = requestDate.getMonth() + 1
        const requestYear = requestDate.getFullYear()
        return req.status === "Accepted" &&
               requestMonth === selectedMonth &&
               requestYear === selectedYear
      })

      let totalFuelCosts = 0
      const systemOTDetails: any[] = []
      const BASE_HOURLY_RATE = 25000

      acceptedRequests.forEach((request: any) => {
        totalFuelCosts += Number(request.fuel) || 0

        if (request.title === "OT" && request.start_hour && request.end_hour) {
          const start = request.start_hour.split(':').map(Number)
          const end = request.end_hour.split(':').map(Number)
          const startMinutes = start[0] * 60 + start[1]
          let endMinutes = end[0] * 60 + end[1]

          if (endMinutes < startMinutes) endMinutes += 24 * 60

          const totalHours = (endMinutes - startMinutes) / 60
          const requestDate = new Date(request.date)
          const isWeekend = requestDate.getDay() === 0 || requestDate.getDay() === 6

          // คำนวณ OT amount
          const THRESHOLD = 22 * 60
          const multipliers = {
            weekday: { before22: 1.5, after22: 2.0 },
            weekend: { before22: 2.5, after22: 3.0 }
          }
          const multiplier = isWeekend ? multipliers.weekend : multipliers.weekday

          let amount = 0
          let hoursBefore22 = 0
          let hoursAfter22 = 0

          if (startMinutes < THRESHOLD && endMinutes > THRESHOLD) {
            hoursBefore22 = (THRESHOLD - startMinutes) / 60
            hoursAfter22 = (endMinutes - THRESHOLD) / 60
            amount = (hoursBefore22 * BASE_HOURLY_RATE * multiplier.before22) +
                     (hoursAfter22 * BASE_HOURLY_RATE * multiplier.after22)
          } else if (endMinutes <= THRESHOLD) {
            hoursBefore22 = totalHours
            amount = totalHours * BASE_HOURLY_RATE * multiplier.before22
          } else {
            hoursAfter22 = totalHours
            amount = totalHours * BASE_HOURLY_RATE * multiplier.after22
          }

          systemOTDetails.push({
            date: request.date,
            ot_type: isWeekend ? 'weekend' : 'weekday',
            start_hour: request.start_hour,
            end_hour: request.end_hour,
            total_hours: totalHours,
            amount: Math.round(amount),
            hourly_rate: BASE_HOURLY_RATE,
            request_id: request._id
          })
        }
      })

      const totalOTAmount = systemOTDetails.reduce((sum, d) => sum + d.amount, 0)

      setSystemOTData({
        systemOTDetails,
        totalFuelCosts,
        totalOTAmount,
      })

      console.log('✅ OT Data loaded:', {
        totalFuelCosts,
        totalOTAmount,
        detailsCount: systemOTDetails.length
      })

    } catch (error) {
      console.error("Error fetching OT data:", error)
      setSystemOTData({
        systemOTDetails: [],
        totalFuelCosts: 0,
        totalOTAmount: 0,
      })
    } finally {
      setLoadingOTData(false)
    }
  }

  // ✅ ฟังก์ชันโหลด Saturday/Sunday Data
  const fetchSatSunData = async () => {
    if (!userId) return
    
    setLoadingSatSunData(true)
    const HOLIDAY_PAY_RATE = 200000
    
    try {
      console.log(`🔍 Fetching Saturday/Sunday data for user: ${userId}`)
      
      const response = await fetch(
        `${API_BASE_URL}/sat-sun-requests/user/${userId}`
      )
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const data = await response.json()
      
      let requests = []
      if (data?.requests && Array.isArray(data.requests)) {
        requests = data.requests
      } else if (Array.isArray(data)) {
        requests = data
      }
      
      const acceptedRequests = requests.filter((req: any) => {
        if (!req?.start_date_time || req?.status !== 'Accepted') return false
        const requestDate = new Date(req.start_date_time)
        if (isNaN(requestDate.getTime())) return false
        const requestMonth = requestDate.getMonth() + 1
        const requestYear = requestDate.getFullYear()
        return requestMonth === selectedMonth && requestYear === selectedYear
      })
      
      const totalDaysOff = acceptedRequests.reduce(
        (sum: number, req: any) => sum + (req.date_off_number || 0),
        0
      )
      
      const totalHolidayPay = totalDaysOff * HOLIDAY_PAY_RATE
      
      setSatSunData({
        acceptedRequests,
        totalDaysOff,
        totalHolidayPay,
      })
      
      console.log('✅ SatSun Data loaded:', {
        totalDaysOff,
        totalHolidayPay
      })
      
    } catch (error) {
      console.error("Error fetching Saturday/Sunday data:", error)
      setSatSunData({
        acceptedRequests: [],
        totalDaysOff: 0,
        totalHolidayPay: 0,
      })
    } finally {
      setLoadingSatSunData(false)
    }
  }

  // ✅ Callback for systemOTData from Step 1
  const handleSystemOTDetailsUpdate = (data: { 
    systemOTDetails: any[]
    totalFuelCosts: number 
  }) => {
    console.log('🔥 [Parent] Callback triggered with data:', data)
    
    const totalOTAmount = data.systemOTDetails.reduce(
      (sum, detail) => sum + detail.amount, 
      0
    )

    setSystemOTData({
      systemOTDetails: data.systemOTDetails,
      totalFuelCosts: data.totalFuelCosts,
      totalOTAmount: totalOTAmount,
    })

    console.log('✅ [Parent] systemOTData updated:', {
      totalFuelCosts: data.totalFuelCosts,
      totalOTAmount: totalOTAmount,
      detailsCount: data.systemOTDetails.length,
    })
  }

  // ✅ Callback for satSunData from Step 1
  const handleSatSunDataUpdate = useCallback((data: SatSunData) => {
    console.log('📅 [Parent] satSunData updated:', data)
    setSatSunData(data)
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'notes' ? value : parseFloat(value) || 0,
    }))
  }

  const handleCutOffDaysChange = (days: number) => {
    if (!prefillData) return

    const baseSalary = prefillData.user.base_salary || 0
    const workingDays = formData.working_days || 22
    const dailyRate = baseSalary / workingDays
    const cutOffAmount = dailyRate * days

    setFormData((prev) => ({
      ...prev,
      cut_off_pay_days: days,
      cut_off_pay_amount: cutOffAmount,
    }))
  }

  const handleManualOTChange = (
    type: keyof ManualOTState,
    field: string,
    value: string,
  ) => {
    const numValue = parseFloat(value) || 0

    setManualOT((prev) => {
      if (type === 'weekday') {
        return {
          ...prev,
          weekday: {
            ...prev.weekday,
            [field]:
              field === 'hours'
                ? Math.max(0, numValue)
                : numValue,
          },
        }
      } else {
        return {
          ...prev,
          weekend: {
            ...prev.weekend,
            [field]:
              field === 'days' || field === 'hours'
                ? Math.max(0, numValue)
                : numValue,
          },
        }
      }
    })
  }

  const addManualOTDetail = () => {
    const details = []

    if (manualOT.weekday.hours > 0 && manualOT.weekday.rate_per_hour > 0) {
      const amount =
        manualOT.weekday.hours * manualOT.weekday.rate_per_hour
      details.push({
        date: new Date(selectedYear, selectedMonth - 1, 1).toISOString(),
        title: 'Manual OT - Weekday',
        start_hour: '09:00',
        end_hour: `${17 + manualOT.weekday.hours}:00`,
        total_hours: manualOT.weekday.hours,
        ot_type: 'weekday',
        hourly_rate: manualOT.weekday.rate_per_hour,
        days: 0,
        rate_per_day: 0,
        amount: amount,
        description: `Weekday OT: ${manualOT.weekday.hours} hours @ ${manualOT.weekday.rate_per_hour}/hour`,
        is_manual: true,
      })
    }

    if (manualOT.weekend.hours > 0 && manualOT.weekend.rate_per_hour > 0) {
      const amount =
        manualOT.weekend.hours * manualOT.weekend.rate_per_hour
      details.push({
        date: new Date(selectedYear, selectedMonth - 1, 1).toISOString(),
        title: 'Manual OT - Weekend (Hours)',
        start_hour: '09:00',
        end_hour: `${17 + manualOT.weekend.hours}:00`,
        total_hours: manualOT.weekend.hours,
        ot_type: 'weekend',
        hourly_rate: manualOT.weekend.rate_per_hour,
        days: 0,
        rate_per_day: 0,
        amount: amount,
        description: `Weekend OT: ${manualOT.weekend.hours} hours @ ${manualOT.weekend.rate_per_hour}/hour`,
        is_manual: true,
      })
    }

    if (manualOT.weekend.days > 0 && manualOT.weekend.rate_per_day > 0) {
      const amount = manualOT.weekend.days * manualOT.weekend.rate_per_day
      details.push({
        date: new Date(selectedYear, selectedMonth - 1, 1).toISOString(),
        title: 'Manual OT - Weekend (Days)',
        start_hour: '09:00',
        end_hour: '17:00',
        total_hours: manualOT.weekend.days * 8,
        ot_type: 'weekend',
        hourly_rate: 0,
        days: manualOT.weekend.days,
        rate_per_day: manualOT.weekend.rate_per_day,
        amount: amount,
        description: `Weekend OT: ${manualOT.weekend.days} days @ ${manualOT.weekend.rate_per_day}/day`,
        is_manual: true,
      })
    }

    if (details.length > 0) {
      setManualOTDetails(details)
    }
  }

  const clearManualOT = () => {
    setManualOT({
      weekday: { hours: 0, rate_per_hour: 0 },
      weekend: {
        hours: 0,
        days: 0,
        rate_per_hour: 0,
        rate_per_day: 0,
      },
    })
    setManualOTDetails([])
  }

  const calculateManualOTSummary = () => {
    let totalHours = 0
    let totalWeekendDays = 0
    let totalAmount = 0

    if (manualOT.weekday.hours > 0 && manualOT.weekday.rate_per_hour > 0) {
      totalHours += manualOT.weekday.hours
      totalAmount +=
        manualOT.weekday.hours * manualOT.weekday.rate_per_hour
    }

    if (manualOT.weekend.hours > 0 && manualOT.weekend.rate_per_hour > 0) {
      totalHours += manualOT.weekend.hours
      totalAmount +=
        manualOT.weekend.hours * manualOT.weekend.rate_per_hour
    }

    if (manualOT.weekend.days > 0 && manualOT.weekend.rate_per_day > 0) {
      totalWeekendDays += manualOT.weekend.days
      totalAmount += manualOT.weekend.days * manualOT.weekend.rate_per_day
    }

    return { totalHours, totalWeekendDays, totalAmount }
  }

  // ✅ Calculate total income
  const calculateTotalIncome = () => {
    if (!prefillData) return 0

    const { base_salary } = prefillData.user
    const fuel_costs = systemOTData.totalFuelCosts
    const { bonus, commission, money_not_spent_on_holidays, office_expenses, other_income } = formData

    const manualOTAmount = manualOTDetails.reduce(
      (sum, detail) => sum + detail.amount,
      0
    )
    const otAmount = systemOTData.totalOTAmount + manualOTAmount

    return (
      base_salary +
      otAmount +
      bonus +
      commission +
      fuel_costs +
      money_not_spent_on_holidays +
      office_expenses +
      other_income +
      satSunData.totalHolidayPay // ✅ Add Saturday/Sunday holiday pay
    )
  }

  // ✅ Calculate total deductions
  const calculateTotalDeductions = () => {
    if (!prefillData) return 0

    const exceedDays = prefillData.calculated.exceed_days ?? 0
    let absenceDeduction = 0

    if (exceedDays > 0) {
      const workingDaysInMonth = formData.working_days || 26
      const dailySalary = prefillData.user.base_salary / workingDaysInMonth
      absenceDeduction = Math.round(dailySalary * exceedDays)
    } else {
      absenceDeduction = formData.cut_off_pay_days * formData.cut_off_pay_amount
    }

    return absenceDeduction + formData.social_security
  }

  // ✅ Calculate net salary
  const calculateNetSalary = () => {
    const totalIncome = calculateTotalIncome()
    const totalDeductions = calculateTotalDeductions()
    console.log('🎯 [Calculate] Net Salary:', {
      totalIncome,
      totalDeductions,
      netSalary: totalIncome - totalDeductions,
    })
    return totalIncome - totalDeductions
  }                               

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const checkExistingSalary = useCallback((
    month: number,
    year: number,
  ) => {
    return existingSalaries.some(
      (salary) => salary.month === month && salary.year === year,
    )
  }, [existingSalaries])

  const handleSubmit = async () => {
    // Check if salary already exists for this month/year
    if (checkExistingSalary(selectedMonth, selectedYear)) {
      const result = await Swal.fire({
        title: 'Duplicate Salary Record',
        text: `Salary for ${getMonthName(selectedMonth)} ${selectedYear} already exists. Do you want to overwrite it?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, overwrite',
        cancelButtonText: 'Cancel',
      })

      if (!result.isConfirmed) {
        return
      }
    }

    // Show confirmation
    const confirmResult = await Swal.fire({
      title: 'Confirm Salary Calculation',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Employee:</strong> ${user?.first_name_en} ${user?.last_name_en}</p>
          <p><strong>Period:</strong> ${getMonthName(selectedMonth)} ${selectedYear}</p>
          <p><strong>Net Salary:</strong> ${formatCurrency(calculateNetSalary())}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#45cc67',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirm Calculation',
      cancelButtonText: 'Cancel',
    })

    if (!confirmResult.isConfirmed) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get current user from localStorage
      const authData = localStorage.getItem('user')
      const currentUser = authData ? JSON.parse(authData) : {}
      const created_by = currentUser._id || currentUser.id || userId

      // ✅ Combine OT from system and manual
      const allOTDetails = [
        ...systemOTData.systemOTDetails,
        ...manualOTDetails,
      ]

      const totalOTAmount = allOTDetails.reduce(
        (sum, detail) => sum + detail.amount,
        0,
      )
      const totalOTHours = allOTDetails.reduce(
        (sum, detail) => sum + (detail.total_hours || 0),
        0,
      )

      const netSalary = calculateNetSalary()

      const payload = {
        ...formData,
        user_id: userId,
        month: selectedMonth,
        year: selectedYear,
        net_salary: netSalary,
        base_salary: prefillData?.user.base_salary || 0,
        ot_amount: totalOTAmount,
        ot_hours: totalOTHours,
        ot_details: allOTDetails,
        fuel_costs: systemOTData.totalFuelCosts,
        // ✅ Add Saturday/Sunday holiday pay
        holiday_pay: satSunData.totalHolidayPay,
        holiday_days: satSunData.totalDaysOff,
        holiday_requests: satSunData.acceptedRequests,
        day_off_days: prefillData?.calculated.day_off_days || 0,
        remaining_vacation_days:
          prefillData?.calculated.remaining_vacation_days || 0,
        created_by: created_by,
        manual_ot: manualOT,
        notes:
          formData.notes ||
          `Manual OT: ${manualOTDetails.length > 0 ? 'Yes' : 'No'}`,
      }

      console.log('📤 [Submit] Payload:', payload)

      const response = await axios.post(SALARIES_URL, payload)

      if (response.status === 201 || response.status === 200) {
        setSuccess(true)

        await Swal.fire({
          title: 'Success!',
          text: 'Salary calculation completed successfully',
          icon: 'success',
          confirmButtonColor: '#45cc67',
        })

        queryClient.invalidateQueries([QUERIES.USERS_LIST])
        onClose()
      }
    } catch (err: any) {
      console.error('Salary calculation failed:', err)
      setError(err.response?.data?.message || 'Salary calculation failed')

      await Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to calculate salary',
        icon: 'error',
        confirmButtonColor: '#d33',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const steps = [
    "Basic Information",
    "OT Rates",
    "Additional Income",
    "Deductions",
    "Summary"
  ]

  // ✅ แสดง loading ถ้ากำลังโหลดข้อมูลสำหรับ Step 5
  if (initialStep === 4 && (loadingOTData || loadingSatSunData || loading)) {
    return (
      <>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid #eee' }}>
          <h2 className="fw-bold mb-0">Payroll Calculation System</h2>
          <div
            className="btn btn-icon btn-sm btn-active-light-primary ms-2"
            onClick={handleClose}
            style={{ cursor: 'pointer' }}
            aria-label="Close"
          >
            <KTIcon iconName="cross" className="fs-1" />
          </div>
        </div>
        <div className="modal-body py-10 px-lg-17" style={{ minHeight: '700px' }}>
          <div className="d-flex flex-column align-items-center justify-content-center py-10">
            <div className="spinner-border text-primary mb-4" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="text-muted">Loading salary data for Step 5...</span>
            <div className="mt-3 text-muted small">
              {loadingOTData && 'Loading OT data... '}
              {loadingSatSunData && 'Loading holiday data... '}
              {loading && 'Loading prefill data...'}
            </div>
          </div>
        </div>
      </>
    )
  }

  const renderStepContent = (step: number) => {
    const commonProps = {
      user: user || {},
      month: selectedMonth,
      year: selectedYear,
      prefillData,
      systemOTData, // ✅ Pass systemOTData
      satSunData,   // ✅ Pass satSunData
      formData,
      onInputChange: handleInputChange,
      calculateTotalIncome,
      calculateTotalDeductions,
      calculateNetSalary,
      manualOT,
      onManualOTChange: handleManualOTChange,
      manualOTDetails,
      addManualOTDetail,
      clearManualOT,
      calculateManualOTSummary,
      handleCutOffDaysChange,
      onMonthChange: (month: number) => setSelectedMonth(month),
      onYearChange: (year: number) => setSelectedYear(year),
      onSystemOTDetailsUpdate: handleSystemOTDetailsUpdate, // ✅ Pass callback
      onSatSunDataUpdate: handleSatSunDataUpdate,          // ✅ Pass callback
    }

    switch (step) {
      case 0:
        return <Step1BasicInfo {...commonProps} />
      case 1:
        return <Step2OtRates {...commonProps} />
      case 2:
        return <Step3AdditionalIncome {...commonProps} />
      case 3:
        return <Step4Deductions {...commonProps} />
      case 4:
        return <Step5Summary {...commonProps} />
      default:
        return null
    }
  }

  if (loading && !prefillData) {
    return (
      <>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid #eee' }}>
          <h2 className="fw-bold mb-0">Payroll Calculation System</h2>
          <div
            className="btn btn-icon btn-sm btn-active-light-primary ms-2"
            onClick={handleClose}
            style={{ cursor: 'pointer' }}
            aria-label="Close"
          >
            <KTIcon iconName="cross" className="fs-1" />
          </div>
        </div>
        <div className="modal-body py-10 px-lg-17" style={{ minHeight: '700px' }}>
          <div className="d-flex flex-column align-items-center justify-content-center py-10">
            <div className="spinner-border text-primary mb-4" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="text-muted">Loading calculation data...</span>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="modal-header" style={{ borderBottom: '1px solid #eee' }}>
        <h2 className="fw-bold mb-0">Payroll Calculation System</h2>
        <div
          className="btn btn-icon btn-sm btn-active-light-primary ms-2"
          onClick={handleClose}
          style={{ cursor: 'pointer' }}
          aria-label="Close"
        >
          <KTIcon iconName="cross" className="fs-1" />
        </div>
      </div>

      {/* Content */}
      <div className="modal-body py-10 px-lg-17" style={{ 
        maxHeight: '750px',
        overflowY: 'auto',
        width: '1000px'
      }}>
        {error && (
          <div className="alert alert-danger d-flex align-items-center p-5 mb-10">
            <KTIcon iconName="shield-cross" className="fs-2hx me-4" />
            <div className="d-flex flex-column">
              <h4 className="mb-1 text-danger">Error</h4>
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success d-flex align-items-center p-5 mb-10">
            <KTIcon iconName="check-circle" className="fs-2hx me-4" />
            <div className="d-flex flex-column">
              <h4 className="mb-1 text-success">Success</h4>
              <span>Payroll calculation completed successfully.</span>
            </div>
          </div>
        )}

        {/* Stepper */}
        <div className="stepper stepper-pills stepper-column d-flex flex-column flex-xl-row flex-row-fluid mb-10">
          {steps.map((label, index) => (
            <div className="stepper-item me-5" key={label}>
              <div className="stepper-wrapper d-flex align-items-center">
                <div
                  className={`stepper-icon w-40px h-40px ${
                    index <= activeStep
                      ? 'bg-primary'
                      : 'bg-light'
                  }`}
                >
                  {index < activeStep ? (
                    <KTIcon iconName="check" className="text-white" />
                  ) : (
                    <span className={`stepper-number ${
                      index <= activeStep ? 'text-white' : 'text-muted'
                    }`}>
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="stepper-label">
                  <h3 className={`stepper-title ${
                    index <= activeStep ? 'text-primary' : 'text-muted'
                  }`}>
                    {label}
                  </h3>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="stepper-line h-40px"></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="content" style={{ minHeight: '500px' }}>
          {renderStepContent(activeStep)}
        </div>
      </div>

      {/* Footer */}
      <div className="modal-footer flex-center" style={{ borderTop: '1px solid #eee' }}>
        <button
          type="button"
          className="btn btn-light me-3"
          onClick={handleBack}
          disabled={activeStep === 0 || loading || success}
        >
          <KTIcon iconName="arrow-left" className="fs-2 me-2" />
          Previous
        </button>

        {activeStep === steps.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || success || !prefillData}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Processing...
              </>
            ) : (
              <>
                <KTIcon iconName="check-circle" className="fs-2 me-2" />
                Confirm Calculation
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!prefillData && activeStep === 0}
          >
            Next Step
            <KTIcon iconName="arrow-right" className="fs-2 ms-2" />
          </button>
        )}
      </div>
    </>
  )
}

export { SalaryCalculatorModalContent }