import { FC, useEffect, useState, useMemo } from 'react'
import * as Yup from 'yup'
import { useFormik } from 'formik'
import clsx from 'clsx'
import axios from 'axios'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import { useListView } from '../core/ListViewProvider'
import { DayOffRequestDTO } from '../core/_models'
import { createDayOffRequest, getDayOffRequestById, updateDayOffRequest } from '../core/_requests'

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
  supervisor_id: string
  day_off_type: 'FULL_DAY' | 'HALF_DAY'
  start_date: string
  end_date: string
  half_day_date: string
  date_off_number: number
  half_day_period?: 'morning' | 'afternoon'
  reason?: string
}

/* -------------------- Date Utility Functions -------------------- */
const getCurrentMonthRange = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // First day of current month
  const firstDay = new Date(currentYear, currentMonth, 1);

  // Last day of current month
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

/* -------------------- Component -------------------- */
export const DayOffRequestEditModalForm: FC = () => {
  const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8001/api'

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
  const { itemIdForUpdate, setItemIdForUpdate } = useListView()

  /* -------------------- Date Restrictions -------------------- */
  const currentMonthRange = useMemo(() => getCurrentMonthRange(), []);

  // Validate date restrictions
  const validateDateRestrictions = (dateString: string, fieldName: string): string => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();

    // Check if date is in current month
    if (!isInCurrentMonth(dateString)) {
      return `Please select a date from the current month only.`;
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

  // Validate date range
  const validateDateRange = (): boolean => {
    if (formik.values.day_off_type === 'FULL_DAY') {
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
    }

    return true;
  }

  const setHalfDayTime = (date: Date, period: 'morning' | 'afternoon', timeType: 'start' | 'end'): Date => {
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

  // Format date for date input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  // With this updated version:
  const getHalfDayPeriodFromTime = (startTime: string | Date): 'morning' | 'afternoon' => {
    const date = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const hours = date.getHours();

    if (hours === 8 || hours === 9 || hours === 10 || hours === 11) {
      return 'morning';
    } else {
      return 'afternoon';
    }
  }

  /* -------------------- Formik -------------------- */
  const formik = useFormik<LeaveFormValues>({
    initialValues: {
      department_id: '',
      employee_id: '',
      supervisor_id: '',
      day_off_type: 'FULL_DAY',
      start_date: '',
      end_date: '',
      half_day_date: '',
      date_off_number: 0,
      half_day_period: undefined,
      reason: '',
    },
    validationSchema: leaveSchema,

    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true)

      try {
        // Validate basic requirements first
        if (!values.employee_id) {
          toast.error('Please select an employee');
          setIsSubmitting(false);
          return;
        }

        if (!values.supervisor_id) {
          toast.error('Please select a supervisor');
          setIsSubmitting(false);
          return;
        }

        // Validate date range first
        if (!validateDateRange()) {
          setIsSubmitting(false);
          return;
        }

        // Validate date restrictions
        if (values.day_off_type === 'FULL_DAY') {
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

          // Validate dates are selected
          if (!values.start_date || !values.end_date) {
            toast.error('Please select both start and end dates');
            setIsSubmitting(false);
            return;
          }
        } else if (values.day_off_type === 'HALF_DAY') {
          if (!values.half_day_date) {
            toast.error('Please select a date for half day');
            setIsSubmitting(false);
            return;
          }

          const halfDayError = validateDateRestrictions(values.half_day_date, 'half_day_date');
          if (halfDayError) {
            toast.error(`Half day date: ${halfDayError}`);
            setIsSubmitting(false);
            return;
          }

          if (!values.half_day_period) {
            toast.error('Please select time period for half day');
            setIsSubmitting(false);
            return;
          }
        }

        // Check for existing day off requests (only for create mode)
        if (!isEditMode) {
          const conflictResult = await checkExistingDayOff(
            values.employee_id,
            values.day_off_type === 'HALF_DAY' ? values.half_day_date : values.start_date,
            values.day_off_type === 'FULL_DAY' ? values.end_date : undefined,
            values.day_off_type
          );

          if (conflictResult.hasConflict) {
            let conflictMessage = '';

            if (conflictResult.conflicts && conflictResult.conflicts.length > 0) {
              const conflict = conflictResult.conflicts[0];

              if (values.day_off_type === 'HALF_DAY') {
                const conflictDate = new Date(conflict.start_date_time).toLocaleDateString();
                const conflictType = conflict.day_off_type === 'HALF_DAY' ? 'half day' : 'full day';
                conflictMessage = `You already have a ${conflictType} request on ${conflictDate}`;
              } else {
                const startDate = new Date(conflict.start_date_time).toLocaleDateString();
                const endDate = new Date(conflict.end_date_time).toLocaleDateString();
                conflictMessage = `You already have a day off request from ${startDate} to ${endDate}`;
              }
            } else {
              conflictMessage = values.day_off_type === 'HALF_DAY'
                ? `You already have a day off request for ${new Date(values.half_day_date).toLocaleDateString()}`
                : `You already have a day off request that overlaps with the selected period`;
            }

            await Swal.fire({
              icon: 'warning',
              title: 'Duplicate Request',
              html: `
            <div class="text-start">
              <p>${conflictMessage}</p>
              <p class="text-muted mt-2">Please select different dates.</p>
            </div>
          `,
              confirmButtonText: 'OK',
              confirmButtonColor: '#3085d6',
            });

            setIsSubmitting(false);
            return;
          }
        }

        // Prepare DTO
        const dayOffRequestDTO: DayOffRequestDTO = {
          user_id: values.employee_id,
          employee_id: values.employee_id,
          supervisor_id: values.supervisor_id,
          day_off_type: values.day_off_type,
          start_date_time: values.day_off_type === 'HALF_DAY'
            ? setHalfDayTime(new Date(values.half_day_date), values.half_day_period || 'morning', 'start').toISOString()
            : new Date(values.start_date).toISOString(),
          end_date_time: values.day_off_type === 'HALF_DAY'
            ? setHalfDayTime(new Date(values.half_day_date), values.half_day_period || 'morning', 'end').toISOString()
            : new Date(values.end_date).toISOString(),
          date_off_number: values.date_off_number,
          title: values.reason?.trim() || 'Day off request',
        };

        console.log('📤 Submitting day off request:', JSON.stringify(dayOffRequestDTO, null, 2));

        let result;
        if (isEditMode && currentRequestId) {
          // Update existing request
          result = await updateDayOffRequest(currentRequestId, dayOffRequestDTO);
          console.log('✅ Day off request updated successfully:', result);

          await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Day off request updated successfully',
            timer: 2000,
            showConfirmButton: false,
            background: '#f8f9fa',
          });
        } else {
          // Create new request
          result = await createDayOffRequest(dayOffRequestDTO);
          console.log('✅ Day off request created successfully:', result);

          await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Day off request submitted successfully',
            timer: 2000,
            showConfirmButton: false,
            background: '#f8f9fa',
          });
        }

        // Reset form and close modal
        resetForm();
        setItemIdForUpdate(undefined);
        setIsEditMode(false);
        setCurrentRequestId(undefined);

      } catch (error: any) {
        console.error('❌ Submit error:', error);
        handleSubmitError(error);
      } finally {
        setIsSubmitting(false);
      }
    }
  })

  /* -------------------- Effects -------------------- */
  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
    fetchSupervisors();
  }, []);

  // Load request data when itemIdForUpdate changes
  useEffect(() => {
    if (itemIdForUpdate) {
      loadRequestData(itemIdForUpdate);
    } else {
      // Reset to add mode
      setIsEditMode(false);
      setCurrentRequestId(undefined);
      formik.resetForm();
      setFilteredEmployees([]);
    }
  }, [itemIdForUpdate]);

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

      // Only reset employee_id if not in edit mode
      if (!isEditMode) {
        formik.setFieldValue('employee_id', '');
      }
    } else {
      setFilteredEmployees([]);
      if (!isEditMode) {
        formik.setFieldValue('employee_id', '');
      }
    }
  }, [formik.values.department_id, employees, isEditMode]);

  // Calculate date off number when dates or day_off_type changes
  useEffect(() => {
    calculateDateOffNumber();
  }, [
    formik.values.start_date,
    formik.values.end_date,
    formik.values.half_day_date,
    formik.values.day_off_type,
    formik.values.half_day_period
  ]);

  // Set default half day period when day off type changes
  useEffect(() => {
    if (formik.values.day_off_type === 'HALF_DAY') {
      if (!formik.values.half_day_period) {
        formik.setFieldValue('half_day_period', 'morning');
      }
      if (!isEditMode) {
        formik.setFieldValue('start_date', '');
        formik.setFieldValue('end_date', '');
      }
    } else {
      if (!isEditMode) {
        formik.setFieldValue('half_day_date', '');
        formik.setFieldValue('half_day_period', undefined);
      }
    }
  }, [formik.values.day_off_type, isEditMode]);

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
      console.error('Error fetching employees:', err);
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
      console.error('Error fetching supervisors:', err);
      toast.error('Unable to load supervisors');
    } finally {
      setLoadingSupervisors(false);
    }
  }

  // Load request data for editing
  const loadRequestData = async (requestId: string) => {
    setIsLoadingRequest(true);
    try {
      const requestData = await getDayOffRequestById(requestId);

      if (requestData) {
        // Find the employee from the fetched data
        const employee = employees.find(emp =>
          emp._id === requestData.employee_id ||
          emp.id === requestData.employee_id
        );

        if (employee) {
          // Set the employee in filtered list
          setFilteredEmployees([employee]);

          // Find department from employee
          let departmentId = '';
          if (Array.isArray(employee.department_id) && employee.department_id.length > 0) {
            departmentId = employee.department_id[0]._id || employee.department_id[0].id || '';
          } else if (typeof employee.department_id === 'string') {
            departmentId = employee.department_id;
          }

          // Format dates
          const startDate = formatDateForInput(requestData.start_date_time);
          const endDate = formatDateForInput(requestData.end_date_time);

          // Determine half day period if applicable
          let halfDayPeriod: 'morning' | 'afternoon' | undefined = undefined;
          let halfDayDate = '';

          if (requestData.day_off_type === 'HALF_DAY') {
            halfDayPeriod = getHalfDayPeriodFromTime(requestData.start_date_time);
            halfDayDate = startDate;
          }

          // Set form values
          const formValues: LeaveFormValues = {
            department_id: departmentId,
            employee_id: requestData.employee_id,
            supervisor_id: Array.isArray(requestData.supervisor_id)
              ? requestData.supervisor_id[0] || ''
              : requestData.supervisor_id || '',
            day_off_type: requestData.day_off_type,
            start_date: requestData.day_off_type === 'FULL_DAY' ? startDate : '',
            end_date: requestData.day_off_type === 'FULL_DAY' ? endDate : '',
            half_day_date: halfDayDate,
            date_off_number: requestData.date_off_number || 0,
            half_day_period: halfDayPeriod,
            reason: requestData.title || '',
          };

          formik.setValues(formValues);
          setIsEditMode(true);
          setCurrentRequestId(requestId);
        } else {
          toast.error('Employee not found for this request');
        }
      }
    } catch (error) {
      console.error('Error loading request data:', error);
      toast.error('Failed to load request data');
    } finally {
      setIsLoadingRequest(false);
    }
  }

  /* -------------------- Helper Functions -------------------- */
  const calculateDateOffNumber = () => {
    const { day_off_type, half_day_date, start_date, end_date } = formik.values;

    if (day_off_type === 'FULL_DAY') {
      if (!start_date || !end_date) {
        formik.setFieldValue('date_off_number', 0);
        return;
      }

      const start = new Date(start_date);
      const end = new Date(end_date);

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      formik.setFieldValue('date_off_number', diffDays);
    } else if (day_off_type === 'HALF_DAY') {
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

  const checkLocalDateOverlap = async (
    employeeId: string,
    startDate: string,
    endDate?: string,
    dayOffType: 'FULL_DAY' | 'HALF_DAY' = 'FULL_DAY',
    excludeRequestId?: string
  ): Promise<{ hasConflict: boolean; conflicts?: any[] }> => {
    try {
      // Fetch day off requests from backend
      const response = await axios.get(`${API_URL}/day-off-requests`, {
        params: {
          employee_id: employeeId,
          status: ['Pending', 'Accepted']
        }
      });

      const requests = response.data?.data || [];

      const checkStart = new Date(startDate);
      let checkEnd: Date;

      if (dayOffType === 'HALF_DAY') {
        checkEnd = new Date(startDate);
      } else {
        checkEnd = new Date(endDate!);
      }

      // Adjust time for comparison
      checkStart.setHours(0, 0, 0, 0);
      checkEnd.setHours(23, 59, 59, 999);

      const conflicts: any[] = [];

      requests.forEach((req: any) => {
        // Skip excluded request in edit mode
        if (excludeRequestId && (req._id === excludeRequestId || req.id === excludeRequestId)) {
          return;
        }

        const reqStart = new Date(req.start_date_time);
        const reqEnd = new Date(req.end_date_time);

        reqStart.setHours(0, 0, 0, 0);
        reqEnd.setHours(23, 59, 59, 999);

        // Check overlap
        if (checkStart <= reqEnd && checkEnd >= reqStart) {
          conflicts.push(req);
        }
      });

      return {
        hasConflict: conflicts.length > 0,
        conflicts
      };
    } catch (error) {
      console.warn('Local conflict check failed:', error);
      return { hasConflict: false };
    }
  };

  const checkExistingDayOff = async (
    employeeId: string,
    startDate: string,
    endDate?: string,
    dayOffType: 'FULL_DAY' | 'HALF_DAY' = 'FULL_DAY',
    excludeRequestId?: string
  ): Promise<{ hasConflict: boolean; conflicts?: any[] }> => {
    try {
      const params: any = {
        employee_id: employeeId,
        exclude_request_id: excludeRequestId,
      };

      if (dayOffType === 'HALF_DAY') {
        params.date = startDate;
        params.type = 'half_day';
      } else {
        params.start_date = startDate;
        params.end_date = endDate;
        params.type = 'full_day';
      }

      const response = await axios.get(`${API_URL}/day-off-requests/check-conflict`, {
        params,
        timeout: 5000
      });

      return {
        hasConflict: response.data?.has_conflict || false,
        conflicts: response.data?.conflicts || []
      };
    } catch (error) {
      console.warn('Primary conflict check failed, trying fallback...', error);
      return await checkLocalDateOverlap(employeeId, startDate, endDate, dayOffType, excludeRequestId);
    }
  };

  /* -------------------- Render -------------------- */
  return (
    <>
      {isLoadingRequest && (
        <div className="text-center py-10">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading request data...</p>
        </div>
      )}

      {!isLoadingRequest && (
        <form className="form" onSubmit={formik.handleSubmit} noValidate>
          <div>
            <div className="card-body">
              {/* Modal Title */}
              <div className="mb-10">
                <h2 className="fw-bold text-gray-900">
                  {isEditMode ? 'Edit Day Off Request' : 'Create Day Off Request'}
                </h2>
                <p className="text-muted">
                  {isEditMode
                    ? 'Update the day off request details below.'
                    : 'Fill in the details below to create a new day off request.'}
                </p>
              </div>

              {/* Department */}
              <div className="fv-row mb-10">
                <label className="required fs-6 fw-bold mb-2">Department</label>
                <div className="d-flex align-items-center gap-3">
                  <select
                    {...formik.getFieldProps('department_id')}
                    className={clsx('form-select form-select-solid', {
                      'is-invalid': formik.touched.department_id && formik.errors.department_id,
                    })}
                    disabled={loadingDepartments || isSubmitting || isEditMode}
                    onChange={(e) => {
                      formik.handleChange(e);
                      if (!isEditMode) {
                        formik.setFieldValue('employee_id', '');
                      }
                    }}
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
                {isEditMode && (
                  <small className="text-muted">Department cannot be changed in edit mode.</small>
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
                    disabled={loadingEmployees || isSubmitting || isEditMode}
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
                {isEditMode && (
                  <small className="text-muted">Employee cannot be changed in edit mode.</small>
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
              {formik.values.day_off_type === 'HALF_DAY' && (
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
                          <option value="">Select Time Period</option>
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
                            : formik.values.half_day_period === 'afternoon'
                              ? '13:30 - 17:00'
                              : 'Please select time period'}
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
                    {formik.values.day_off_type === 'FULL_DAY'
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
            <div className="card-footer d-flex justify-content-end py-6 px-9 gap-3">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => {
                  setItemIdForUpdate(undefined);
                  setIsEditMode(false);
                  formik.resetForm();
                }}
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
                    {isEditMode ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  isEditMode ? 'Update Request' : 'Submit Request'
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Loading Overlay */}
      {(isSubmitting || isLoadingRequest) && (
        <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
      )}
    </>
  )
}

// เพิ่มฟังก์ชันจัดการ error ที่ใช้ร่วมกัน
const handleSubmitError = (error: any) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    console.error('🔴 API Error:', {
      status,
      data,
      url: error.config?.url,
      method: error.config?.method
    });

    switch (status) {
      case 400:
        if (data?.errors) {
          data.errors.forEach((err: any) => {
            toast.error(`${err.field || err.path}: ${err.message}`);
          });
        } else if (data?.message) {
          toast.error(data.message);
        } else {
          toast.error('Invalid request data');
        }
        break;

      case 409:
        toast.error('Conflict: This day off request already exists or overlaps with existing request');
        break;

      case 500:
        toast.error('Server error. Please try again later.');
        break;

      default:
        toast.error(data?.message || error.message || 'An error occurred');
        break;
    }
  } else if (error.message) {
    toast.error(error.message);
  } else {
    toast.error('An unknown error occurred');
  }
};
