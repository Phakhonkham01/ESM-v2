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

// Add API URL configuration
const API_URL = import.meta.env.VITE_APP_API_URL
const USERS_URL = `${API_URL}/users`
const SALARIES_URL = `${API_URL}/salaries`

interface SalaryCalculatorModalContentProps {
  userId: string
  onClose: () => void
  user?: any
}

const SalaryCalculatorModalContent: FC<SalaryCalculatorModalContentProps> = ({
  userId,
  onClose,
  user: propUser
}) => {
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(propUser)

  const [existingSalaries, setExistingSalaries] = useState<ExistingSalary[]>([])
  
  // Add missing state variables for month and year
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1) // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear())
  
  const queryClient = useQueryClient()

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

  // Fetch prefill data when month/year changes
  useEffect(() => {
    if (userId && selectedMonth && selectedYear) {
      fetchPrefillData()
    }
  }, [userId, selectedMonth, selectedYear])

const fetchUserData = async () => {
  try {
    setLoading(true)
    const response = await axios.get(`${USERS_URL}/${userId}`)
    // Make sure we're extracting the user correctly from the response
    const userData = response.data.user || response.data
    setUser(userData)
    console.log('User data loaded:', userData) // Debug log
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
        setPrefillData(response.data.data)
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'notes' ? value : parseFloat(value) || 0,
    }))
  }

  // Add the missing handleCutOffDaysChange function
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

  const calculateTotalIncome = () => {
    if (!prefillData) return 0

    const { base_salary } = prefillData.user
    const { fuel_costs } = prefillData.calculated
    const { bonus, commission, money_not_spent_on_holidays, other_income } =
      formData

    const manualOTAmount = manualOTDetails.reduce(
      (sum, detail) => sum + detail.amount,
      0,
    )

    const otAmount =
      (prefillData.calculated.ot_amount || 0) + manualOTAmount

    return (
      base_salary +
      otAmount +
      bonus +
      commission +
      fuel_costs +
      money_not_spent_on_holidays +
      other_income
    )
  }

  const calculateTotalDeductions = () => {
    const cutOffTotal =
      formData.cut_off_pay_days * formData.cut_off_pay_amount

    return formData.office_expenses + formData.social_security + cutOffTotal
  }

  const calculateNetSalary = () => {
    return calculateTotalIncome() - calculateTotalDeductions()
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

      const allOTDetails = [
        ...(prefillData?.calculated.ot_details || []),
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
        fuel_costs: prefillData?.calculated.fuel_costs || 0,
        day_off_days: prefillData?.calculated.day_off_days || 0,
        remaining_vacation_days:
          prefillData?.calculated.remaining_vacation_days || 0,
        created_by: created_by,
        manual_ot: manualOT,
        notes:
          formData.notes ||
          `Manual OT: ${manualOTDetails.length > 0 ? 'Yes' : 'No'}`,
      }

      const response = await axios.post(SALARIES_URL, payload)

      if (response.status === 201 || response.status === 200) {
        // Update vacation days
        try {
          const remainingVacationDays =
            prefillData?.calculated.remaining_vacation_days || 0

          let updateReason = ''
          if (remainingVacationDays < 0) {
            updateReason = `Salary calculation ${getMonthName(selectedMonth)} ${selectedYear} - Exceeded vacation days by ${Math.abs(remainingVacationDays)} days`
          } else if (remainingVacationDays === 0) {
            updateReason = `Salary calculation ${getMonthName(selectedMonth)} ${selectedYear} - Vacation days exhausted`
          } else {
            updateReason = `Salary calculation ${getMonthName(selectedMonth)} ${selectedYear} - Remaining ${remainingVacationDays} vacation days`
          }

          await axios.put(
            `${USERS_URL}/${userId}/update-vacation-days`,
            {
              vacation_days: remainingVacationDays,
              updated_by: created_by,
              update_reason: updateReason,
            },
          )
        } catch (updateError: any) {
          console.warn('Salary calculated but could not update vacation days:', updateError)
        }

        setSuccess(true)

        // Show success message
        await Swal.fire({
          title: 'Success!',
          text: 'Salary calculation completed successfully',
          icon: 'success',
          confirmButtonColor: '#45cc67',
        })

        // Invalidate queries to refresh data
        queryClient.invalidateQueries([QUERIES.USERS_LIST])
        
        // Close modal
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

  const handleClose = () => {
    setActiveStep(0)
    setFormData({
      user_id: userId,
      salary: 0,
      fuel_costs: 0,
      month: selectedMonth,
      year: selectedYear,
      bonus: 0,
      commission: 0,
      money_not_spent_on_holidays: 0,
      other_income: 0,
      office_expenses: 0,
      cut_off_pay_days: 0,
      cut_off_pay_amount: 0,
      social_security: 0,
      working_days: 22,
      notes: '',
    })

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
    setError(null)
    setSuccess(false)
    setPrefillData(null)
    onClose()
  }

  const steps = [
    "Basic Information",
    "OT Rates",
    "Additional Income",
    "Deductions",
    "Summary"
  ]

  const renderStepContent = (step: number) => {
    const commonProps = {
      user: user || {},
      month: selectedMonth,
      year: selectedYear,
      prefillData,
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
      handleCutOffDaysChange, // Add this to the props
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
      <div className="modal-body py-10 px-lg-17">
        <div className="d-flex flex-column align-items-center justify-content-center py-10">
          <div className="spinner-border text-primary mb-4" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="text-muted">Loading calculation data...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="modal-header">
        <h2 className="fw-bold">Payroll Calculation System</h2>
        <div
          className="btn btn-icon btn-sm btn-active-icon-primary"
          onClick={handleClose}
          style={{ cursor: 'pointer' }}
        >
          <KTIcon iconName="cross" className="fs-1" />
        </div>
      </div>

      {/* Content */}
      <div className="modal-body py-10 px-lg-17">
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
        <div className="content">
          {renderStepContent(activeStep)}
        </div>
      </div>

      {/* Footer */}
      <div className="modal-footer flex-center">
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