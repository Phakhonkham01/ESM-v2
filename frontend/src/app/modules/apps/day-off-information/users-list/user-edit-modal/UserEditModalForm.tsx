import { FC, useEffect, useState } from 'react'
import * as Yup from 'yup'
import { useFormik } from 'formik'
import clsx from 'clsx'
import axios from 'axios'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import {useListView} from '../core/ListViewProvider'

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
  department_id?: string | Department[] // Can be string ID or populated Department array
  user_email?: string
  role?: string
}

interface Supervisor {
  _id?: string
  id?: string
  first_name_en: string
  last_name_en: string
  user_name?: string
  department_id?: string | Department[] // Update this
  user_email?: string
  role?: string
}

interface LeaveFormValues {
  department_id: string
  employee_id: string
  work_period: string
  supervisor_id: string
  leave_type: string
  employee_type: string
  start_date: string
  end_date: string
  half_day_date: string // Added for half day single date
  date_off_number: number // Added for calculating days
  half_day_period?: string
  reason?: string
}

/* -------------------- Validation Schema -------------------- */
const leaveSchema = Yup.object().shape({
  department_id: Yup.string().required('Please select department'),
  employee_id: Yup.string().required('Please select employee'),
  supervisor_id: Yup.string().required('Please select supervisor'),
  employee_type: Yup.string().required('Please select employee type'),
  start_date: Yup.string().when('employee_type', {
    is: 'FULL_DAY',
    then: (schema) => schema.required('Please select start date'),
    otherwise: (schema) => schema.notRequired(),
  }),
  end_date: Yup.string().when('employee_type', {
    is: 'FULL_DAY',
    then: (schema) => schema.required('Please select end date'),
    otherwise: (schema) => schema.notRequired(),
  }),
  half_day_date: Yup.string().when('employee_type', {
    is: 'HALF_DAY',
    then: (schema) => schema.required('Please select date for half day'),
    otherwise: (schema) => schema.notRequired(),
  }),
  date_off_number: Yup.number().min(0.5, 'Date off must be at least 0.5 days'),
  half_day_period: Yup.string().when('employee_type', {
    is: 'HALF_DAY',
    then: (schema) => schema.required('Please select time period'),
    otherwise: (schema) => schema.notRequired(),
  }),
})

/* -------------------- Component -------------------- */
export const UserEditModalForm: FC = () => {
  const API_URL = import.meta.env.VITE_APP_API_URL

  /* -------------------- State -------------------- */
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [loadingSupervisors, setLoadingSupervisors] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setItemIdForUpdate } = useListView()


  /* -------------------- Formik -------------------- */
  const formik = useFormik<LeaveFormValues>({
    initialValues: {
      department_id: '',
      employee_id: '',
      work_period: '',
      supervisor_id: '',
      leave_type: '',
      employee_type: 'FULL_DAY',
      start_date: '',
      end_date: '',
      half_day_date: '', // Initialize half day date
      date_off_number: 0, // Initialize with 0
      half_day_period: '',
      reason: '',
    },
    validationSchema: leaveSchema,

    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true)

      try {
        const payload = {
          user_id: values.employee_id, // or logged-in user id
          employee_id: values.employee_id,
          supervisor_id: values.supervisor_id,

          day_off_type: values.employee_type, // FULL_DAY | HALF_DAY

          start_date_time:
            values.employee_type === 'HALF_DAY'
              ? new Date(values.half_day_date)
              : new Date(values.start_date),

          end_date_time:
            values.employee_type === 'HALF_DAY'
              ? new Date(values.half_day_date)
              : new Date(values.end_date),

          date_off_number: values.date_off_number,

          title: values.reason || 'Day off request',

          status: 'Pending',
        }

        await axios.post(`${API_URL}/dayoff-request`, payload)

        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Day off request submitted',
          timer: 2000,
          showConfirmButton: false,
        })

        resetForm()
        setItemIdForUpdate(undefined)
      } catch (error) {
        console.error(error)
        toast.error('Failed to submit request')
      } finally {
        setIsSubmitting(false)
      }
    }
  })

  /* -------------------- Effects -------------------- */
  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
    fetchSupervisors();
  }, []);

  // Filter employees when department changes
  useEffect(() => {
    if (formik.values.department_id) {
      const filtered = employees.filter(employee => {
        // Handle both string ID and array of departments
        if (typeof employee.department_id === 'string') {
          return employee.department_id === formik.values.department_id;
        } else if (Array.isArray(employee.department_id)) {
          // Check if any department in the array matches the selected department
          return employee.department_id.some(
            dept => (dept._id || dept.id) === formik.values.department_id
          );
        }
        return false;
      });
      setFilteredEmployees(filtered);

      // Reset employee selection when department changes
      formik.setFieldValue('employee_id', '');
    } else {
      setFilteredEmployees([]);
      formik.setFieldValue('employee_id', '');
    }
  }, [formik.values.department_id, employees]);

  // Calculate date off number when dates or employee_type changes
  useEffect(() => {
    calculateDateOffNumber();
  }, [
    formik.values.start_date,
    formik.values.end_date,
    formik.values.half_day_date,
    formik.values.employee_type,
    formik.values.half_day_period
  ]);

  // Set default half day period when employee type changes
  useEffect(() => {
    if (formik.values.employee_type === 'HALF_DAY') {
      // Set default half day period if not set
      if (!formik.values.half_day_period) {
        formik.setFieldValue('half_day_period', 'morning');
      }
      // Clear full day dates
      formik.setFieldValue('start_date', '');
      formik.setFieldValue('end_date', '');
    } else {
      // Clear half day date when switching to full day
      formik.setFieldValue('half_day_date', '');
      formik.setFieldValue('half_day_period', '');
    }
  }, [formik.values.employee_type]);

  /* -------------------- API Functions -------------------- */
  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const res = await axios.get<{ data: Department[] }>(`${API_URL}/departments`);
      setDepartments(res.data.data || []);
    } catch (err) {
      console.error('Error fetching departments', err);
      toast.error('Unable to load departments');
    } finally {
      setLoadingDepartments(false);
    }
  }

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await axios.get<Employee[]>(`${API_URL}/users?role=employee`);
      setEmployees(res.data || []);
    } catch (err: any) {
      toast.error('Unable to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  }

  const fetchSupervisors = async () => {
    setLoadingSupervisors(true);
    try {
      const res = await axios.get(`${API_URL}/users?role=supervisor`);
      const supervisorsArray = res.data || [];
      setSupervisors(supervisorsArray);
    } catch (err: any) {
      toast.error('Unable to load supervisors');
    } finally {
      setLoadingSupervisors(false);
    }
  }

  /* -------------------- Helper Functions -------------------- */
  const calculateDateOffNumber = () => {
    const { employee_type, half_day_date, start_date, end_date } = formik.values;

    if (employee_type === 'FULL_DAY') {
      // Full day calculation
      if (!start_date || !end_date) {
        formik.setFieldValue('date_off_number', 0);
        return;
      }

      const start = new Date(start_date);
      const end = new Date(end_date);

      // Calculate difference in days
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both dates

      formik.setFieldValue('date_off_number', diffDays);
    } else if (employee_type === 'HALF_DAY') {
      // Half day is always 0.5 days
      formik.setFieldValue('date_off_number', half_day_date ? 0.5 : 0);
    }
  }

  const getEmployeeName = (employee: Employee) => {
    if (employee.user_name) {
      return `${employee.user_name}`;
    }
    return `${employee.first_name_en} ${employee.last_name_en}`;
  }

  const getEmployeeDepartment = (employee: Employee) => {
    if (Array.isArray(employee.department_id) && employee.department_id.length > 0) {
      const firstDepartment = employee.department_id[0];
      return firstDepartment.department_name || 'Unknown Dept';
    }
    return 'Unknown Dept';
  }

  const getSupervisorName = (supervisor: Supervisor) => {
    return supervisor.user_name || `${supervisor.first_name_en} ${supervisor.last_name_en}`;
  }

  const getSupervisorDepartment = (supervisor: Supervisor) => {
    if (Array.isArray(supervisor.department_id) && supervisor.department_id.length > 0) {
      const firstDepartment = supervisor.department_id[0];
      return firstDepartment.department_name || 'Unknown Dept';
    }
    return 'Unknown Dept';
  }

  const fieldClass = (fieldName: keyof LeaveFormValues) =>
    clsx('form-control form-control-solid', {
      'is-invalid': formik.touched[fieldName] && formik.errors[fieldName],
    });

  /* -------------------- Render -------------------- */
  return (
    <>
      <form className="form" onSubmit={formik.handleSubmit} noValidate>
        {/* Card Layout - Metronic Style */}
        <div>
          <div className="card-body">
            {/* Department */}
            <div className="fv-row mb-10">
              <label className="required fs-6 fw-bold mb-2">Department</label>
              <div className="d-flex align-items-center gap-3">
                <select
                  {...formik.getFieldProps('department_id')}
                  className={clsx('form-select form-select-solid', {
                    'is-invalid': formik.touched.department_id && formik.errors.department_id,
                  })}
                  disabled={loadingDepartments || isSubmitting}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id || dept.id} value={dept._id || dept.id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>

                {loadingDepartments && (
                  <span className="spinner-border spinner-border-sm text-primary"></span>
                )}
              </div>
              {formik.touched.department_id && formik.errors.department_id && (
                <div className="fv-plugins-message-container">
                  <div className="fv-help-block text-danger">
                    {formik.errors.department_id}
                  </div>
                </div>
              )}
            </div>

            {/* Employee (filtered by department) */}
            <div className="fv-row mb-10">
              <label className="required fs-6 fw-bold mb-2">Employee</label>
              <div className="d-flex align-items-center gap-3">
                <select
                  {...formik.getFieldProps('employee_id')}
                  className={clsx('form-select form-select-solid', {
                    'is-invalid': formik.touched.employee_id && formik.errors.employee_id,
                  })}
                  disabled={!formik.values.department_id || loadingEmployees || isSubmitting}
                >
                  <option value="">Select Employee</option>
                  {filteredEmployees.map((employee) => (
                    <option key={employee._id || employee.id} value={employee._id || employee.id}>
                      {getEmployeeName(employee)} - {getEmployeeDepartment(employee)}
                    </option>
                  ))}
                </select>
                {loadingEmployees && (
                  <span className="spinner-border spinner-border-sm text-primary"></span>
                )}
              </div>
              {formik.touched.employee_id && formik.errors.employee_id && (
                <div className="fv-plugins-message-container">
                  <div className="fv-help-block text-danger">
                    {formik.errors.employee_id}
                  </div>
                </div>
              )}
              {formik.values.department_id && filteredEmployees.length === 0 && !loadingEmployees && (
                <div className="mt-2 text-muted">
                  No employees found in this department
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
                    'is-invalid': formik.touched.supervisor_id && formik.errors.supervisor_id,
                  })}
                  disabled={loadingSupervisors || isSubmitting}
                >
                  <option value="">Select Supervisor</option>
                  {supervisors.map((sup) => (
                    <option key={sup._id || sup.id} value={sup._id || sup.id}>
                      {getSupervisorName(sup)} ({getSupervisorDepartment(sup)})
                    </option>
                  ))}
                </select>
              </div>

              {formik.touched.supervisor_id && formik.errors.supervisor_id && (
                <div className="fv-plugins-message-container">
                  <div className="fv-help-block text-danger">
                    {formik.errors.supervisor_id}
                  </div>
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
                      name="employee_type"
                      id={`type-${type}`}
                      value={type}
                      checked={formik.values.employee_type === type}
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
            {formik.values.employee_type === 'FULL_DAY' && (
              <div className="fv-row mb-10">
                <div className="row g-6">
                  <div className="col-md-6">
                    <label className="required fs-6 fw-bold mb-2">Start Date</label>
                    <input
                      type="date"
                      {...formik.getFieldProps('start_date')}
                      className={fieldClass('start_date')}
                      disabled={isSubmitting}
                    />
                    {formik.touched.start_date && formik.errors.start_date && (
                      <div className="fv-plugins-message-container">
                        <div className="fv-help-block text-danger">
                          {formik.errors.start_date}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="required fs-6 fw-bold mb-2">End Date</label>
                    <input
                      type="date"
                      {...formik.getFieldProps('end_date')}
                      className={fieldClass('end_date')}
                      disabled={isSubmitting}
                      min={formik.values.start_date}
                    />
                    {formik.touched.end_date && formik.errors.end_date && (
                      <div className="fv-plugins-message-container">
                        <div className="fv-help-block text-danger">
                          {formik.errors.end_date}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Half Day: Single Date and Period */}
            {formik.values.employee_type === 'HALF_DAY' && (
              <>
                {/* Single Date for Half Day */}
                <div className="fv-row mb-10">
                  <label className="required fs-6 fw-bold mb-2">Date</label>
                  <input
                    type="date"
                    {...formik.getFieldProps('half_day_date')}
                    className={fieldClass('half_day_date')}
                    disabled={isSubmitting}
                  />
                  {formik.touched.half_day_date && formik.errors.half_day_date && (
                    <div className="fv-plugins-message-container">
                      <div className="fv-help-block text-danger">
                        {formik.errors.half_day_date}
                      </div>
                    </div>
                  )}
                </div>

                {/* Half Day Period */}
                <div className="fv-row mb-10">
                  <label className="required fs-6 fw-bold mb-2">Time Period</label>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <select
                        {...formik.getFieldProps('half_day_period')}
                        className={clsx('form-select form-select-solid', {
                          'is-invalid': formik.touched.half_day_period && formik.errors.half_day_period,
                        })}
                        disabled={isSubmitting}
                      >
                        <option value="morning">Morning (08:30 - 12:00)</option>
                        <option value="afternoon">Afternoon (13:30 - 17:00)</option>
                      </select>
                      {formik.touched.half_day_period && formik.errors.half_day_period && (
                        <div className="fv-plugins-message-container">
                          <div className="fv-help-block text-danger">
                            {formik.errors.half_day_period}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <div className="form-control form-control-solid bg-light">
                        {formik.values.half_day_period === 'morning'
                          ? '08:30 - 12:00'
                          : '13:30 - 17:00'}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Date off Number (Calculated) */}
            <div className="fv-row mb-10">
              <label className="required fs-6 fw-bold mb-2">Date Off Number</label>
              <div className="input-group">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  {...formik.getFieldProps('date_off_number')}
                  className={clsx('form-control form-control-solid', {
                    'is-invalid': formik.touched.date_off_number && formik.errors.date_off_number,
                  })}
                  disabled
                  readOnly
                />
                <span className="input-group-text bg-light">days</span>
              </div>
              <div className="mt-2">
                <small className="text-muted">
                  {formik.values.employee_type === 'FULL_DAY'
                    ? 'Each day counts as 1 full day'
                    : 'Half day counts as 0.5 day'}
                </small>
              </div>
              {formik.touched.date_off_number && formik.errors.date_off_number && (
                <div className="fv-plugins-message-container">
                  <div className="fv-help-block text-danger">
                    {formik.errors.date_off_number}
                  </div>
                </div>
              )}
            </div>

            {/* Reason (Optional) */}
            <div className="fv-row mb-10">
              <label className="fs-6 fw-bold mb-2">Reason (Optional)</label>
              <textarea
                {...formik.getFieldProps('reason')}
                className="form-control form-control-solid"
                rows={3}
                placeholder="Enter reason for leave (optional)"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Card Footer with Actions */}
          <div className="card-footer d-flex justify-content-end py-6 px-9">
            <button
              type="button"
              className="btn btn-light me-3"
              onClick={() => setItemIdForUpdate(undefined)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !formik.isValid}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm align-middle me-2"></span>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
      )}
    </>
  )
}

export default UserEditModalForm