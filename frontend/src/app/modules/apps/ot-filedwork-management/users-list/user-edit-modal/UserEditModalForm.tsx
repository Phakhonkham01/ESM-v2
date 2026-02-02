import { FC, useState, useEffect } from 'react';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import clsx from 'clsx';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { useMutation, useQueryClient } from 'react-query';
import { QUERIES } from '../../../../../../_metronic/helpers/crud-helper/consts';

interface OvertimeFormProps {
  onClose: () => void;
  isEditMode?: boolean;
  overtimeData?: any;
}

interface Department {
  _id: string;
  department_name: string;
}

interface OvertimeFormValues {
  date: string;
  start_time: string;
  end_time: string;
  team: string;
  reason: string;
  overtime_type: 'Regular OT' | 'Holiday OT' | 'Emergency OT';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

const UserEditModalForm: FC<OvertimeFormProps> = ({ onClose, isEditMode = false, overtimeData }) => {
  const queryClient = useQueryClient();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  // Validation Schema
  const overtimeSchema = Yup.object().shape({
    date: Yup.string().required('Date is required'),
    start_time: Yup.string().required('Start time is required'),
    end_time: Yup.string().required('End time is required'),
    team: Yup.string().required('Team/Department is required'),
    reason: Yup.string()
      .min(10, 'Reason must be at least 10 characters')
      .required('Reason is required'),
    overtime_type: Yup.string().required('Overtime type is required'),
    status: Yup.string().required('Status is required'),
  });

  // Initial Values
  const initialValues: OvertimeFormValues = {
    date: overtimeData?.date || new Date().toISOString().split('T')[0],
    start_time: overtimeData?.start_time || '08:00',
    end_time: overtimeData?.end_time || '17:00',
    team: overtimeData?.team || '',
    reason: overtimeData?.reason || '',
    overtime_type: overtimeData?.overtime_type || 'Regular OT',
    status: overtimeData?.status || 'pending',
  };

  // Calculate total hours
  const calculateTotalHours = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return '0 hours';
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    
    // Handle overnight
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) {
      return `${hours} hours`;
    }
    return `${hours}.${Math.round(minutes / 60 * 100)} hours`;
  };

  // Formik
  const formik = useFormik({
    initialValues,
    validationSchema: overtimeSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        const totalHours = calculateTotalHours(values.start_time, values.end_time);
        
        const dataToSubmit = {
          ...values,
          total_hours: totalHours,
          submitted_at: new Date().toISOString(),
        };

        const API_URL = import.meta.env.VITE_APP_API_URL;
        
        if (isEditMode && overtimeData?.id) {
          // Update existing overtime
          await axios.put(`${API_URL}/overtime/${overtimeData.id}`, dataToSubmit);
          toast.success('Overtime request updated successfully!');
        } else {
          // Create new overtime
          await axios.post(`${API_URL}/overtime`, dataToSubmit);
          toast.success('Overtime request submitted successfully!');
        }

        // queryClient.invalidateQueries([QUERIES.OVERTIME_LIST]);
        onClose();
      } catch (error: any) {
        console.error('Submit error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Failed to submit overtime request',
          confirmButtonText: 'OK',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_APP_API_URL;
        const response = await axios.get<{ data: Department[] }>(`${API_URL}/departments`);
        setDepartments(response.data.data || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to load departments');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Calculate and update total hours when times change
  useEffect(() => {
    if (formik.values.start_time && formik.values.end_time) {
      // This will trigger a re-render with updated total hours in the display
    }
  }, [formik.values.start_time, formik.values.end_time]);

  const fieldClass = (fieldName: keyof OvertimeFormValues) =>
    clsx('form-control form-control-solid', {
      'is-invalid': formik.touched[fieldName] && formik.errors[fieldName],
    });

  const totalHours = calculateTotalHours(formik.values.start_time, formik.values.end_time);

  return (
    <form className="form" onSubmit={formik.handleSubmit} noValidate>
      {/* Date Field */}
      <div className="col-md-4 mb-7">
        <label className="required fw-bold fs-6 mb-2">Date</label>
        <input
          type="date"
          {...formik.getFieldProps('date')}
          className={fieldClass('date')}
          disabled={formik.isSubmitting}
        />
        {formik.touched.date && formik.errors.date && (
          <div className="fv-plugins-message-container">
            <span role="alert" className="fv-help-block text-danger">
              {formik.errors.date}
            </span>
          </div>
        )}
      </div>

      {/* Time Fields - Start and End Time */}
      <div className="row mb-7">
        <div className="col-md-4">
          <label className="required fw-bold fs-6 mb-2">Start Time</label>
          <input
            type="time"
            {...formik.getFieldProps('start_time')}
            className={fieldClass('start_time')}
            disabled={formik.isSubmitting}
          />
          {formik.touched.start_time && formik.errors.start_time && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block text-danger">
                {formik.errors.start_time}
              </span>
            </div>
          )}
        </div>
        
        <div className="col-md-4">
          <label className="required fw-bold fs-6 mb-2">End Time</label>
          <input
            type="time"
            {...formik.getFieldProps('end_time')}
            className={fieldClass('end_time')}
            disabled={formik.isSubmitting}
          />
          {formik.touched.end_time && formik.errors.end_time && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block text-danger">
                {formik.errors.end_time}
              </span>
            </div>
          )}
        </div>

        {/* Total Hours (Calculated - Readonly) */}
        <div className="col-md-4">
          <label className="fw-bold fs-6 mb-2">Total Hours</label>
          <input
            type="text"
            value={totalHours}
            className="form-control form-control-solid bg-light"
            readOnly
            disabled
          />
        </div>
      </div>

      {/* Team/Department Selection */}
      <div className="fv-row mb-7">
        <label className="required fw-bold fs-6 mb-2">Team / Department</label>
        <select
          {...formik.getFieldProps('team')}
          className={fieldClass('team')}
          disabled={formik.isSubmitting || loading}
        >
          <option value="">Select Team</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.department_name}
            </option>
          ))}
          <option value="cx_team">CX Team</option>
          <option value="ai_team">AI Team</option>
          <option value="support_team">Support Team</option>
          <option value="development_team">Development Team</option>
        </select>
        {formik.touched.team && formik.errors.team && (
          <div className="fv-plugins-message-container">
            <span role="alert" className="fv-help-block text-danger">
              {formik.errors.team}
            </span>
          </div>
        )}
      </div>

      {/* Reason/Description */}
      <div className="fv-row mb-7">
        <label className="required fw-bold fs-6 mb-2">Reason / Description</label>
        <textarea
          {...formik.getFieldProps('reason')}
          className={`${fieldClass('reason')} form-control form-control-solid`}
          rows={4}
          placeholder="Please describe the reason for overtime..."
          disabled={formik.isSubmitting}
        />
        {formik.touched.reason && formik.errors.reason && (
          <div className="fv-plugins-message-container">
            <span role="alert" className="fv-help-block text-danger">
              {formik.errors.reason}
            </span>
          </div>
        )}
        <div className="text-muted mt-2">
          <small>Example: Need to complete project deadline, urgent client request, etc.</small>
        </div>
      </div>

      {/* Type of Overtime */}
      <div className="fv-row mb-7">
        <label className="required fw-bold fs-6 mb-2">Overtime Type</label>
        <div className="d-flex flex-wrap gap-3">
          {['Regular OT', 'Holiday OT', 'Emergency OT'].map((type) => {
            const typeId = `type-${type.replace(/\s+/g, '-').toLowerCase()}`;
            return (
              <div key={type} className="form-check form-check-custom form-check-solid">
                <input
                  id={typeId}
                  className="form-check-input"
                  type="radio"
                  value={type}
                  checked={formik.values.overtime_type === type}
                  onChange={() => formik.setFieldValue('overtime_type', type)}
                  disabled={formik.isSubmitting}
                />
                <label htmlFor={typeId} className="form-check-label fw-bold text-gray-800">
                  {type}
                </label>
              </div>
            );
          })}
        </div>
        {formik.touched.overtime_type && formik.errors.overtime_type && (
          <div className="fv-plugins-message-container">
            <span role="alert" className="fv-help-block text-danger">
              {formik.errors.overtime_type}
            </span>
          </div>
        )}
      </div>

      {/* Status (For admin/supervisor review) */}
      {isEditMode && (
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Status</label>
          <select
            {...formik.getFieldProps('status')}
            className={fieldClass('status')}
            disabled={formik.isSubmitting}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
          {formik.touched.status && formik.errors.status && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block text-danger">
                {formik.errors.status}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Actions - Buttons at bottom */}
      <div className="text-end pt-3 border-top">
        <button
          type="button"
          className="btn btn-light me-3"
          onClick={onClose}
          disabled={formik.isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={formik.isSubmitting || !formik.isValid}
        >
          {formik.isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Processing...
            </>
          ) : isEditMode ? (
            'Update Request'
          ) : (
            'Submit Request'
          )}
        </button>
      </div>
    </form>
  );
};

export { UserEditModalForm };