//file name interfaces.ts
export interface SalaryFormData {
  user_id: string
  salary: number
  month: number
  year: number
  bonus: number
  commission: number
  fuel_costs: number
  money_not_spent_on_holidays: number
  other_income: number
  office_expenses: number
  social_security: number
  cut_off_pay_days: number
  cut_off_pay_amount: number
  working_days: number
  
  notes?: string
}

export interface PrefillData {
  user: {
    _id: string
    name: string
    base_salary: number
    vacation_days: number
    social_security: number
  }
  calculated: {
    ot_amount: number
    ot_hours: number
    ot_details: any[]
    fuel_costs: number
    day_off_days: number
    remaining_vacation_days: number
    vacation_color: 'red' | 'yellow' | 'green'
    weekday_ot_hours: number
    weekend_ot_hours: number
    day_off_days_this_month?: number
    used_vacation_days_this_year?: number
    total_vacation_days?: number
    leave_days?: number
    exceed_days?: number
  }
  month: number
  year: number
}

export interface ManualOTState {
  weekday: {
    hours: number
    rate_per_hour: number
  }
  weekend: {
    hours: number
    days: number
    rate_per_hour: number
    rate_per_day: number
  }
}

export interface ExistingSalary {
  _id: string
  month: number
  year: number
  status: string
  net_salary: number
}