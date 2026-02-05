import { FC, useEffect, useState, useMemo } from 'react'
import * as Yup from 'yup'
import { useFormik } from 'formik'
import clsx from 'clsx'
import axios from 'axios'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import { useListView } from '../core/ListViewProvider'

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
  employee_type: string
  start_date: string
  end_date: string
  half_day_date: string
  date_off_number: number
  half_day_period?: string
  reason?: string
}

/* -------------------- Date Utility Functions -------------------- */
const getCurrentMonthRange = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // First day of current month
  const firstDay = new Date(currentYear, currentMonth, 1);

  // Last day of current month (for reference, not for selection)
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  // Format for min/max attributes
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return {
    firstDay: formatDate(firstDay),
    lastDay: formatDate(lastDay),
    today: formatDate(now),
  };
};

const isLastDayOfMonth = (dateString: string): boolean => {
  const date = new Date(dateString);
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  return nextDay.getMonth() !== date.getMonth();
};

const isInCurrentMonth = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();

  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth();
};

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

  /* -------------------- Date Restrictions -------------------- */
  const currentMonthRange = useMemo(() => getCurrentMonthRange(), []);

  // Custom validation for date restrictions
  const validateDateRestrictions = (dateString: string, fieldName: string): string => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Check if date is in current month
    if (!isInCurrentMonth(dateString)) {
      return `Please select a date from the current month only. Dates from last month or next month are not allowed.`;
    }

    // Check if date is the last day of the month
    if (isLastDayOfMonth(dateString)) {
      return 'Last day of the month cannot be selected.';
    }

    return '';
  };

  // Date filter function for input onChange
  const filterDateInput = (dateString: string): string => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();

    // Reset time for comparison
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    // Check if date is in current month
    const isCurrentMonth = date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth();

    // Check if it's the last day of month
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    const isLastDay = nextDay.getMonth() !== date.getMonth();

    if (!isCurrentMonth || isLastDay) {
      return '';
    }

    return dateString;
  };

  // Add this validation before submitting
  const validateDateRange = (): boolean => {
    if (formik.values.employee_type === 'FULL_DAY') {
      const start = new Date(formik.values.start_date);
      const end = new Date(formik.values.end_date);

      // Check if dates are selected
      if (!formik.values.start_date || !formik.values.end_date) {
        return true; // Let formik validation handle empty fields
      }

      if (end < start) {
        toast.error('End date cannot be before start date');
        return false;
      }

      // Optional: Limit maximum days
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays > 30) {
        toast.error('Maximum 30 days allowed for continuous leave');
        return false;
      }

      // Check if the range includes weekends (optional)
      const weekendDays = calculateWeekendDays(start, end);
      if (weekendDays > 0) {
        toast.info(`Note: Your request includes ${weekendDays} weekend day(s)`);
      }
    }

    return true;
  }

  // Optional helper function for weekend calculation
  const calculateWeekendDays = (start: Date, end: Date): number => {
    let weekendCount = 0;
    const current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      if (day === 0 || day === 6) {
        weekendCount++;
      }
      current.setDate(current.getDate() + 1);
    }

    return weekendCount;
  }

  const setHalfDayTime = (date: Date, period: string, timeType: 'start' | 'end'): Date => {
    const newDate = new Date(date);

    if (period === 'morning') {
      if (timeType === 'start') {
        newDate.setHours(8, 30, 0, 0);
      } else {
        newDate.setHours(12, 0, 0, 0);
      }
    } else {
      if (timeType === 'start') {
        newDate.setHours(13, 30, 0, 0);
      } else {
        newDate.setHours(17, 0, 0, 0);
      }
    }

    return newDate;
  }

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
      half_day_date: '',
      date_off_number: 0,
      half_day_period: '',
      reason: '',
    },
    validationSchema: leaveSchema,

    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true)

      // Validate date range first
      if (!validateDateRange()) {
        setIsSubmitting(false);
        return;
      }

      // Validate date restrictions
      if (values.employee_type === 'FULL_DAY') {
        const startDateError = validateDateRestrictions(values.start_date, 'start_date');
        const endDateError = validateDateRestrictions(values.end_date, 'end_date');

        if (startDateError) {
          toast.error(`Start date: ${startDateError}`);
          setIsSubmitting(false);
          return;
        }

        if (endDateError) {
          toast.error(`End date: ${endDateError}`);
          setIsSubmitting(false);
          return;
        }
      } else if (values.employee_type === 'HALF_DAY') {
        const halfDayError = validateDateRestrictions(values.half_day_date, 'half_day_date');
        if (halfDayError) {
          toast.error(`Half day date: ${halfDayError}`);
          setIsSubmitting(false);
          return;
        }
      }

      try {
        // First check if there's an existing day off request
        const conflictResult = await checkExistingDayOff(
          values.employee_id,
          values.employee_type === 'HALF_DAY' ? values.half_day_date : values.start_date,
          values.employee_type === 'FULL_DAY' ? values.end_date : undefined,
          values.employee_type
        );

        if (conflictResult.hasConflict) {
          let conflictMessage = '';
          if (conflictResult.conflicts && conflictResult.conflicts.length > 0) {
            const conflict = conflictResult.conflicts[0];
            if (values.employee_type === 'HALF_DAY') {
              conflictMessage = `You already have a ${conflict.day_off_type === 'HALF_DAY' ? 'half day' : 'day off'} request for ${new Date(conflict.start_date).toLocaleDateString()}.`;
            } else {
              conflictMessage = `You already have a day off request from ${new Date(conflict.start_date).toLocaleDateString()} to ${new Date(conflict.end_date).toLocaleDateString()}.`;
            }
          } else {
            conflictMessage = values.employee_type === 'HALF_DAY'
              ? `You already have a day off request for ${new Date(values.half_day_date).toLocaleDateString()}. Please select a different date.`
              : `You already have a day off request that overlaps with the selected period (${new Date(values.start_date).toLocaleDateString()} to ${new Date(values.end_date).toLocaleDateString()}).`;
          }

          await Swal.fire({
            icon: 'warning',
            title: 'Duplicate Request',
            html: conflictMessage,
            confirmButtonText: 'OK'
          });
          setIsSubmitting(false);
          return;
        }

        // Prepare payload
        const payload = {
          user_id: values.employee_id,
          employee_id: values.employee_id,
          supervisor_id: values.supervisor_id,
          day_off_type: values.employee_type,
          start_date_time: values.employee_type === 'HALF_DAY'
            ? setHalfDayTime(new Date(values.half_day_date), values.half_day_period || 'morning', 'start')
            : new Date(values.start_date),
          end_date_time: values.employee_type === 'HALF_DAY'
            ? setHalfDayTime(new Date(values.half_day_date), values.half_day_period || 'morning', 'end')
            : new Date(values.end_date),
          date_off_number: values.date_off_number,
          title: values.reason || 'Day off request',
          status: 'Pending',
        }

        const response = await axios.post(`${API_URL}/dayoff-request`, payload);

        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Day off request submitted successfully',
          timer: 2000,
          showConfirmButton: false,
        })

        resetForm()
        setItemIdForUpdate(undefined)
      } catch (error: any) {
        console.error('Submit error:', error);

        if (error.response?.status === 409) {
          const conflictDetails = error.response.data?.conflict_details;
          if (conflictDetails) {
            await Swal.fire({
              icon: 'warning',
              title: 'Conflict Detected',
              html: conflictDetails.message || 'This request conflicts with an existing day off.',
              confirmButtonText: 'OK'
            });
          } else {
            toast.error('Duplicate day off request detected');
          }
        } else if (error.response?.status === 400) {
          const message = error.response.data?.message || 'Invalid request data';
          toast.error(message);
        } else if (error.response?.status === 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error('Failed to submit request. Please check your connection.');
        }
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
        if (typeof employee.department_id === 'string') {
          return employee.department_id === formik.values.department_id;
        } else if (Array.isArray(employee.department_id)) {
          return employee.department_id.some(
            dept => (dept._id || dept.id) === formik.values.department_id
          );
        }
        return false;
      });
      setFilteredEmployees(filtered);
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
      if (!formik.values.half_day_period) {
        formik.setFieldValue('half_day_period', 'morning');
      }
      formik.setFieldValue('start_date', '');
      formik.setFieldValue('end_date', '');
    } else {
      formik.setFieldValue('half_day_date', '');
      formik.setFieldValue('half_day_period', '');
    }
  }, [formik.values.employee_type]);

  // Handle date changes with validation
  const handleDateChange = (field: string, value: string) => {
    const filteredValue = filterDateInput(value);

    if (value && !filteredValue) {
      const errorMessage = validateDateRestrictions(value, field);
      if (errorMessage) {
        toast.error(errorMessage);
      }
    }

    formik.setFieldValue(field, filteredValue);
  };

  // Add this effect for background conflict check
  useEffect(() => {
    const validateDates = async () => {
      if (!formik.values.employee_id) return;
      toast.dismiss();

      try {
        if (formik.values.employee_type === 'FULL_DAY' &&
          formik.values.start_date &&
          formik.values.end_date) {

          const result = await checkExistingDayOff(
            formik.values.employee_id,
            formik.values.start_date,
            formik.values.end_date,
            'FULL_DAY'
          );

          if (result.hasConflict && result.conflicts && result.conflicts.length > 0) {
            toast.warning(`Warning: You have ${result.conflicts.length} conflicting day off request(s)`);
          }
        } else if (formik.values.employee_type === 'HALF_DAY' &&
          formik.values.half_day_date) {

          const result = await checkExistingDayOff(
            formik.values.employee_id,
            formik.values.half_day_date,
            undefined,
            'HALF_DAY'
          );

          if (result.hasConflict && result.conflicts && result.conflicts.length > 0) {
            toast.warning(`Warning: You have a day off request on this date`);
          }
        }
      } catch (error) {
        console.debug('Background conflict check failed:', error);
      }
    };

    const timeoutId = setTimeout(validateDates, 800);
    return () => clearTimeout(timeoutId);
  }, [
    formik.values.employee_id,
    formik.values.start_date,
    formik.values.end_date,
    formik.values.half_day_date,
    formik.values.employee_type
  ]);

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
      if (!start_date || !end_date) {
        formik.setFieldValue('date_off_number', 0);
        return;
      }

      const start = new Date(start_date);
      const end = new Date(end_date);

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      formik.setFieldValue('date_off_number', diffDays);
    } else if (employee_type === 'HALF_DAY') {
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

  const checkExistingDayOff = async (
    employeeId: string,
    startDate: string,
    endDate?: string,
    employeeType: string = 'FULL_DAY'
  ): Promise<{ hasConflict: boolean; conflicts?: any[] }> => {
    try {
      const params: any = {
        employee_id: employeeId,
      };

      if (employeeType === 'HALF_DAY') {
        params.date = startDate;
      } else {
        params.start_date = startDate;
        if (endDate) {
          params.end_date = endDate;
        }
      }

      const response = await axios.get(`${API_URL}/dayoff-request/check-conflict`, {
        params
      });

      return {
        hasConflict: response.data.has_conflict || false,
        conflicts: response.data.conflicts || []
      };
    } catch (error) {
      console.error('Error checking existing day off:', error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.warning('Please check your date selection');
        } else if (error.response?.status === 500) {
          toast.warning('Unable to verify existing requests. Please try again.');
        }
      }

      return { hasConflict: false };
    }
  }

  /* -------------------- Render -------------------- */
  return (
    <>
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

            {/* Employee */}
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
                      min={currentMonthRange.firstDay}
                      max={currentMonthRange.lastDay}
                      onChange={(e) => handleDateChange('start_date', e.target.value)}
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
                      min={formik.values.start_date || currentMonthRange.firstDay}
                      max={currentMonthRange.lastDay}
                      onChange={(e) => handleDateChange('end_date', e.target.value)}
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
                <div className="fv-row mb-10">
                  <label className="required fs-6 fw-bold mb-2">Date</label>
                  <input
                    type="date"
                    {...formik.getFieldProps('half_day_date')}
                    className={fieldClass('half_day_date')}
                    disabled={isSubmitting}
                    min={currentMonthRange.firstDay}
                    max={currentMonthRange.lastDay}
                    onChange={(e) => handleDateChange('half_day_date', e.target.value)}
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