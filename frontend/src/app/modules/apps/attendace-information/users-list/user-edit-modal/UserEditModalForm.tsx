import { FC, useState, useEffect } from 'react';

interface OvertimeDetailProps {
  overtimeData: any;
}

interface Department {
  _id: string;
  department_name: string;
}

interface OvertimeDetailValues {
  date: string;
  start_time: string;
  end_time: string;
  team: string;
  reason: string;
  overtime_type: 'Regular OT' | 'Holiday OT' | 'Emergency OT';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  total_hours?: string;
  submitted_at?: string;
}

const UserEditModalForm: FC<OvertimeDetailProps> = ({ overtimeData }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  // Initial Values
  const detailValues: OvertimeDetailValues = {
    date: overtimeData?.date || new Date().toISOString().split('T')[0],
    start_time: overtimeData?.start_time || '08:00',
    end_time: overtimeData?.end_time || '17:00',
    team: overtimeData?.team || '',
    reason: overtimeData?.reason || '',
    overtime_type: overtimeData?.overtime_type || 'Regular OT',
    status: overtimeData?.status || 'pending',
    total_hours: overtimeData?.total_hours,
    submitted_at: overtimeData?.submitted_at,
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'badge-light-success';
      case 'rejected':
        return 'badge-light-danger';
      case 'completed':
        return 'badge-light-primary';
      case 'pending':
      default:
        return 'badge-light-warning';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      case 'pending':
      default:
        return 'Pending Review';
    }
  };

  // Get overtime type color
  const getOvertimeTypeClass = (type: string) => {
    switch (type) {
      case 'Emergency OT':
        return 'text-danger';
      case 'Holiday OT':
        return 'text-warning';
      case 'Regular OT':
      default:
        return 'text-primary';
    }
  };

  // Get department name
  const getDepartmentName = (deptId: string) => {
    const dept = departments.find(d => d._id === deptId);
    if (dept) return dept.department_name;

    // Fallback for hardcoded teams
    const teamMap: Record<string, string> = {
      'cx_team': 'CX Team',
      'ai_team': 'AI Team',
      'support_team': 'Support Team',
      'development_team': 'Development Team'
    };
    
    return teamMap[deptId] || deptId;
  };

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_APP_API_URL;
        const response = await fetch(`${API_URL}/departments`);
        const data = await response.json();
        setDepartments(data.data || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const totalHours = detailValues.total_hours || calculateTotalHours(detailValues.start_time, detailValues.end_time);

  return (
    <div className="detail-view">
      {/* Header with Status Badge */}
      <div className="d-flex justify-content-between align-items-center mb-7">
        <h3 className="fw-bold text-gray-800">Overtime Request Details</h3>
        <span className={`badge ${getStatusBadgeClass(detailValues.status)} fs-6 fw-bold px-4 py-2`}>
          {getStatusText(detailValues.status)}
        </span>
      </div>

      {/* Basic Information Card */}
      <div className="card card-flush mb-7">
        <div className="card-header">
          <div className="card-title">
            <h3 className="fw-bold">Basic Information</h3>
          </div>
        </div>
        <div className="card-body pt-0">
          <div className="row mb-5">
            <div className="col-md-6">
              <div className="mb-4">
                <label className="fw-bold text-gray-600 fs-7 mb-2">Date</label>
                <div className="fs-5 fw-bold text-gray-800">
                  {formatDate(detailValues.date)}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-4">
                <label className="fw-bold text-gray-600 fs-7 mb-2">Overtime Type</label>
                <div className={`fs-5 fw-bold ${getOvertimeTypeClass(detailValues.overtime_type)}`}>
                  {detailValues.overtime_type}
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-5">
            <div className="col-md-4">
              <div className="mb-4">
                <label className="fw-bold text-gray-600 fs-7 mb-2">Start Time</label>
                <div className="fs-5 fw-bold text-gray-800">
                  {formatTime(detailValues.start_time)}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-4">
                <label className="fw-bold text-gray-600 fs-7 mb-2">End Time</label>
                <div className="fs-5 fw-bold text-gray-800">
                  {formatTime(detailValues.end_time)}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-4">
                <label className="fw-bold text-gray-600 fs-7 mb-2">Total Hours</label>
                <div className="fs-5 fw-bold text-primary">
                  {totalHours}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="mb-4">
                <label className="fw-bold text-gray-600 fs-7 mb-2">Team / Department</label>
                <div className="fs-5 fw-bold text-gray-800">
                  {getDepartmentName(detailValues.team)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reason Card */}
      <div className="card card-flush mb-7">
        <div className="card-header">
          <div className="card-title">
            <h3 className="fw-bold">Reason / Description</h3>
          </div>
        </div>
        <div className="card-body pt-0">
          <div className="mb-4">
            <div className="fs-6 text-gray-800 bg-light p-5 rounded">
              {detailValues.reason || 'No reason provided'}
            </div>
          </div>
          {detailValues.reason && (
            <div className="text-muted fs-7">
              <i className="ki-duotone ki-information-3 fs-4 me-1">
                <span className="path1"></span>
                <span className="path2"></span>
                <span className="path3"></span>
              </i>
              This reason was provided by the requester.
            </div>
          )}
        </div>
      </div>

      {/* Submission Details Card */}
      <div className="card card-flush mb-7">
        <div className="card-header">
          <div className="card-title">
            <h3 className="fw-bold">Submission Details</h3>
          </div>
        </div>
        <div className="card-body pt-0">
          <div className="row">
            <div className="col-md-6">
              <div className="mb-4">
                <label className="fw-bold text-gray-600 fs-7 mb-2">Submitted At</label>
                <div className="fs-6 text-gray-800">
                  {detailValues.submitted_at 
                    ? formatDate(detailValues.submitted_at)
                    : 'Not available'}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-4">
                <label className="fw-bold text-gray-600 fs-7 mb-2">Request ID</label>
                <div className="fs-6 text-gray-800">
                  {overtimeData?.id ? `OT-${overtimeData.id.slice(-8).toUpperCase()}` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { UserEditModalForm };