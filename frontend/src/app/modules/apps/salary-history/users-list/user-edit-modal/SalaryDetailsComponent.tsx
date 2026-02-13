import React, { useRef, FC } from 'react'
import {
  KTIcon,
  
} from '../../../../../../_metronic/helpers'
import { SalaryData, getMonthName, formatDate, formatCurrency } from '../core/_models'


// Define props interface
interface SalaryDetailsComponentProps {
  salary: SalaryData
  onExport: () => Promise<void>
  onSendEmail: () => Promise<void>
  isExporting: boolean
  isSendingEmail: boolean
  emailStatus: { success: boolean; message: string } | null
}

const SalaryDetailsComponent: FC<SalaryDetailsComponentProps> = ({
  salary,
  onExport,
  onSendEmail,
  isExporting,
  isSendingEmail,
  emailStatus,
}) => {
  
  const payslipRef = useRef<HTMLDivElement>(null)

  // Calculate totals
  const totalIncome =
    salary.base_salary +
    salary.ot_amount +
    salary.bonus +
    salary.commission +
    salary.fuel_costs +
    (salary.money_not_spent_on_holidays || 0) +
    (salary.other_income || 0)
  
  const cutOffTotal = (salary.cut_off_pay_days || 0) * (salary.cut_off_pay_amount || 0)
  const totalDeductions = (salary.office_expenses || 0) + (salary.social_security || 0) + cutOffTotal
  
  const userName = `${salary.user_id.first_name_en} ${salary.user_id.last_name_en}`
  const userEmail = salary.user_id.email

  // Get status color for Metronic
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'approved':
        return 'success'
      case 'paid':
        return 'primary'
      case 'cancelled':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="row g-5 g-xl-8">
      {/* Email Status Alert */}
      {emailStatus && (
        <div className="col-12">
          <div className={`alert alert-${emailStatus.success ? 'success' : 'danger'} d-flex align-items-center p-5`}>
            <KTIcon 
              iconName={emailStatus.success ? 'check-circle' : 'cross-circle'} 
              className={`text-${emailStatus.success ? 'success' : 'danger'} fs-2hx me-4`}
            />
            <div className="d-flex flex-column">
              <h4 className={`mb-1 text-${emailStatus.success ? 'success' : 'danger'}`}>
                {emailStatus.success ? 'Success!' : 'Error'}
              </h4>
              <span>{emailStatus.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons Card */}
      <div className="col-12">
        <div className="card card-flush">
          <div className="card-header pt-7">
            <h3 className="card-title align-items-start flex-column">
              <span className="card-label fw-bold text-gray-800">Send Payslip</span>
              <span className="text-gray-400 mt-1 fw-semibold fs-6">
                Send salary slip to {userEmail}
              </span>
            </h3>
            <div className="card-toolbar">
              <div className="d-flex gap-2">
                <button
                  onClick={onExport}
                  disabled={isExporting}
                  className="btn btn-light btn-active-light-primary me-2"
                >
                  {isExporting ? (
                    <>
                      <span className="spinner-border spinner-border-sm align-middle me-2"></span>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <KTIcon iconName="download" className="fs-2 me-2" />
                      Download PNG
                    </>
                  )}
                </button>
                <button
                  onClick={onSendEmail}
                  disabled={isSendingEmail}
                  className="btn btn-primary"
                >
                  {isSendingEmail ? (
                    <>
                      <span className="spinner-border spinner-border-sm align-middle me-2"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <KTIcon iconName="email" className="fs-2 me-2" />
                      Send to Employee
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payslip Card */}
      <div className="col-12">
        <div ref={payslipRef} className={`card ${isExporting ? 'export-mode' : ''}`}>
          <div className="card-header">
            <h3 className="card-title align-items-start flex-column">
              <span className="card-label fw-bold text-gray-800">Salary Slip</span>
              <span className="text-gray-400 mt-1 fw-semibold fs-6">
                {getMonthName(salary.month)} {salary.year}
              </span>
            </h3>
            <div className="card-toolbar">
              <span className={`badge badge-light-${getStatusColor(salary.status)}`}>
                {salary.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="card-body p-9">
            {/* Employee Information */}
            <div className="row mb-10">
              <div className="col-12">
                <div className="card card-bordered">
                  <div className="card-header">
                    <h4 className="card-title text-gray-800 fw-bold">ຂໍ້ມູນພື້ນພະນັກງານ</h4>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <div className="fw-bold text-gray-600 fs-6">Name:</div>
                        <div className="fw-bold fs-5 text-gray-800">{userName}</div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <div className="fw-bold text-gray-600 fs-6">Email:</div>
                        <div className="fw-bold fs-5 text-gray-800">{userEmail}</div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <div className="fw-bold text-gray-600 fs-6">ເງິນເດືອນພື້ນຖານ:</div>
                        <div className="fw-bold fs-5 text-primary">{formatCurrency(salary.base_salary)}</div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <div className="fw-bold text-gray-600 fs-6">ມື້ເຮັດວຽກ:</div>
                        <div className="fw-bold fs-5 text-gray-800">{salary.working_days || 0} ມື້</div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <div className="fw-bold text-gray-600 fs-6">Department:</div>
                        <div className="fw-bold fs-5 text-gray-800">
                          {salary.user_id.department_id?.name || 'N/A'}
                        </div>
                      </div>
                      <div className="col-md-4 mb-3">
                        <div className="fw-bold text-gray-600 fs-6">Position:</div>
                        <div className="fw-bold fs-5 text-gray-800">
                          {salary.user_id.position_id?.name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Salary Details Table */}
            <div className="table-responsive mb-10">
              <table className="table table-row-bordered table-row-dashed gy-4">
                <thead>
                  <tr className="fw-bold fs-6 text-gray-800 bg-light-success">
                    <th className="min-w-150px">ລາຍຮັບ</th>
                    <th className="min-w-150px">ລາຍຮັບເພີ່ມເຕີມ</th>
                    <th className="min-w-100px">ຈຳນວນເງິນ</th>
                    <th className="min-w-150px">ລາຍການຫັກ</th>
                    <th className="min-w-100px">ຈຳນວນເງິນ</th>
                    <th className="min-w-100px">ວັນທີຈ່າຍ</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Base Salary Row */}
                  <tr>
                    <td className="fw-bold">ເງິນເດືອນພື້ນຖານ</td>
                    <td className="text-center text-gray-400">-</td>
                    <td className="fw-bold text-gray-800">{formatCurrency(salary.base_salary)}</td>
                    <td>
                      ມື້ຂາດວຽກ{' '}
                      {(salary.cut_off_pay_days || 0) > 0 && (
                        <>
                          ({salary.cut_off_pay_days} ມື້
                          {' × '}
                          {(salary.cut_off_pay_amount || 0).toLocaleString()}
                          /ມື້)
                        </>
                      )}
                    </td>
                    <td className="text-danger">{formatCurrency(cutOffTotal)}</td>
                    <td rowSpan={7} className="fw-bold text-center">
                      {formatDate(salary.payment_date)}
                    </td>
                  </tr>

                  {/* Additional Income Rows */}
                  {[
                    { label: 'ຄ່ານ້ຳມັນ', value: salary.fuel_costs },
                    { label: 'ຄ່າຄອມມິດຊັນ', value: salary.commission },
                    { label: 'ຄ່າລ່ວງເວລາ (OT)', value: salary.ot_amount },
                    { label: 'ເງິນໂບນັດ', value: salary.bonus },
                    { label: 'ຄ່າເຮັດວຽກມື້ພັກ', value: salary.money_not_spent_on_holidays || 0 },
                    { label: 'ຄ່າໃຊ້ຈ່າຍຫ້ອງການ', value: salary.office_expenses || 0 },
                    { label: 'ອື່ນໆ', value: salary.other_income || 0 },
                  ].map((item, index) => (
                    <tr key={index}>
                      {index === 0 && (
                        <td rowSpan={7} className="fw-bold bg-light-gray">
                          ລາຍໄດ້ອື່ນໆ
                        </td>
                      )}
                      <td>{item.label}</td>
                      <td>{formatCurrency(item.value)}</td>
                      {index === 0 && (
                        <td rowSpan={2}>ປະກັນສັງຄົມ</td>
                      )}
                      {index === 0 && (
                        <td rowSpan={2} className="text-danger">
                          {formatCurrency(salary.social_security || 0)}
                        </td>
                      )}
                      {index >= 2 && <td colSpan={2}></td>}
                    </tr>
                  ))}

                  {/* Totals Row */}
                  <tr className="bg-light-primary fw-bold">
                    <td colSpan={2} className="text-end">
                      ລວມລາຍຮັບທັງໝົດ:
                    </td>
                    <td>{formatCurrency(totalIncome)}</td>
                    <td className="text-end">ລວມລາຍການຫັກ:</td>
                    <td className="text-danger">{formatCurrency(totalDeductions)}</td>
                    <td></td>
                  </tr>

                  {/* Net Salary Row */}
                  <tr className="bg-success text-white fw-bold">
                    <td colSpan={4} className="text-center fs-4">
                      ເງິນເດືອນສຸດທິ (NET SALARY)
                    </td>
                    <td colSpan={2} className="text-center fs-3">
                      {formatCurrency(salary.net_salary)} ກີບ
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Additional Information */}
            <div className="row">
              <div className="col-12">
                <div className="card card-bordered">
                  <div className="card-header">
                    <h4 className="card-title text-gray-800 fw-bold">ຂໍ້ມູນເພີ່ມເຕີມ</h4>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <div className="fw-bold text-gray-600 fs-6">ມື້ເຮັດວຽກ:</div>
                        <div className="fw-bold fs-5 text-gray-800">{salary.working_days || 0} ມື້</div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <div className="fw-bold text-gray-600 fs-6">ວັນພັກທີ່ເຫຼືອ:</div>
                        <div className="fw-bold fs-5 text-gray-800">{salary.remaining_vacation_days || 0} ມື້</div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <div className="fw-bold text-gray-600 fs-6">OT Hours:</div>
                        <div className="fw-bold fs-5 text-gray-800">{salary.ot_hours || 0} ຊົ່ວໂມງ</div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <div className="fw-bold text-gray-600 fs-6">ມື້ພັກ:</div>
                        <div className="fw-bold fs-5 text-gray-800">{salary.day_off_days || 0} ມື້</div>
                      </div>
                    </div>
                    
                    {salary.notes && (
                      <div className="mt-6">
                        <div className="fw-bold text-gray-600 fs-6 mb-2">Notes:</div>
                        <div className="bg-light rounded p-4">
                          <p className="mb-0 text-gray-700">{salary.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Created Information */}
                    <div className="separator separator-dashed my-6"></div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="fw-bold text-gray-600 fs-6">Created By:</div>
                        <div className="fw-bold text-gray-800">
                          {salary.created_by.first_name_en} {salary.created_by.last_name_en}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="fw-bold text-gray-600 fs-6">Created At:</div>
                        <div className="fw-bold text-gray-800">{formatDate(salary.created_at)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="row mt-10 g-5">
              {/* Income Summary */}
              <div className="col-md-6">
                <div className="card card-flush h-md-100">
                  <div className="card-header">
                    <h3 className="card-title text-gray-800 fw-bold">Income Summary</h3>
                  </div>
                  <div className="card-body pt-1">
                    <div className="d-flex flex-column justify-content-between h-100">
                      {[
                        { label: 'Base Salary', value: salary.base_salary, color: 'primary' },
                        { label: 'Overtime', value: salary.ot_amount, color: 'warning' },
                        { label: 'Bonus', value: salary.bonus, color: 'success' },
                        { label: 'Commission', value: salary.commission, color: 'info' },
                        { label: 'Fuel Costs', value: salary.fuel_costs, color: 'danger' },
                      ].map((item, index) => (
                        <div key={index} className="d-flex align-items-center mb-6">
                          <div className="symbol symbol-40px me-4">
                            <div className={`symbol-label bg-light-${item.color}`}>
                              <KTIcon iconName="dollar" className={`fs-2 text-${item.color}`} />
                            </div>
                          </div>
                          <div className="d-flex flex-column flex-grow-1">
                            <span className="text-gray-800 fw-semibold fs-6">{item.label}</span>
                            <span className="text-gray-400 fw-semibold fs-7">{formatCurrency(item.value)}</span>
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-top border-gray-300 pt-4 mt-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-gray-800 fw-bold fs-5">Total Income</span>
                          <span className="text-success fw-bold fs-3">{formatCurrency(totalIncome)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions Summary */}
              <div className="col-md-6">
                <div className="card card-flush h-md-100">
                  <div className="card-header">
                    <h3 className="card-title text-gray-800 fw-bold">Deductions Summary</h3>
                  </div>
                  <div className="card-body pt-1">
                    <div className="d-flex flex-column justify-content-between h-100">
                      {[
                        { label: 'Office Expenses', value: salary.office_expenses || 0, color: 'danger' },
                        { label: 'Social Security', value: salary.social_security || 0, color: 'warning' },
                        ...((salary.cut_off_pay_days || 0) > 0 ? [
                          { label: 'Absence Deduction', value: cutOffTotal, color: 'danger' }
                        ] : []),
                      ].map((item, index) => (
                        <div key={index} className="d-flex align-items-center mb-6">
                          <div className="symbol symbol-40px me-4">
                            <div className={`symbol-label bg-light-${item.color}`}>
                              <KTIcon iconName="minus-circle" className={`fs-2 text-${item.color}`} />
                            </div>
                          </div>
                          <div className="d-flex flex-column flex-grow-1">
                            <span className="text-gray-800 fw-semibold fs-6">{item.label}</span>
                            <span className="text-danger fw-semibold fs-7">{formatCurrency(item.value)}</span>
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-top border-gray-300 pt-4 mt-4">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-gray-800 fw-bold fs-5">Total Deductions</span>
                          <span className="text-danger fw-bold fs-3">{formatCurrency(totalDeductions)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Card Footer */}
          <div className="card-footer py-4">
            <div className="text-center text-gray-500 fs-7">
              <p className="mb-0">
                Generated on {new Date().toLocaleDateString()} • This is an official salary statement
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Mode CSS */}
      <style>{`
        .export-mode,
        .export-mode * {
          color: rgb(17, 24, 39) !important;
        }

        .export-mode .text-white {
          color: rgb(255, 255, 255) !important;
        }

        .export-mode .text-danger {
          color: rgb(220, 38, 38) !important;
        }

        .export-mode .text-success {
          color: rgb(22, 163, 74) !important;
        }

        .export-mode .text-primary {
          color: rgb(37, 99, 235) !important;
        }

        .export-mode .bg-light {
          background-color: rgb(243, 244, 246) !important;
        }

        .export-mode .bg-success {
          background-color: rgb(22, 163, 74) !important;
        }

        .export-mode .bg-light-success {
          background-color: rgb(220, 252, 231) !important;
        }

        .export-mode .bg-light-primary {
          background-color: rgb(219, 234, 254) !important;
        }

        .export-mode .bg-light-gray {
          background-color: rgb(249, 250, 251) !important;
        }
      `}</style>
    </div>
  )
}

export { SalaryDetailsComponent }