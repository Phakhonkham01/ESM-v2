'use client'
import { useState } from 'react'
import { KTIcon } from '../../../../../../_metronic/helpers'
// SalaryStepComponents.tsx
import type React from 'react'
import type { PrefillData, SalaryFormData, ManualOTState } from './interfaces'
import { getMonthName } from './constants'

interface Step5Summary {
    user: {
        email: string
        first_name_en: string
        last_name_en: string
    }
    prefillData: {
        user: {
            base_salary: number
            name?: string
        }
        calculated: {
            remaining_vacation_days: number
            ot_hours: number
            day_off_days: number
            fuel_costs: number
        }
    } | null
    formData: {
        month: number
        year: number
        working_days: number
        bonus: number
        commission: number
        money_not_spent_on_holidays: number
        other_income: number
        social_security: number
        notes: string
    }
    manualOTDetails: any[]
    calculateNetSalary: () => number
}
export interface SalaryEmailRequest {
    to: string
    subject?: string
    employeeName?: string
    month?: string
    year?: number
    baseSalary?: number
    totalIncome?: number
    totalDeductions?: number
    netSalary?: number
    image?: string
    fileName?: string
    fileSizeMB?: string
}

export interface EmailResponse {
    success: boolean
    message: string
    error?: string
    data?: {
        to: string
        subject: string
        messageId?: string
        timestamp?: string
    }
}
interface StepComponentsProps {
    // Step 0
    user: any
    month: number
    year: number
    prefillData: PrefillData | null

    // Step 2 & 3
    formData: SalaryFormData
    onInputChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => void

    // Step 4
    calculateTotalIncome: () => number
    calculateTotalDeductions: () => number
    calculateNetSalary: () => number
    handleCutOffDaysChange?: (days: number) => void  // ✅ Add this line

    // Manual OT Props
    manualOT: ManualOTState
    onManualOTChange: (
        type: 'weekday' | 'weekend',
        field: string,
        value: string,
    ) => void
    manualOTDetails: any[]
    addManualOTDetail: () => void
    clearManualOT: () => void
    calculateManualOTSummary: () => {
        totalHours: number
        totalWeekendDays: number
        totalAmount: number
    }
}

// const getOtTypeEnglish = (type: string): string => {
//     switch (type) {
//         case 'weekday':
//             return 'Weekday'
//         case 'weekend':
//             return 'Weekend'
//         default:
//             return type
//     }
// }

const getOtTypeColor = (type: string): string => {
    switch (type) {
        case 'weekday':
            return 'badge-light-primary'
        case 'weekend':
            return 'badge-light-warning'
        default:
            return 'badge-light-secondary'
    }
}

const OtDetailsTable: React.FC<{
    otDetails: any[]
    title?: string
    showDate?: boolean
}> = ({ otDetails, title = 'Overtime (OT) Details', showDate = true }) => (
    <div className="overflow-x-auto border border-gray-300 rounded">
        <div className="bg-primary px-4 py-3">
            <h4 className="font-semibold text-white">{title}</h4>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-light">
                <tr>
                    {showDate && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider border-b border-gray-200">
                            Date
                        </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider border-b border-gray-200">
                        Type
                    </th>
                    {showDate && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider border-b border-gray-200">
                            Time
                        </th>
                    )}
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider border-b border-gray-200">
                        Quantity
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider border-b border-gray-200">
                        Rate
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider border-b border-gray-200">
                        Amount
                    </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {otDetails.map((detail, index) => (
                    <tr
                        key={index}
                        className="hover:bg-light-primary transition-colors"
                    >
                        {showDate && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 border-b border-gray-100">
                                {detail.date
                                    ? new Date(detail.date).toLocaleDateString(
                                          'lo-LA',
                                          {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                          },
                                      )
                                    : '-'}
                            </td>
                        )}

                        <td className="px-4 py-3 whitespace-nowrap border-b border-gray-100">
                            <span
                                className={`badge ${getOtTypeColor(detail.ot_type)}`}
                            >
                                {detail.ot_type === 'weekday'
                                    ? 'ມື້ທຳມະດາ'
                                    : 'ມື້ພັກ'}
                            </span>
                        </td>

                        {showDate && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-muted border-b border-gray-100 italic">
                                {detail.start_hour || '09:00'} -{' '}
                                {detail.end_hour || '17:00'}
                            </td>
                        )}

                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-center border-b border-gray-100">
                            {detail.ot_type === 'weekday'
                                ? `${detail.total_hours} ຊົ່ວໂມງ`
                                : detail.days
                                  ? `${detail.days} ມື້`
                                  : `${detail.total_hours} ຊົ່ວໂມງ`}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted text-center border-b border-gray-100">
                            {detail.ot_type === 'weekday'
                                ? `${detail.hourly_rate?.toLocaleString()} /ຊມ`
                                : detail.days
                                  ? `${detail.rate_per_day?.toLocaleString()} /ມື້`
                                  : `${detail.hourly_rate?.toLocaleString()} /ຊມ`}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-primary text-right border-b border-gray-100 bg-light-primary">
                            {detail.amount.toLocaleString()} ກີບ
                        </td>
                    </tr>
                ))}

                {/* Grand Total Row */}
                <tr className="bg-light font-bold border-t-2 border-primary">
                    <td
                        colSpan={showDate ? 3 : 2}
                        className="px-4 py-4 text-right text-primary uppercase tracking-wider text-xs"
                    >
                        ລວມຍອດທັງໝົດ (Total):
                    </td>
                    <td className="px-4 py-4 text-center text-gray-800">
                        {otDetails.reduce(
                            (sum, detail) =>
                                sum +
                                (detail.ot_type === 'weekday'
                                    ? detail.total_hours
                                    : detail.days || detail.total_hours),
                            0,
                        )}
                        <span className="ml-1 text-xs font-normal text-muted">
                            {otDetails.some((d) => d.days)
                                ? 'ມື້/ຊມ'
                                : 'ຊົ່ວໂມງ'}
                        </span>
                    </td>
                    <td className="px-4 py-4 text-center text-muted">-</td>
                    <td className="px-4 py-4 text-right text-lg text-primary bg-light-primary">
                        {otDetails
                            .reduce((sum, detail) => sum + detail.amount, 0)
                            .toLocaleString()}{' '}
                        ກີບ
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
)

const WeekdayOTCard: React.FC<{
    hours: number
    rate_per_hour: number
    onHoursChange: (value: string) => void
    onRatePerHourChange: (value: string) => void
}> = ({ hours, rate_per_hour, onHoursChange, onRatePerHourChange }) => {
    const amount = hours * rate_per_hour

    return (
        <div className="card">
            {/* Header */}
            <div className="card-header bg-primary">
                <h5 className="card-title text-white">
                    ມື້ທຳມະດາ (ຈັນ - ສຸກ)
                </h5>
            </div>

            <div className="card-body">
                <div className="space-y-4">
                    {/* OT Hours Input with Plus/Minus Buttons */}
                    <div>
                        <label className="form-label">
                            ຈຳນວນຊົ່ວໂມງ OT
                        </label>
                        <div className="d-flex align-items-center gap-2">
                            {/* Minus Button */}
                            <button
                                onClick={() => {
                                    const newValue = Math.max(
                                        0,
                                        Number(hours) - 0.5,
                                    )
                                    onHoursChange(String(newValue))
                                }}
                                className="btn btn-icon btn-light btn-sm"
                                type="button"
                            >
                                <KTIcon iconName="minus" className="fs-2" />
                            </button>
                            <div className="flex-grow-1">
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={hours}
                                    onChange={(e) =>
                                        onHoursChange(e.target.value)
                                    }
                                    className="form-control text-center fs-6"
                                    placeholder="0"
                                />
                            </div>

                            {/* Plus Button */}
                            <button
                                onClick={() => {
                                    const newValue = Number(hours) + 0.5
                                    onHoursChange(String(newValue))
                                }}
                                className="btn btn-icon btn-light btn-sm"
                                type="button"
                            >
                                <KTIcon iconName="plus" className="fs-2" />
                            </button>
                        </div>
                    </div>

                    {/* Rate Input */}
                    <div>
                        <label className="form-label">
                            ອັດຕາຄ່າຈ້າງ (ຕໍ່ຊົ່ວໂມງ)
                        </label>
                        <div className="input-group">
                            <input
                                type="number"
                                min={0}
                                value={rate_per_hour === 0 ? '' : rate_per_hour}
                                onChange={(e) =>
                                    onRatePerHourChange(e.target.value)
                                }
                                className="form-control"
                                placeholder="0"
                            />
                            <span className="input-group-text">ກີບ/ຊມ</span>
                        </div>
                    </div>
                </div>

                {/* Calculation Result Area */}
                <div className="mt-5 p-4 rounded bg-light-primary border border-primary">
                    <div className="d-flex flex-column">
                        <div className="text-xs fw-bold text-muted uppercase tracking-wider mb-1">
                            ລວມເງິນທັງໝົດ
                        </div>
                        <div className="text-2xl fw-bolder text-primary">
                            {amount.toLocaleString()}{' '}
                            <span className="fs-7 fw-bold">ກີບ</span>
                        </div>
                        <div className="mt-2 pt-2 border-top border-gray-200 fs-7 text-muted fw-medium">
                            {hours || 0} ຊົ່ວໂມງ ×{' '}
                            {rate_per_hour.toLocaleString()} ກີບ
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const WeekendOTCard: React.FC<{
    hours: number
    days: number
    rate_per_hour: number
    rate_per_day: number
    onHoursChange: (value: string) => void
    onDaysChange: (value: string) => void
    onRatePerHourChange: (value: string) => void
    onRatePerDayChange: (value: string) => void
}> = ({
    hours,
    days,
    rate_per_hour,
    rate_per_day,
    onHoursChange,
    onDaysChange,
    onRatePerHourChange,
    onRatePerDayChange,
}) => {
    const hoursAmount = hours * rate_per_hour
    const daysAmount = days * rate_per_day
    const totalAmount = hoursAmount + daysAmount

    return (
        <div className="card">
            <div className="card-header bg-warning">
                <h5 className="card-title text-white">
                    ມື້ພັກ (ວັນເສົາ-ວັນອາທິດ)
                </h5>
            </div>
            <div className="card-body">
                <div className="space-y-4">
                    {/* Weekend OT Hours */}
                    <div className="card card-bordered">
                        <div className="card-body">
                            <div className="space-y-4">
                                {/* Quantity Selection */}
                                <div>
                                    <label className="form-label">
                                        ຈຳນວນຊົ່ວໂມງ
                                    </label>
                                    <div className="d-flex align-items-center gap-2">
                                        <button
                                            onClick={() =>
                                                onHoursChange(
                                                    String(
                                                        Math.max(
                                                            0,
                                                            Number(hours) - 0.5,
                                                        ),
                                                    ),
                                                )
                                            }
                                            className="btn btn-icon btn-light btn-sm"
                                            type="button"
                                        >
                                            <KTIcon iconName="minus" className="fs-2" />
                                        </button>
                                        <input
                                            type="number"
                                            value={hours}
                                            onChange={(e) =>
                                                onHoursChange(e.target.value)
                                            }
                                            className="form-control text-center fs-6"
                                            placeholder="0"
                                        />
                                        <button
                                            onClick={() =>
                                                onHoursChange(
                                                    String(Number(hours) + 0.5),
                                                )
                                            }
                                            className="btn btn-icon btn-light btn-sm"
                                            type="button"
                                        >
                                            <KTIcon iconName="plus" className="fs-2" />
                                        </button>
                                    </div>
                                </div>

                                {/* Hourly Rate Input */}
                                <div>
                                    <label className="form-label">
                                        ອັດຕາຄ່າຈ້າງ (Hourly Rate)
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={
                                                rate_per_hour === 0
                                                    ? ''
                                                    : rate_per_hour
                                            }
                                            onChange={(e) =>
                                                onRatePerHourChange(e.target.value)
                                            }
                                            className="form-control"
                                            placeholder="0"
                                        />
                                        <span className="input-group-text">ກີບ/ຊມ</span>
                                    </div>
                                </div>

                                {/* Summary Calculation Box */}
                                {hours > 0 && rate_per_hour > 0 && (
                                    <div className="mt-4 p-3 rounded bg-light-warning border border-warning">
                                        <div className="d-flex justify-between align-items-center text-warning">
                                            <span className="fs-7 fw-medium uppercase">
                                                ລວມຍອດ OT:
                                            </span>
                                            <div className="text-end">
                                                <div className="fs-8 text-warning">
                                                    {hours} ຊມ x{' '}
                                                    {Number(
                                                        rate_per_hour,
                                                    ).toLocaleString()}
                                                </div>
                                                <div className="fs-4 fw-bolder">
                                                    {hoursAmount.toLocaleString()}{' '}
                                                    <span className="fs-7">
                                                        ກີບ
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Weekend Work Days */}
                    <div className="card card-bordered">
                        <div className="card-header bg-light">
                            <h6 className="card-title text-dark">
                                ມື້ເຮັດວຽກ ເສົາ - ອາທິດ (Full/Half Day)
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="space-y-4">
                                {/* Day Quantity Selector */}
                                <div>
                                    <label className="form-label">
                                        ຈຳນວນມື້ (0.5 = ເຄິ່ງມື້)
                                    </label>
                                    <div className="d-flex align-items-center gap-2">
                                        <button
                                            onClick={() =>
                                                onDaysChange(
                                                    String(
                                                        Math.max(
                                                            0,
                                                            Number(days) - 0.5,
                                                        ),
                                                    ),
                                                )
                                            }
                                            className="btn btn-icon btn-light btn-sm"
                                            type="button"
                                        >
                                            <KTIcon iconName="minus" className="fs-2" />
                                        </button>
                                        <input
                                            type="number"
                                            value={days}
                                            onChange={(e) =>
                                                onDaysChange(e.target.value)
                                            }
                                            className="form-control text-center fs-6"
                                            placeholder="0"
                                        />
                                        <button
                                            onClick={() =>
                                                onDaysChange(
                                                    String(Number(days) + 0.5),
                                                )
                                            }
                                            className="btn btn-icon btn-light btn-sm"
                                            type="button"
                                        >
                                            <KTIcon iconName="plus" className="fs-2" />
                                        </button>
                                    </div>
                                </div>

                                {/* Daily Rate Input */}
                                <div>
                                    <label className="form-label">
                                        ອັດຕາລາຍວັນ (Daily Rate)
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={
                                                rate_per_day === 0
                                                    ? ''
                                                    : rate_per_day
                                            }
                                            onChange={(e) =>
                                                onRatePerDayChange(e.target.value)
                                            }
                                            className="form-control"
                                            placeholder="0"
                                        />
                                        <span className="input-group-text">ກີບ/ມື້</span>
                                    </div>
                                </div>

                                {/* Calculation Result Summary */}
                                {days > 0 && rate_per_day > 0 && (
                                    <div className="mt-4 p-3 rounded bg-light-warning border border-warning">
                                        <div className="d-flex justify-between align-items-center text-warning">
                                            <span className="fs-7 fw-medium uppercase text-warning">
                                                ລວມຍອດລາຍວັນ:
                                            </span>
                                            <div className="text-end">
                                                <div className="fs-8 text-warning">
                                                    {days} ມື້ x{' '}
                                                    {Number(
                                                        rate_per_day,
                                                    ).toLocaleString()}
                                                </div>
                                                <div className="fs-4 fw-bolder">
                                                    {daysAmount.toLocaleString()}{' '}
                                                    <span className="fs-7 fw-normal">
                                                        ກີບ
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {(hours > 0 || days > 0) && (
                    <div className="mt-6 p-4 rounded bg-light-warning border border-warning">
                        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-4">
                            <div>
                                <h4 className="text-warning fw-bold mb-1">
                                    ລວມເງິນເສົາ-ອາທິດ (Weekend Total)
                                </h4>
                                <div className="text-warning fs-7 d-flex flex-wrap gap-3 align-items-center">
                                    {hours > 0 && (
                                        <span>
                                            <span className="fw-semibold">
                                                {hours} ຊມ
                                            </span>{' '}
                                            ({hoursAmount.toLocaleString()} ກີບ)
                                        </span>
                                    )}

                                    {hours > 0 && days > 0 && (
                                        <span className="text-warning fw-bold">
                                            +
                                        </span>
                                    )}

                                    {days > 0 && (
                                        <span>
                                            <span className="fw-semibold">
                                                {days} ມື້
                                            </span>{' '}
                                            ({daysAmount.toLocaleString()} ກີບ)
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="text-end border-top border-warning pt-3 pt-md-0">
                                <span className="d-block fs-7 uppercase tracking-wider text-warning fw-bold">
                                    ຍອດລວມທັງໝົດ
                                </span>
                                <span className="fs-2x fw-bolder text-primary">
                                    {totalAmount.toLocaleString()}
                                    <span className="fs-7 ms-1 fw-semibold text-muted uppercase">
                                        ກີບ
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export const Step1BasicInfo: React.FC<StepComponentsProps> = ({
    user,
    month,
    year,
    prefillData,
}) => {
    if (!prefillData) return null
    const calculated = prefillData.calculated

    calculated.day_off_days_this_month
    calculated.used_vacation_days_this_year
    calculated.total_vacation_days
    calculated.remaining_vacation_days
    calculated.exceed_days

    // const remainingVacation =
    //     prefillData.calculated.remaining_vacation_days ?? 0

    // const daysToDeduct = Math.max(0, remainingVacation)

    return (
        <div>
            <div className="mb-6">
                <div className="d-flex align-items-center gap-2 mb-4 pb-3 border-bottom border-primary">
                    <KTIcon iconName="profile-user" className="fs-2 text-primary" />
                    <h3 className="fs-4 fw-semibold text-primary">
                        ຂໍ້ມູນພະນັກງານ
                    </h3>
                </div>
                <div className="row g-4">
                    <div className="col-md-6">
                        <label className="form-label">
                            ຊື່ພະນັກງານ
                        </label>
                        <input
                            type="text"
                            value={`${user.first_name_en} ${user.last_name_en}`}
                            disabled
                            className="form-control form-control-solid"
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">
                            Email
                        </label>
                        <input
                            type="text"
                            value={user.email}
                            disabled
                            className="form-control form-control-solid"
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">
                            (ເດືອນ - ປີ)ທີ່ຈ່າຍເງິນ
                        </label>
                        <input
                            type="text"
                            value={`${getMonthName(month)} ${year}`}
                            disabled
                            className="form-control form-control-solid"
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">
                            ເງິນເດືອນພື້ນຖານ
                        </label>
                        <div className="input-group">
                            <input
                                type="text"
                                value={prefillData.user.base_salary.toLocaleString()}
                                disabled
                                className="form-control form-control-solid"
                            />
                            <span className="input-group-text">ກີບ</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="d-flex align-items-center gap-2 mb-4 pb-3 border-bottom border-primary">
                        <KTIcon iconName="calculator" className="fs-2 text-primary" />
                        <h3 className="fs-4 fw-semibold text-primary">
                            OT ແລະ ຄ່ານ້ຳມັນ
                        </h3>
                    </div>
                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="card">
                                <div className="card-header">
                                    <div className="d-flex align-items-center gap-2">
                                        <KTIcon iconName="dollar" className="fs-2 text-primary" />
                                        <h3 className="fs-6 fw-semibold text-gray-700 m-0">
                                            OT Summary (System)
                                        </h3>
                                    </div>
                                </div>
                                <div className="card-body">
                                    {/* Main OT Hours */}
                                    <div className="mb-4">
                                        <p className="fs-2x fw-bold text-primary mb-0">
                                            {prefillData.calculated.ot_hours}
                                            <span className="fs-5 fw-medium text-muted ms-1">
                                                hours
                                            </span>
                                        </p>
                                    </div>

                                    {/* OT Breakdown */}
                                    <div className="row g-3 mb-4">
                                        <div className="col-6">
                                            <div className="bg-light rounded p-3">
                                                <p className="text-muted mb-1">
                                                    ວັນຈັນ - ວັນສຸກ
                                                </p>
                                                <p className="fw-semibold text-gray-800 mb-0">
                                                    {prefillData.calculated
                                                        .weekday_ot_hours || 0}{' '}
                                                    hrs
                                                </p>
                                            </div>
                                        </div>

                                        <div className="col-6">
                                            <div className="bg-light rounded p-3">
                                                <p className="text-muted mb-1">
                                                    ວັນພັກ / ສຸກ - ອາທິດ
                                                </p>
                                                <p className="fw-semibold text-gray-800 mb-0">
                                                    {prefillData.calculated
                                                        .weekend_ot_hours || 0}{' '}
                                                    hrs
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-top border-gray-200 my-4" />

                                    {/* Vacation Info */}
                                    <div className="space-y-2 fs-7">
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                ມື້ທີ່ພັກໄປຂອງເດືອນນີ້:
                                            </span>
                                            <span className="fw-medium">
                                                {calculated.day_off_days_this_month} ມື້
                                            </span>
                                        </div>

                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                ມື້ພັກທີ່ມີທັງໝົດ:
                                            </span>
                                            <span className="fw-medium">
                                                {calculated.total_vacation_days} ມື້
                                            </span>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-muted">
                                                ມື້ພັກທີ່ເຫຼືອ:
                                            </span>
                                            <span className={`fw-bold text-${calculated.vacation_color}`}>
                                                {calculated.remaining_vacation_days} ມື້
                                            </span>
                                        </div>

                                        {(calculated.exceed_days ?? 0) > 0 && (
                                            <div className="mt-3 rounded bg-light-danger border border-danger p-3 text-danger fw-semibold">
                                                ⚠ ພັກເກີນ {calculated.exceed_days} ມື້
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex align-items-center mb-3">
                                        <KTIcon iconName="gas-pump" className="fs-2 text-success me-2" />
                                        <span className="fs-6 fw-medium text-gray-700">
                                            ຄ່ານ້ຳມັນ Fuel Costs
                                        </span>
                                    </div>
                                    <p className="fs-2x fw-bold text-success mb-0">
                                        {prefillData.calculated.fuel_costs.toLocaleString()}{' '}
                                        ກີບ
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const Step2OtRates: React.FC<StepComponentsProps> = ({
    prefillData,
    manualOT,
    onManualOTChange,
    manualOTDetails,
    addManualOTDetail,
    clearManualOT,
}) => {
    const [copySuccess, setCopySuccess] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    if (!prefillData) return null

    // Calculate total amount locally
    const calculateTotalAmount = () => {
        const weekdayAmount = manualOT.weekday.hours * manualOT.weekday.rate_per_hour
        const weekendHoursAmount = manualOT.weekend.hours * manualOT.weekend.rate_per_hour
        const weekendDaysAmount = manualOT.weekend.days * manualOT.weekend.rate_per_day
        return weekdayAmount + weekendHoursAmount + weekendDaysAmount
    }

    const totalAmount = calculateTotalAmount()

    // Function to copy summary to clipboard
    const copySummaryToClipboard = () => {
        const summaryText = `
OT Summary
----------
Weekday OT: ${manualOT.weekday.hours} hours × ${manualOT.weekday.rate_per_hour.toLocaleString()} Kip/hour
Weekend OT Hours: ${manualOT.weekend.hours} hours × ${manualOT.weekend.rate_per_hour.toLocaleString()} Kip/hour
Weekend OT Days: ${manualOT.weekend.days} days × ${manualOT.weekend.rate_per_day.toLocaleString()} Kip/day
Total Amount: ${totalAmount.toLocaleString()} Kip
        `.trim()

        navigator.clipboard.writeText(summaryText)
            .then(() => {
                setCopySuccess(true)
                setTimeout(() => setCopySuccess(false), 2000)
            })
            .catch(err => {
                console.error('Failed to copy: ', err)
            })
    }

    // Function to copy detailed OT table
    const copyOTDetailsToClipboard = () => {
        let detailsText = "OT Details\n-----------\n"
        
        if (manualOT.weekday.hours > 0) {
            detailsText += `Weekday: ${manualOT.weekday.hours} hours × ${manualOT.weekday.rate_per_hour.toLocaleString()} Kip/hour = ${(manualOT.weekday.hours * manualOT.weekday.rate_per_hour).toLocaleString()} Kip\n`
        }
        
        if (manualOT.weekend.hours > 0) {
            detailsText += `Weekend Hours: ${manualOT.weekend.hours} hours × ${manualOT.weekend.rate_per_hour.toLocaleString()} Kip/hour = ${(manualOT.weekend.hours * manualOT.weekend.rate_per_hour).toLocaleString()} Kip\n`
        }
        
        if (manualOT.weekend.days > 0) {
            detailsText += `Weekend Days: ${manualOT.weekend.days} days × ${manualOT.weekend.rate_per_day.toLocaleString()} Kip/day = ${(manualOT.weekend.days * manualOT.weekend.rate_per_day).toLocaleString()} Kip\n`
        }
        
        detailsText += `\nTotal: ${totalAmount.toLocaleString()} Kip`

        navigator.clipboard.writeText(detailsText)
            .then(() => {
                setSuccessMessage('✓ OT details copied to clipboard!')
                setTimeout(() => setSuccessMessage(null), 3000)
            })
          
    }

    // Calculate manual OT summary for display
    const calculateManualOTSummary = () => {
        return {
            totalHours: manualOT.weekday.hours + manualOT.weekend.hours,
            totalWeekendDays: manualOT.weekend.days,
            totalAmount: totalAmount
        }
    }

    const { totalHours, totalWeekendDays } = calculateManualOTSummary()

    return (
        <div>
            {/* Success Message */}
            {successMessage && (
                <div className="alert alert-success d-flex align-items-center mb-4">
                    <KTIcon iconName="check-circle" className="fs-2 me-2" />
                    <span className="fw-medium">{successMessage}</span>
                </div>
            )}

            <div>
                <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-primary">
                    <div className="d-flex align-items-center gap-2">
                        <KTIcon iconName="clock" className="fs-2 text-primary" />
                        <h3 className="fs-4 fw-semibold text-primary">
                            Overtime (OT) Management
                        </h3>
                    </div>
                    <button
                        onClick={copyOTDetailsToClipboard}
                        className="btn btn-light-success"
                    >
                        <KTIcon iconName="copy" className="fs-4 me-2" />
                        Copy OT Details
                    </button>
                </div>

                {/* System OT Summary */}
                <div className="mb-6 card">
                    <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <div className="d-flex align-items-center gap-2">
                                <KTIcon iconName="calculator" className="fs-2 text-primary" />
                                <h4 className="fw-bold text-primary uppercase tracking-wide fs-7">
                                    System Approved OT
                                </h4>
                            </div>
                            <span className="badge badge-light-success fs-7">
                                Auto-calculated
                            </span>
                        </div>

                        <div className="row g-3">
                            <div className="col-md-6">
                                <div className="card border border-primary">
                                    <div className="card-header bg-primary">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <span className="text-white fs-7 fw-medium">
                                                Weekday OT (Mon-Fri)
                                            </span>
                                            <KTIcon iconName="clock" className="text-white fs-4" />
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <p className="fs-2x fw-bold text-primary mb-0">
                                            {prefillData.calculated.weekday_ot_hours || 0}
                                            <span className="fs-5 fw-medium text-muted ms-1">
                                                hours
                                            </span>
                                        </p>
                                        <p className="text-muted fs-7 mt-1">
                                            Automatically calculated from attendance
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="card border border-warning">
                                    <div className="card-header bg-warning">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <span className="text-white fs-7 fw-medium">
                                                Weekend OT (Sat-Sun)
                                            </span>
                                            <KTIcon iconName="calendar-8" className="text-white fs-4" />
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <p className="fs-2x fw-bold text-warning mb-0">
                                            {prefillData.calculated.weekend_ot_hours || 0}
                                            <span className="fs-5 fw-medium text-muted ms-1">
                                                hours
                                            </span>
                                        </p>
                                        <p className="text-muted fs-7 mt-1">
                                            Including holidays and weekends
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Manual OT Entry Section */}
                <div className="mb-8">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center gap-2">
                            <KTIcon iconName="pencil" className="fs-2 text-primary" />
                            <h4 className="fw-bold text-primary">
                                Manual OT Entry
                            </h4>
                        </div>
                        <span className="badge badge-light-primary fs-7">
                            Enter additional OT here
                        </span>
                    </div>

                    <div className="row g-4 mb-6">
                        <div className="col-md-6">
                            <WeekdayOTCard
                                hours={manualOT.weekday.hours}
                                rate_per_hour={manualOT.weekday.rate_per_hour}
                                onHoursChange={(value) =>
                                    onManualOTChange('weekday', 'hours', value)
                                }
                                onRatePerHourChange={(value) =>
                                    onManualOTChange(
                                        'weekday',
                                        'rate_per_hour',
                                        value,
                                    )
                                }
                            />
                        </div>

                        <div className="col-md-6">
                            <WeekendOTCard
                                hours={manualOT.weekend.hours}
                                days={manualOT.weekend.days}
                                rate_per_hour={manualOT.weekend.rate_per_hour}
                                rate_per_day={manualOT.weekend.rate_per_day}
                                onHoursChange={(value) =>
                                    onManualOTChange('weekend', 'hours', value)
                                }
                                onDaysChange={(value) =>
                                    onManualOTChange('weekend', 'days', value)
                                }
                                onRatePerHourChange={(value) =>
                                    onManualOTChange(
                                        'weekend',
                                        'rate_per_hour',
                                        value,
                                    )
                                }
                                onRatePerDayChange={(value) =>
                                    onManualOTChange(
                                        'weekend',
                                        'rate_per_day',
                                        value,
                                    )
                                }
                            />
                        </div>
                    </div>

                    {/* Summary Card with Copy Button */}
                    <div className="card border border-primary">
                        <div className="card-header bg-primary">
                            <div className="d-flex align-items-center justify-content-between">
                                <h5 className="card-title text-white m-0">
                                    OT Summary
                                </h5>
                                <div className="d-flex align-items-center gap-2">
                                    {copySuccess && (
                                        <span className="badge badge-success fs-7">
                                            <KTIcon iconName="check" className="me-1" />
                                            Copied!
                                        </span>
                                    )}
                                    <button
                                        onClick={copySummaryToClipboard}
                                        className="btn btn-sm btn-light-success"
                                    >
                                        <KTIcon iconName="copy" className="fs-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-8">
                                    <div className="space-y-3">
                                        {/* Weekday Row */}
                                        {manualOT.weekday.hours > 0 && (
                                            <div className="d-flex align-items-center justify-content-between p-3 bg-light-primary rounded">
                                                <div className="d-flex align-items-center gap-2">
                                                    <KTIcon iconName="clock" className="fs-4 text-primary" />
                                                    <div>
                                                        <div className="fw-medium text-primary">
                                                            Weekday OT
                                                        </div>
                                                        <div className="fs-7 text-muted">
                                                            Regular working days
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fs-8 text-muted">
                                                        {manualOT.weekday.hours} hrs × {manualOT.weekday.rate_per_hour.toLocaleString()} Kip
                                                    </div>
                                                    <div className="fs-5 fw-bold text-primary">
                                                        {(manualOT.weekday.hours * manualOT.weekday.rate_per_hour).toLocaleString()} Kip
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Weekend Hours Row */}
                                        {manualOT.weekend.hours > 0 && (
                                            <div className="d-flex align-items-center justify-content-between p-3 bg-light-warning rounded">
                                                <div className="d-flex align-items-center gap-2">
                                                    <KTIcon iconName="clock" className="fs-4 text-warning" />
                                                    <div>
                                                        <div className="fw-medium text-warning">
                                                            Weekend OT Hours
                                                        </div>
                                                        <div className="fs-7 text-muted">
                                                            Saturday/Sunday hours
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fs-8 text-muted">
                                                        {manualOT.weekend.hours} hrs × {manualOT.weekend.rate_per_hour.toLocaleString()} Kip
                                                    </div>
                                                    <div className="fs-5 fw-bold text-warning">
                                                        {(manualOT.weekend.hours * manualOT.weekend.rate_per_hour).toLocaleString()} Kip
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Weekend Days Row */}
                                        {manualOT.weekend.days > 0 && (
                                            <div className="d-flex align-items-center justify-content-between p-3 bg-light-success rounded">
                                                <div className="d-flex align-items-center gap-2">
                                                    <KTIcon iconName="calendar-8" className="fs-4 text-success" />
                                                    <div>
                                                        <div className="fw-medium text-success">
                                                            Weekend OT Days
                                                        </div>
                                                        <div className="fs-7 text-muted">
                                                            Full/half day rates
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="fs-8 text-muted">
                                                        {manualOT.weekend.days} days × {manualOT.weekend.rate_per_day.toLocaleString()} Kip
                                                    </div>
                                                    <div className="fs-5 fw-bold text-success">
                                                        {(manualOT.weekend.days * manualOT.weekend.rate_per_day).toLocaleString()} Kip
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="h-100 d-flex flex-column justify-content-center p-4 bg-light rounded border">
                                        <div className="text-center mb-3">
                                            <div className="text-muted fs-7 mb-1">
                                                Total Summary
                                            </div>
                                            <div className="fs-3 fw-bold text-primary">
                                                {totalAmount.toLocaleString()}
                                                <span className="fs-6 text-muted ms-1">Kip</span>
                                            </div>
                                        </div>

                                        <div className="border-top pt-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-muted fs-7">Total Hours:</span>
                                                <span className="fw-medium">{totalHours}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="text-muted fs-7">Weekend Days:</span>
                                                <span className="fw-medium">{totalWeekendDays}</span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted fs-7">Entries:</span>
                                                <span className="fw-medium">
                                                    {manualOTDetails.length} item{manualOTDetails.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="d-flex justify-content-between align-items-center mt-4 pt-4 border-top">
                                <div className="fs-7 text-muted">
                                    <KTIcon iconName="shield-tick" className="me-2 text-success" />
                                    Changes are saved automatically
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        onClick={clearManualOT}
                                        className="btn btn-light-danger"
                                    >
                                        <KTIcon iconName="trash" className="fs-4 me-2" />
                                        Clear All
                                    </button>
                                    <button
                                        onClick={addManualOTDetail}
                                        disabled={
                                            (manualOT.weekday.hours === 0 &&
                                                manualOT.weekend.hours === 0 &&
                                                manualOT.weekend.days === 0) ||
                                            (manualOT.weekday.hours > 0 &&
                                                manualOT.weekday.rate_per_hour === 0) ||
                                            (manualOT.weekend.hours > 0 &&
                                                manualOT.weekend.rate_per_hour === 0) ||
                                            (manualOT.weekend.days > 0 &&
                                                manualOT.weekend.rate_per_day === 0)
                                        }
                                        className="btn btn-primary"
                                    >
                                        <KTIcon iconName="plus" className="fs-4 me-2" />
                                        Add to OT List
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Display Manual OT Details */}
                {manualOTDetails.length > 0 && (
                    <div className="mt-8">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <h4 className="fw-bold text-primary">
                                Manual OT Entries
                            </h4>
                            <span className="badge badge-primary">
                                {manualOTDetails.length} entries
                            </span>
                        </div>
                        <OtDetailsTable
                            otDetails={manualOTDetails}
                            title="Manual OT Details"
                            showDate={false}
                        />
                    </div>
                )}

                {/* Success Status Banner */}
                {successMessage && (
                    <div className="mt-4 p-4 bg-light-success border border-success rounded">
                        <div className="d-flex align-items-center gap-3">
                            <KTIcon iconName="shield-tick" className="fs-2 text-success" />
                            <div>
                                <div className="fw-bold text-success">
                                    Success! OT details saved
                                </div>
                                <div className="text-muted fs-7">
                                    The overtime calculation has been added to the salary calculation. 
                                    You can proceed to the next step.
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export const Step3AdditionalIncome: React.FC<StepComponentsProps> = ({
    formData,
    onInputChange,
}) => {
    return (
        <div>
            <div>
                <div className="d-flex align-items-center gap-2 mb-4 pb-3 border-bottom border-primary">
                    <KTIcon iconName="dollar" className="fs-2 text-primary" />
                    <h3 className="fs-4 fw-semibold text-primary">
                        ລາຍໄດ້ເພີ່ມເຕີມ
                    </h3>
                </div>
                <div className="row g-4">
                    <div className="col-md-6">
                        <label className="form-label">
                            Bonus
                        </label>
                        <div className="input-group">
                            <input
                                type="number"
                                name="bonus"
                                value={formData.bonus === 0 ? "" : formData.bonus}
                                onChange={onInputChange}
                                className="form-control"
                            />
                            <span className="input-group-text">ກີບ</span>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">
                            Commission
                        </label>
                        <div className="input-group">
                            <input
                                type="number"
                                name="commission"
                                value={formData.commission === 0 ? "" : formData.commission}
                                onChange={onInputChange}
                                className="form-control"
                            />
                            <span className="input-group-text">ກີບ</span>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">
                            ເງິນອຸດໜູນວັນພັກປະຈຳປີ
                        </label>
                        <div className="input-group">
                            <input
                                type="number"
                                name="money_not_spent_on_holidays"
                                value={formData.money_not_spent_on_holidays === 0 ? '' : formData.money_not_spent_on_holidays}
                                onChange={onInputChange}
                                className="form-control"
                            />
                            <span className="input-group-text">ກີບ</span>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">
                            ລາຍຮັບອື່ນໆ
                        </label>
                        <div className="input-group">
                            <input
                                type="number"
                                name="other_income"
                                value={formData.other_income === 0 ? "" : formData.other_income}
                                onChange={onInputChange}
                                className="form-control"
                            />
                            <span className="input-group-text">ກີບ</span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 p-4 bg-light-primary border border-primary rounded">
                    <p className="mb-0 fw-bold">
                        Total Additional Income: {(
                            formData.bonus +
                            formData.commission +
                            formData.money_not_spent_on_holidays +
                            formData.other_income
                        ).toLocaleString()} ກີບ
                    </p>
                </div>
            </div>
        </div>
    )
}


export const Step4Deductions: React.FC<StepComponentsProps> = ({
    formData,
    onInputChange,
    calculateTotalDeductions,
    handleCutOffDaysChange,  // ✅ Add this line to destructure the prop
}) => {
    // ✅ Calculate cut-off total
    const calculateCutOffTotal = () => {
        return formData.cut_off_pay_days * formData.cut_off_pay_amount
    }

    return (
        <div>
            <div>
                <div className="d-flex align-items-center gap-2 mb-4 pb-3 border-bottom border-danger">
                    <KTIcon iconName="user-cross" className="fs-2 text-danger" />
                    <h3 className="fs-4 fw-semibold text-danger">
                        Deductions (ລາຍການຫັກ)
                    </h3>
                </div>
                <div className="row g-4">
                    {/* Cut off pay for days off work */}
                    <div className="col-12">
                        <div className="card card-bordered border-danger">
                            <div className="card-header bg-light-danger">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <KTIcon iconName="calendar-cross" className="fs-2 text-danger" />
                                    <h4 className="fw-semibold text-danger m-0">
                                        ຫັກເງິນເດືອນຈາກການຂາດງານ
                                    </h4>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="row g-4">
                                    {/* ✅ Input 1: Number of days absent */}
                                    <div className="col-md-6">
                                        <label className="form-label">
                                            ຈຳນວນວັນທີ່ຂາດງານ (Days Off Work)
                                        </label>
                                        <input
                                            type="number"
                                            name="cut_off_pay_days"
                                            value={formData.cut_off_pay_days === 0 ? "" : formData.cut_off_pay_days}
                                            onChange={(e) => {
                                                const days = parseFloat(e.target.value) || 0
                                                if (handleCutOffDaysChange) {
                                                    handleCutOffDaysChange(days)
                                                } else {
                                                    // Fallback to regular input change
                                                    onInputChange(e)
                                                }
                                            }}
                                            min="0"
                                            step="0.5"
                                            className="form-control"
                                            placeholder="0"
                                        />
                                        <div className="form-text">
                                            ສາມາດໃສ່ 0.5 ສຳລັບເຄິ່ງວັນ
                                        </div>
                                    </div>

                                    {/* ✅ Input 2: Rate per day (manual input) */}
                                    <div className="col-md-6">
                                        <label className="form-label">
                                            ອັດຕາການຫັກຕໍ່ວັນ (Cut Off Rate per Day)
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                name="cut_off_pay_amount"
                                                value={formData.cut_off_pay_amount === 0 ? "" : formData.cut_off_pay_amount}
                                                onChange={onInputChange}
                                                min="0"
                                                className="form-control"
                                                placeholder="0"
                                            />
                                            <span className="input-group-text">ກີບ/ວັນ</span>
                                        </div>
                                        <div className="form-text">
                                            ປ້ອນຈຳນວນເງິນທີ່ຕ້ອງການຫັກຕໍ່ 1 ວັນ
                                        </div>
                                    </div>
                                </div>

                                {/* ✅ Summary Box - Show total deduction */}
                                {formData.cut_off_pay_days > 0 &&
                                    formData.cut_off_pay_amount > 0 && (
                                        <div className="mt-4 p-3 bg-white border border-danger rounded">
                                            <div className="fs-7 text-danger">
                                                <span className="fw-medium">
                                                    ສະຫຼຸບ:
                                                </span>{' '}
                                                ຫັກເງິນ {formData.cut_off_pay_days} ວັນ
                                                × ₭
                                                {formData.cut_off_pay_amount.toLocaleString()}
                                                /ວັນ =
                                                <span className="fw-bold ms-1 fs-5">
                                                    {calculateCutOffTotal().toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>

                    {/* Office Expenses */}
                    <div className="col-md-6">
                        <label className="form-label">
                            Office Expenses (ຄ່າໃຊ້ຈ່າຍສຳນັກງານ)
                        </label>
                        <div className="input-group">
                            <input
                                type="number"
                                name="office_expenses"
                                value={formData.office_expenses === 0 ? "" : formData.office_expenses}
                                onChange={onInputChange}
                                className="form-control"
                            />
                            <span className="input-group-text">ກີບ</span>
                        </div>
                    </div>

                    {/* Social Security */}
                    <div className="col-md-6">
                        <label className="form-label">
                            Social Security (ປະກັນສັງຄົມ)
                        </label>
                        <div className="input-group">
                            <input
                                type="number"
                                name="social_security"
                                value={formData.social_security === 0 ? "" : formData.social_security}
                                onChange={onInputChange}
                                className="form-control"
                            />
                            <span className="input-group-text">ກີບ</span>
                        </div>
                    </div>

                    {/* Working Days */}
                    <div className="col-md-6">
                        <label className="form-label">
                            Working Days (ຈຳນວນວັນເຮັດວຽກ)
                        </label>
                        <input
                            type="number"
                            name="working_days"
                            value={formData.working_days}
                            onChange={onInputChange}
                            min="0"
                            max="31"
                            className="form-control"
                        />
                        <div className="form-text">
                            ຈຳນວນວັນທີ່ເຮັດວຽກໃນເດືອນນີ້
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="col-md-6">
                        <label className="form-label">
                            Notes (ໝາຍເຫດ)
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={onInputChange}
                            rows={3}
                            placeholder="ໝາຍເຫດເພີ່ມເຕີມ..."
                            className="form-control"
                        />
                    </div>
                </div>

                {/* Total Deductions Summary */}
                <div className="mt-4 p-4 bg-light-danger border border-danger rounded">
                    <div className="space-y-2">
                        <div className="d-flex justify-content-between fs-7">
                            <span className="text-gray-700">
                                ຄ່າໃຊ້ຈ່າຍສຳນັກງານ:
                            </span>
                            <span className="fw-medium">
                                {formData.office_expenses.toLocaleString()} ກີບ
                            </span>
                        </div>
                        <div className="d-flex justify-content-between fs-7">
                            <span className="text-gray-700">ປະກັນສັງຄົມ:</span>
                            <span className="fw-medium">
                                {formData.social_security.toLocaleString()} ກີບ
                            </span>
                        </div>
                        <div className="d-flex justify-content-between fs-7">
                            <span className="text-gray-700">
                                ຫັກເງິນຈາກການຂາດງານ:
                            </span>
                            <span className="fw-medium text-danger">
                                {calculateCutOffTotal().toLocaleString()} ກີບ
                            </span>
                        </div>
                        <div className="border-top border-danger pt-2 mt-2">
                            <div className="d-flex justify-content-between">
                                <span className="fw-bold text-danger">
                                    Total Deductions:
                                </span>
                                <span className="fw-bold text-danger fs-5">
                                    {calculateTotalDeductions().toLocaleString()} ກີບ
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
// In SalaryStepComponents.tsx - Update Step5Summary

export const Step5Summary: React.FC<StepComponentsProps> = ({
    user,
    prefillData,
    formData,
    manualOTDetails,
}) => {
    const [svgRef, setSvgRef] = useState<HTMLDivElement | null>(null)
    const [isExporting, setIsExporting] = useState(false)
    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [isCapturing, setIsCapturing] = useState(false)
    const [emailStatus, setEmailStatus] = useState<{
        success: boolean
        message: string
    } | null>(null)

    if (!prefillData) return null

    const allOTDetails = [
        ...(prefillData.calculated.ot_details || []),
        ...(manualOTDetails || []),
    ]

    const totalOTAmount = allOTDetails.reduce(
        (sum, detail) => sum + detail.amount,
        0,
    )

    // Format date for payment
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
    }

    const currentDate = new Date()

    // Calculate additional income - using formData
    const additionalIncome = {
        fuel: prefillData.calculated.fuel_costs || 0,
        computer: 0,
        ot: totalOTAmount,
        bonus: formData.bonus,
        holidayAllowance: formData.money_not_spent_on_holidays,
        officeExpenses: formData.office_expenses,
        other: formData.other_income,
        commission: formData.commission,
    }

    // Calculate deductions
    const cutOffTotal = formData.cut_off_pay_days * formData.cut_off_pay_amount

    const deductions = {
        absence: cutOffTotal,
        socialSecurity: formData.social_security,
    }

    // Calculate totals
    const totalAdditionalIncome = Object.values(additionalIncome).reduce(
        (a, b) => a + b,
        0,
    )
    const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0)
    const totalIncome = prefillData.user.base_salary + totalAdditionalIncome
    const netSalary = totalIncome - totalDeductions

    // Function to format currency
    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }

    // ✅ Better email extraction with multiple fallbacks
    const getUserEmail = () => {
        // Try different possible email field names
        const email = user?.email || 
                     user?.user_email || 
                     user?.Email || 
                     prefillData?.user 
                     '';
        
        console.log('User object:', user); // Debug log
        console.log('Extracted email:', email); // Debug log
        
        return email;
    }

    const userEmail = getUserEmail()

    // ✅ Better name extraction
    const getUserName = () => {
        const firstName = user?.first_name_en || user?.firstName || user?.first_name || '';
        const lastName = user?.last_name_en || user?.lastName || user?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        console.log('Extracted name:', fullName); // Debug log
        
        return fullName || 'Employee';
    }

    const userName = getUserName()

    // ✅ Validate email before allowing send
    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    // Function to export as PNG
    const exportToPNG = async () => {
        if (!svgRef) return

        try {
            setIsExporting(true)
            setIsCapturing(true)

            // รอให้ DOM update
            await new Promise((resolve) => setTimeout(resolve, 100))

            const html2canvas = (await import('html2canvas')).default

            const canvas = await html2canvas(svgRef, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
            })

            const link = document.createElement('a')
            const fileName = `salary-summary-${userName.replace(/\s+/g, '-')}-${getMonthName(formData.month)}-${formData.year}.png`

            link.download = fileName
            link.href = canvas.toDataURL('image/png')
            link.click()

            URL.revokeObjectURL(link.href)
        } catch (error) {
            console.error('Failed to export PNG:', error)
            alert('Failed to export PNG. Please try again.')
        } finally {
            setIsCapturing(false)
            setIsExporting(false)
        }
    }

    // Function to send email with PNG
    const sendEmailWithPNG = async () => {
        // ✅ Validate email before proceeding
        if (!userEmail) {
            setEmailStatus({
                success: false,
                message: '❌ Employee email not found. Please ensure user data is loaded properly.',
            })
            return
        }

        if (!isValidEmail(userEmail)) {
            setEmailStatus({
                success: false,
                message: `❌ Invalid email address: ${userEmail}`,
            })
            return
        }

        if (!svgRef) {
            setEmailStatus({
                success: false,
                message: '❌ Content not ready for export.',
            })
            return
        }

        try {
            setIsSendingEmail(true)
            setEmailStatus(null)
            setIsCapturing(true)

            // รอให้ DOM update
            await new Promise((resolve) => setTimeout(resolve, 100))

            // Convert to image
            const html2canvas = (await import('html2canvas')).default
            const canvas = await html2canvas(svgRef, {
                scale: 0.8,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                ignoreElements: (element) => {
                    // Ignore elements that might cause issues
                    return element.classList?.contains('no-export')
                },
            })

            setIsCapturing(false)

            // Convert to JPEG
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
            const base64String = dataUrl.split(',')[1]

            // Prepare data
            const emailData: SalaryEmailRequest = {
                to: userEmail,
                subject: `Salary Summary - ${getMonthName(formData.month)} ${formData.year}`,
                employeeName: userName,
                month: getMonthName(formData.month),
                year: formData.year,
                baseSalary: prefillData.user.base_salary,
                netSalary,
                image: base64String,
                fileName: `salary-summary-${userName.replace(/\s+/g, '-')}.jpg`,
            }

            console.log('Sending email to:', userEmail); // Debug log

            // API base URL
            const API_BASE_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8001'

            // ส่งไปยัง backend API
            const response = await fetch(
                `${API_BASE_URL}/salary/send-email`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(emailData),
                },
            )

            if (!response.ok) {
                let errorMessage = 'Failed to send email'
                try {
                    const errorData: EmailResponse = await response.json()
                    errorMessage = errorData.message || errorMessage
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`
                }
                throw new Error(errorMessage)
            }

            const result: EmailResponse = await response.json()

            if (result.success) {
                setEmailStatus({
                    success: true,
                    message: `✅ Salary summary sent successfully to ${userEmail}`,
                })
            } else {
                throw new Error(result.message || 'Failed to send email')
            }
        } catch (error: any) {
            console.error('Failed to send email:', error)
            setEmailStatus({
                success: false,
                message: `❌ ${error.message || 'Failed to send email'}`,
            })
        } finally {
            setIsCapturing(false)
            setIsSendingEmail(false)
        }
    }

    return (
  <div>
            
            <style>{`
                .export-mode,
                .export-mode * {
                    color: rgb(17, 24, 39) !important;
                }

                .export-mode .text-white {
                    color: rgb(255, 255, 255) !important;
                }

                .export-mode .text-red-600 {
                    color: rgb(220, 38, 38) !important;
                }

                .export-mode .text-red-700 {
                    color: rgb(185, 28, 28) !important;
                }

                .export-mode .text-green-600 {
                    color: rgb(22, 163, 74) !important;
                }

                .export-mode .text-gray-600 {
                    color: rgb(75, 85, 99) !important;
                }

                .export-mode .text-gray-700 {
                    color: rgb(55, 65, 81) !important;
                }

                .export-mode .text-gray-800 {
                    color: rgb(31, 41, 55) !important;
                }

                .export-mode .bg-white {
                    background-color: rgb(255, 255, 255) !important;
                }

                .export-mode .bg-gray-50 {
                    background-color: rgb(249, 250, 251) !important;
                }

                .export-mode .bg-gray-100 {
                    background-color: rgb(243, 244, 246) !important;
                }

                .export-mode .bg-blue-50 {
                    background-color: rgb(239, 246, 255) !important;
                }

                .export-mode .bg-green-50 {
                    background-color: rgb(240, 253, 244) !important;
                }

                .export-mode [class*='bg-primary'] {
                    background-color: rgb(69, 204, 103) !important;
                }

                .export-mode [class*='bg-primary'] {
                    background-color: rgb(31, 58, 95) !important;
                }

                .export-mode [class*='text-primary'] {
                    color: rgb(31, 58, 95) !important;
                }

                .export-mode .border-gray-200 {
                    border-color: rgb(229, 231, 235) !important;
                }

                .export-mode .border-gray-300 {
                    border-color: rgb(209, 213, 219) !important;
                }
            `}</style>

            <div>
                {/* Header with buttons */}
                <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-primary">
                    <div className="d-flex align-items-center gap-2">
                        <KTIcon iconName="calculator" className="fs-2 text-primary" />
                        <h3 className="fs-4 fw-semibold text-primary">
                            Salary Summary
                        </h3>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            onClick={exportToPNG}
                            disabled={isExporting}
                            className="btn btn-light-primary"
                        >
                            {isExporting ? (
                                <span className="spinner-border spinner-border-sm me-2"></span>
                            ) : (
                                <KTIcon iconName="download" className="fs-4 me-2" />
                            )}
                            {isExporting ? 'Exporting...' : 'Export PNG'}
                        </button>
                        <button
                            onClick={sendEmailWithPNG}
                            disabled={isSendingEmail}
                            className="btn btn-success"
                        >
                            {isSendingEmail ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <KTIcon iconName="mail" className="fs-4 me-2" />
                                    Send to Employee
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Email Status Message */}
                {emailStatus && (
                    <div
                        className={`mb-4 p-3 rounded ${emailStatus.success ? 'alert alert-success' : 'alert alert-danger'}`}
                    >
                        <div className="fw-medium">
                            {emailStatus.success ? '✓ Success!' : '✗ Error'}
                        </div>
                        <div className="fs-7">
                            {emailStatus.message}
                        </div>
                    </div>
                )}

                {/* Email Info */}
                <div className="mb-4 p-3 bg-light-primary border border-primary rounded">
                    <div className="fs-7 text-primary">
                        <div className="fw-medium mb-1">
                            Email will be sent to:
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <KTIcon iconName="mail" className="fs-4" />
                            <span>{userEmail}</span>
                        </div>
                    </div>
                </div>

                {/* ✅ Salary Summary Content - เพิ่ม export-mode class */}
                <div
                    ref={setSvgRef}
                    className={`border border-gray-300 rounded-lg p-6 bg-white ${isCapturing ? 'export-mode' : ''}`}
                >
                    {/* Header */}
                    <div className="text-center mb-8 border-bottom pb-4">
                        <h1 className="fs-2x fw-bold text-primary">
                            Salary Summary
                        </h1>
                        <p className="text-muted mt-1">
                            {getMonthName(formData.month)} {formData.year}
                        </p>
                    </div>

                    {/* Employee Information */}
                    <div className="mb-6 p-4 bg-light rounded border">
                        <h3 className="fw-bold text-primary mb-3">
                            ຂໍ້ມູນພື້ນພະນັກງານ
                        </h3>
                        <div className="row g-4">
                            <div className="col-6">
                                <span className="text-muted">Name:</span>
                                <span className="ms-2 fw-medium">
                                    {userName}
                                </span>
                            </div>
                            <div className="col-6">
                                <span className="text-muted">Email:</span>
                                <span className="ms-2 fw-medium">
                                    {userEmail}
                                </span>
                            </div>
                            <div className="col-6">
                                <span className="text-muted">
                                    ເງິນເດືອນພື້ນຖານ:
                                </span>
                                <span className="ms-2 fw-bold text-primary">
                                    {formatCurrency(
                                        prefillData.user.base_salary,
                                    )}
                                </span>
                            </div>
                            <div className="col-6">
                                <span className="text-muted">
                                    ມື້ເຮັດວຽກ:
                                </span>
                                <span className="ms-2 fw-medium">
                                    {formData.working_days || 0} ມື້
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Salary Table */}
                    <div className="table-responsive mb-8">
                        <table className="table table-bordered fs-7 text-gray-900">
                            <thead>
                                <tr className="bg-primary text-white">
                                    <th className="p-3 border text-start fw-bold">
                                        ລາຍຮັບ
                                    </th>
                                    <th className="p-3 border text-start fw-bold">
                                        ລາຍຮັບເພີ່ມເຕີມ
                                    </th>
                                    <th className="p-3 border text-start fw-bold">
                                        ຈຳນວນເງິນ
                                    </th>
                                    <th className="p-3 border text-start fw-bold">
                                        ລາຍການຫັກ
                                    </th>
                                    <th className="p-3 border text-start fw-bold">
                                        ຈຳນວນເງິນ
                                    </th>
                                    <th className="p-3 border text-start fw-bold">
                                        ວັນທີຈ່າຍ
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Base Salary Row */}
                                <tr className="bg-white text-gray-800">
                                    <td className="p-3 border fw-medium">
                                        ເງິນເດືອນພື້ນຖານ
                                    </td>
                                    <td className="p-3 border text-center text-muted">
                                        -
                                    </td>
                                    <td className="p-3 border fw-bold">
                                        {formatCurrency(
                                            prefillData.user.base_salary,
                                        )}
                                    </td>
                                    <td className="p-3 border">
                                        ມື້ຂາດວຽກ{' '}
                                        {formData.cut_off_pay_days > 0 && (
                                            <>
                                                ({formData.cut_off_pay_days} ມື້
                                                {' × '}
                                                {formData.cut_off_pay_amount.toLocaleString()}
                                                /ມື້)
                                            </>
                                        )}
                                    </td>
                                    <td className="p-3 border text-danger">
                                        {formatCurrency(cutOffTotal)}
                                    </td>
                                    <td
                                        className="p-3 border fw-bold text-center"
                                        rowSpan={7}
                                    >
                                        {formatDate(currentDate)}
                                    </td>
                                </tr>

                                {/* Additional Income Rows */}
                                <tr>
                                    <td
                                        className="p-3 border bg-light fw-medium"
                                        rowSpan={7}
                                    >
                                        ລາຍໄດ້ອື່ນໆ
                                    </td>
                                    <td className="p-3 border">ຄ່ານ້ຳມັນ</td>
                                    <td className="p-3 border">
                                        {formatCurrency(additionalIncome.fuel)}
                                    </td>
                                    <td className="p-3 border" rowSpan={2}>
                                        ປະກັນສັງຄົມ
                                    </td>
                                    <td
                                        className="p-3 border text-danger"
                                        rowSpan={2}
                                    >
                                        {formatCurrency(
                                            deductions.socialSecurity,
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-3 border">ຄ່າຄອມມິດຊັນ</td>
                                    <td className="p-3 border">
                                        {formatCurrency(
                                            additionalIncome.commission,
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-3 border">
                                        ຄ່າລ່ວງເວລາ (OT)
                                    </td>
                                    <td className="p-3 border">
                                        {formatCurrency(additionalIncome.ot)}
                                    </td>
                                    <td className="p-3 border" colSpan={2}></td>
                                </tr>
                                <tr>
                                    <td className="p-3 border">ເງິນໂບນັດ</td>
                                    <td className="p-3 border">
                                        {formatCurrency(additionalIncome.bonus)}
                                    </td>
                                    <td className="p-3 border" colSpan={2}></td>
                                </tr>
                                <tr>
                                    <td className="p-3 border">
                                        ຄ່າເຮັດວຽກມື້ພັກ
                                    </td>
                                    <td className="p-3 border">
                                        {formatCurrency(
                                            additionalIncome.holidayAllowance,
                                        )}
                                    </td>
                                    <td className="p-3 border" colSpan={2}></td>
                                </tr>
                                <tr>
                                    <td className="p-3 border">
                                        ຄ່າໃຊ້ຈ່າຍຫ້ອງການ
                                    </td>
                                    <td className="p-3 border">
                                        {formatCurrency(
                                            additionalIncome.officeExpenses,
                                        )}
                                    </td>
                                    <td className="p-3 border" colSpan={2}></td>
                                </tr>
                                <tr>
                                    <td className="p-3 border">ອື່ນໆ</td>
                                    <td className="p-3 border">
                                        {formatCurrency(additionalIncome.other)}
                                    </td>
                                    <td className="p-3 border" colSpan={2}></td>
                                </tr>

                                {/* Totals Row */}
                                <tr className="bg-light fw-bold text-primary">
                                    <td
                                        className="p-3 border text-end"
                                        colSpan={2}
                                    >
                                        ລວມລາຍຮັບທັງໝົດ:
                                    </td>
                                    <td className="p-3 border">
                                        {formatCurrency(totalIncome)}
                                    </td>
                                    <td className="p-3 border text-end">
                                        ລວມລາຍການຫັກ:
                                    </td>
                                    <td className="p-3 border text-danger">
                                        {formatCurrency(totalDeductions)}
                                    </td>
                                    <td className="p-3 border"></td>
                                </tr>

                                {/* Net Salary Row */}
                                <tr className="bg-primary text-white fw-bold">
                                    <td
                                        className="p-4 border text-center fs-5"
                                        colSpan={4}
                                    >
                                        ເງິນເດືອນສຸດທິ (NET SALARY)
                                    </td>
                                    <td
                                        className="p-4 border text-center fs-4"
                                        colSpan={2}
                                    >
                                        {formatCurrency(netSalary)} ກີບ
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Additional Information */}
                    <div className="p-4 bg-light rounded border">
                        <h3 className="fw-bold text-primary mb-3">
                            ຂໍ້ມູນເພີ່ມເຕີມ
                        </h3>
                        <div className="row g-4">
                            <div className="col-6">
                                <span className="text-muted">
                                    ມື້ເຮັດວຽກ:
                                </span>
                                <span className="ms-2 fw-medium">
                                    {formData.working_days || 0} ມື້
                                </span>
                            </div>
                            <div className="col-6">
                                <span className="text-muted">
                                    ວັນພັກທີ່ເຫຼືອ:
                                </span>
                                <span className="ms-2 fw-medium">
                                    {prefillData.calculated
                                        .remaining_vacation_days || 0}{' '}
                                    ມື້
                                </span>
                            </div>
                            <div className="col-6">
                                <span className="text-muted">OT Hours:</span>
                                <span className="ms-2 fw-medium">
                                    {prefillData.calculated.ot_hours || 0}{' '}
                                    ຊົ່ວໂມງ
                                </span>
                            </div>
                            <div className="col-6">
                                <span className="text-muted">ມື້ພັກ:</span>
                                <span className="ms-2 fw-medium">
                                    {prefillData.calculated
                                        .day_off_days_this_month || 0}{' '}
                                    ມື້
                                </span>
                            </div>
                        </div>
                        {formData.notes && (
                            <div className="mt-4 p-3 bg-white rounded border">
                                <span className="fw-medium text-gray-700">
                                    Notes:
                                </span>
                                <p className="mt-1 text-muted">
                                    {formData.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-top text-center text-muted fs-7">
                        <p>
                            Generated on {new Date().toLocaleDateString()} •
                            This is an official salary statement
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}