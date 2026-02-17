//file name constants.ts
export const getMonthName = (month: number): string => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  return months[month - 1] || ""
}

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const getVacationTextColor = (days: number): string => {
  if (days <= 0) return "text-danger"
  if (days <= 5) return "text-warning"
  return "text-success"
}

export const getOtTypeColor = (type: string): string => {
  switch (type) {
    case "weekday":
      return "badge-light-primary"
    case "weekend":
      return "badge-light-warning"
    default:
      return "badge-light-secondary"
  }
}

export const getOtTypeEnglish = (type: string): string => {
  switch (type) {
    case "weekday":
      return "Weekday"
    case "weekend":
      return "Weekend"
    default:
      return type
  }
}