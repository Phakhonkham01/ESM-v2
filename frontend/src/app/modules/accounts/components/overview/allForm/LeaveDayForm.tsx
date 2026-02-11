import React, { useState, useEffect, useMemo } from "react";
import { KTIcon } from "../../../../../../_metronic/helpers";
import { createDayOffRequest, getDayOffRequestsByUser } from "../../_core/_requests";
import { useAuth } from "../../../../auth";
import { getUsers } from "../../../../apps/user-management/users-list/core/_requests";
import type { User } from "../../../../apps/user-management/users-list/core/_models";
import type { DayOffRequest } from "../../_core/_requests";

interface LeaveDayFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const LeaveDayForm: React.FC<LeaveDayFormProps> = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [existingRequests, setExistingRequests] = useState<DayOffRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Error states for date validation
  const [dateErrors, setDateErrors] = useState({
    start_date: "",
    end_date: "",
  });

  const [formData, setFormData] = useState({
    day_off_type: "FULL_DAY" as "FULL_DAY" | "HALF_DAY",
    start_date: "",
    end_date: "",
    half_day_period: "MORNING" as "MORNING" | "AFTERNOON",
    title: "",
  });

  // Load existing day off requests for the user
  useEffect(() => {
    const loadExistingRequests = async () => {
      if (!currentUser?._id) return;
      
      try {
        setLoadingRequests(true);
        console.log("📅 Loading existing day off requests...");
        const response = await getDayOffRequestsByUser(currentUser._id);
        
        // Filter only Pending and Accepted requests
        const activeRequests = (response.requests || []).filter(
          (req) => req.status === "Pending" || req.status === "Accepted"
        );
        
        console.log("✅ Active requests:", activeRequests);
        setExistingRequests(activeRequests);
      } catch (error) {
        console.error("❌ Error loading existing requests:", error);
        setExistingRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    loadExistingRequests();
  }, [currentUser?._id]);

  // Load supervisors
  useEffect(() => {
    const loadSupervisors = async () => {
      try {
        console.log("🔄 Loading users...");
        const response = await getUsers("");
        console.log("📦 Full API response:", response);

        if (!response.data || response.data.length === 0) {
          console.log("❌ No users found in response");
          setSupervisors([]);
          return;
        }

        const supervisorUsers = (response.data || []).filter((user: User) => {
          const isSupervisor = user.role === "supervisor";
          const isActive = user.status === "Active";
          return isSupervisor && isActive;
        });

        console.log("✅ Filtered supervisors count:", supervisorUsers.length);
        setSupervisors(supervisorUsers);
      } catch (error) {
        console.error("❌ Error loading supervisors:", error);
        setSupervisors([]);
      }
    };
    loadSupervisors();
  }, []);

  // Find user's supervisor automatically
  const matchingSupervisors = useMemo(() => {
    console.log("=== Finding Supervisors ===");
    console.log("Current user department_id:", currentUser?.department_id);

    if (!currentUser?.department_id || supervisors.length === 0) {
      console.log("❌ No department_id or no supervisors");
      return [];
    }

    // Helper function to extract ID from object or string
    const extractId = (id: any): string => {
      if (typeof id === "object" && id !== null) {
        return String(id._id || id.id || id);
      }
      return String(id);
    };

    // Get user's department IDs as strings
    const userDeptIds = Array.isArray(currentUser.department_id)
      ? currentUser.department_id.map(extractId)
      : [extractId(currentUser.department_id)];

    console.log("User department IDs:", userDeptIds);

    // Find ALL supervisors with matching department
    const matched = supervisors.filter((s) => {
      const supervisorDeptIds = Array.isArray(s.department_id)
        ? s.department_id.map(extractId)
        : [extractId(s.department_id)];

      // Check if any user department matches any supervisor department
      const hasMatch = userDeptIds.some((userDept) =>
        supervisorDeptIds.includes(userDept),
      );

      return hasMatch;
    });

    console.log("🎯 Matched supervisors:", matched);
    return matched;
  }, [supervisors, currentUser?.department_id]);

  // Get all blocked dates as Set for O(1) lookup
  const blockedDatesSet = useMemo(() => {
    const dates = new Set<string>();
    
    existingRequests.forEach((req) => {
      const start = new Date(req.start_date_time);
      const end = new Date(req.end_date_time);
      
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dates.add(dateStr);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    return dates;
  }, [existingRequests]);

  // Check if a date string (YYYY-MM-DD) is blocked
  const isDateBlocked = (dateStr: string): boolean => {
    return blockedDatesSet.has(dateStr);
  };

  // Check if a date has existing request
  const hasExistingRequest = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDatesSet.has(dateStr);
  };

  // Find which request is blocking a specific date
  const getBlockingRequest = (dateStr: string): DayOffRequest | null => {
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);

    for (const req of existingRequests) {
      const reqStart = new Date(req.start_date_time);
      const reqEnd = new Date(req.end_date_time);
      
      reqStart.setHours(0, 0, 0, 0);
      reqEnd.setHours(0, 0, 0, 0);

      if (checkDate >= reqStart && checkDate <= reqEnd) {
        return req;
      }
    }
    return null;
  };

  // Check if date range overlaps with existing requests
  const hasOverlappingRequest = (startDate: string, endDate: string): { hasOverlap: boolean; conflictingDates: string[] } => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const conflictingDates: string[] = [];
    
    // Check each day in the range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (blockedDatesSet.has(dateStr)) {
        conflictingDates.push(currentDate.toLocaleDateString());
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      hasOverlap: conflictingDates.length > 0,
      conflictingDates
    };
  };

  // Get min date (today)
  const minDate = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);
  
  // Calculate total days
  const calculateTotalDays = () => {
    if (formData.day_off_type === "FULL_DAY") {
      if (!formData.start_date || !formData.end_date) return 0;
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1;
    } else {
      return 0.5;
    }
  };

  const totalDays = calculateTotalDays();

  // Get datetime strings for Full Day
  const getDateTimeForFullDay = (date: string, isStart: boolean) => {
    const d = new Date(date);
    if (isStart) {
      d.setHours(0, 0, 0, 0);
    } else {
      d.setHours(23, 59, 59, 999);
    }
    return d.toISOString();
  };

  // Get datetime strings for Half Day
  const getDateTimeForHalfDay = (date: string, period: 'MORNING' | 'AFTERNOON') => {
    const d = new Date(date);
    
    if (period === 'MORNING') {
      const start = new Date(d);
      start.setHours(8, 30, 0, 0);
      
      const end = new Date(d);
      end.setHours(12, 0, 0, 0);
      
      return {
        start: start.toISOString(),
        end: end.toISOString()
      }
    } else {
      const start = new Date(d);
      start.setHours(13, 30, 0, 0);
      
      const end = new Date(d);
      end.setHours(17, 0, 0, 0);
      
      return {
        start: start.toISOString(),
        end: end.toISOString()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser?._id) {
      alert("User not found");
      return;
    }

    if (matchingSupervisors.length === 0) {
      alert("No supervisor found in your department");
      return;
    }

    if (!formData.start_date || !formData.title) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.day_off_type === "FULL_DAY" && !formData.end_date) {
      alert("Please select end date");
      return;
    }

    // Check for errors before submitting
    if (dateErrors.start_date || dateErrors.end_date) {
      alert("Please fix date errors before submitting");
      return;
    }

    // Final validation for overlapping requests
    if (formData.day_off_type === "FULL_DAY") {
      const overlap = hasOverlappingRequest(formData.start_date, formData.end_date);
      if (overlap.hasOverlap) {
        alert(
          `Cannot create request. You already have pending or approved leave on the following dates:\n\n${overlap.conflictingDates.join('\n')}\n\nPlease choose different dates.`
        );
        return;
      }
    } else {
      // For half day, just check the single date
      if (hasExistingRequest(new Date(formData.start_date))) {
        alert(
          `Cannot create request. You already have a pending or approved leave on ${new Date(formData.start_date).toLocaleDateString()}.\n\nPlease choose a different date.`
        );
        return;
      }
    }

    try {
      setLoading(true);

      let startDateTime: string;
      let endDateTime: string;

      if (formData.day_off_type === "FULL_DAY") {
        startDateTime = getDateTimeForFullDay(formData.start_date, true);
        endDateTime = getDateTimeForFullDay(formData.end_date, false);
      } else {
        const halfDayTimes = getDateTimeForHalfDay(
          formData.start_date,
          formData.half_day_period,
        );
        startDateTime = halfDayTimes.start;
        endDateTime = halfDayTimes.end;
      }

      const supervisorIds = matchingSupervisors.map((s) => s.id || s.id);

      console.log("🚀 Submitting request:", {
        user_id: currentUser._id,
        supervisor_id: supervisorIds,
        employee_id: currentUser._id,
        day_off_type: formData.day_off_type,
        start_date_time: startDateTime,
        end_date_time: endDateTime,
        title: formData.title,
      });

      await createDayOffRequest({
        user_id: currentUser._id,
        supervisor_id: supervisorIds,
        employee_id: currentUser._id,
        day_off_type: formData.day_off_type,
        start_date_time: startDateTime,
        end_date_time: endDateTime,
        title: formData.title,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      alert(error.message || "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  // Custom date input with inline error validation
  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    if (!value) {
      setFormData({ ...formData, [field]: value });
      setDateErrors({ ...dateErrors, [field]: "" });
      return;
    }

    // Check if date is blocked
    if (isDateBlocked(value)) {
      const blockingReq = getBlockingRequest(value);
      const errorMsg = `❌ This date is not available. You have a ${blockingReq?.status || 'pending/approved'} leave request on this date.`;
      setDateErrors({ ...dateErrors, [field]: errorMsg });
      // Still update the value to show it, but with error
      setFormData({ ...formData, [field]: value });
      return;
    }

    // For end date, check if range has any blocked dates
    if (field === 'end_date' && formData.start_date) {
      const overlap = hasOverlappingRequest(formData.start_date, value);
      if (overlap.hasOverlap) {
        const errorMsg = `❌ Date range contains blocked dates: ${overlap.conflictingDates.slice(0, 3).join(', ')}${overlap.conflictingDates.length > 3 ? '...' : ''}`;
        setDateErrors({ ...dateErrors, [field]: errorMsg });
        setFormData({ ...formData, [field]: value });
        return;
      }
    }

    // Date is valid
    setDateErrors({ ...dateErrors, [field]: "" });
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <h3 className="card-title">
          <KTIcon iconName="calendar" className="fs-2 text-primary me-2" />
          Leave Day Request
        </h3>
        <div className="card-toolbar">
          <button
            type="button"
            className="btn btn-sm btn-icon btn-light"
            onClick={onClose}
          >
            <KTIcon iconName="cross" className="fs-2" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className="card-body"
          style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}
        >
          {/* Loading existing requests indicator */}
          {loadingRequests && (
            <div className="alert alert-info d-flex align-items-center mb-7">
              <span className="spinner-border spinner-border-sm me-3"></span>
              <span>Loading your existing leave requests...</span>
            </div>
          )}

          {/* Show existing requests info */}
          {/* {!loadingRequests && existingRequests.length > 0 && (
            <div className="alert alert-warning d-flex align-items-start mb-7">
              <KTIcon iconName="information-5" className="fs-2 me-3 mt-1" />
              <div className="flex-grow-1">
                <h5 className="mb-2">🔒 Active Leave Requests</h5>
                <p className="mb-2">You have {existingRequests.length} active leave request(s):</p>
                <div className="bg-light-warning p-3 rounded mb-3">
                  <ul className="mb-0">
                    {existingRequests.slice(0, 5).map((req, idx) => (
                      <li key={idx} className="mb-1">
                        <strong>{new Date(req.start_date_time).toLocaleDateString()}</strong>
                        {new Date(req.start_date_time).toDateString() !== new Date(req.end_date_time).toDateString() && (
                          <> - <strong>{new Date(req.end_date_time).toLocaleDateString()}</strong></>
                        )}
                        <span className={`badge ms-2 ${req.status === 'Pending' ? 'badge-light-warning' : 'badge-light-success'}`}>
                          {req.status}
                        </span>
                      </li>
                    ))}
                    {existingRequests.length > 5 && (
                      <li className="text-muted">+ {existingRequests.length - 5} more...</li>
                    )}
                  </ul>
                </div>
                <small className="text-muted">
                  <KTIcon iconName="shield-cross" className="fs-7 me-1" />
                  These dates will show an error message if selected
                </small>
              </div>
            </div>
          )} */}

          {/* Auto-Selected Supervisors Info */}
          <div
            className={`alert ${matchingSupervisors.length > 0 ? "alert-success" : "alert-warning"} d-flex align-items-start mb-7`}
          >
            <KTIcon iconName="user" className="fs-2 me-3 mt-1 text-primary" />
            <div className="flex-grow-1">
              <h5 className="mb-3">Supervisors in Your Department</h5>
              {matchingSupervisors.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {matchingSupervisors.map((supervisor, index) => (
                    <div
                      key={supervisor.id || supervisor.id || index}
                      className="d-flex align-items-center p-3 bg-light rounded"
                    >
                      <div className="flex-grow-1">
                        <div className="fw-bold">
                          {supervisor.first_name_en} {supervisor.last_name_en}
                        </div>
                      </div>
                      <div className="badge badge-light-success">
                        Supervisor
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="d-flex align-items-center">
                  <KTIcon iconName="information" className="fs-5 me-2" />
                  <span>No supervisor found in the system</span>
                </div>
              )}
            </div>
          </div>

          {/* Leave Type Selection */}
          <div className="mb-7">
            <label className="form-label fw-bold d-flex align-items-center required">
              <KTIcon iconName="time" className="fs-3 text-primary me-2" />
              Leave Type
            </label>
            <div className="row g-4">
              <div className="col-md-6">
                <div
                  className={`card cursor-pointer border-2 ${
                    formData.day_off_type === "FULL_DAY"
                      ? "border-primary bg-light-primary"
                      : "border-gray-300"
                  }`}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      day_off_type: "FULL_DAY",
                      end_date: "",
                    })
                  }
                  style={{ transition: "all 0.3s ease" }}
                >
                  <div className="card-body text-center py-5">
                    <KTIcon
                      iconName="calendar"
                      className={`fs-2x mb-3 ${formData.day_off_type === "FULL_DAY" ? "text-primary" : "text-gray-600"}`}
                    />
                    <h4 className="fw-bold mb-2">Full Day</h4>
                    <p className="text-muted mb-0 fs-7">Take entire day off</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div
                  className={`card cursor-pointer border-2 ${
                    formData.day_off_type === "HALF_DAY"
                      ? "border-primary bg-light-primary"
                      : "border-gray-300"
                  }`}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      day_off_type: "HALF_DAY",
                      end_date: "",
                    })
                  }
                  style={{ transition: "all 0.3s ease" }}
                >
                  <div className="card-body text-center py-5">
                    <KTIcon
                      iconName="time"
                      className={`fs-2x mb-3 ${formData.day_off_type === "HALF_DAY" ? "text-primary" : "text-gray-600"}`}
                    />
                    <h4 className="fw-bold mb-2">Half Day</h4>
                    <p className="text-muted mb-0 fs-7">Take specific period</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          {formData.day_off_type === "FULL_DAY" ? (
            <div className="row mb-7">
              {/* Start Date */}
              <div className="col-md-6 mb-7 mb-md-0">
                <label className="form-label fw-bold required d-flex align-items-center">
                  <KTIcon
                    iconName="calendar"
                    className="fs-3 text-primary me-2"
                  />
                  Start Date
                </label>
                <input
                  type="date"
                  className={`form-control form-control-lg ${dateErrors.start_date ? 'is-invalid' : ''}`}
                  value={formData.start_date}
                  onChange={(e) => handleDateChange('start_date', e.target.value)}
                  min={minDate}
                  required
                  disabled={loadingRequests}
                />
                {dateErrors.start_date ? (
                  <div className="invalid-feedback d-block">
                    <KTIcon iconName="cross-circle" className="fs-7 me-1" />
                    {dateErrors.start_date}
                  </div>
                ) : (
                  <div className="form-text">
                    <KTIcon iconName="information-5" className="fs-7 me-1" />
                    Select start date for leave
                  </div>
                )}
              </div>

              {/* End Date */}
              <div className="col-md-6">
                <label className="form-label fw-bold required d-flex align-items-center">
                  <KTIcon
                    iconName="calendar"
                    className="fs-3 text-primary me-2"
                  />
                  End Date
                </label>
                <input
                  type="date"
                  className={`form-control form-control-lg ${dateErrors.end_date ? 'is-invalid' : ''}`}
                  value={formData.end_date}
                  onChange={(e) => handleDateChange('end_date', e.target.value)}
                  min={formData.start_date || minDate}
                  required
                  disabled={loadingRequests || !formData.start_date}
                />
                {dateErrors.end_date ? (
                  <div className="invalid-feedback d-block">
                    <KTIcon iconName="cross-circle" className="fs-7 me-1" />
                    {dateErrors.end_date}
                  </div>
                ) : (
                  <div className="form-text">
                    <KTIcon iconName="information-5" className="fs-7 me-1" />
                    End date must not be before start date
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Date for Half Day */}
              <div className="mb-7">
                <label className="form-label fw-bold required d-flex align-items-center">
                  <KTIcon
                    iconName="calendar"
                    className="fs-3 text-primary me-2"
                  />
                  Leave Date
                </label>
                <input
                  type="date"
                  className={`form-control form-control-lg ${dateErrors.start_date ? 'is-invalid' : ''}`}
                  value={formData.start_date}
                  onChange={(e) => handleDateChange('start_date', e.target.value)}
                  min={minDate}
                  required
                  disabled={loadingRequests}
                />
                {dateErrors.start_date ? (
                  <div className="invalid-feedback d-block">
                    <KTIcon iconName="cross-circle" className="fs-7 me-1" />
                    {dateErrors.start_date}
                  </div>
                ) : (
                  <div className="form-text">
                    <KTIcon iconName="information-5" className="fs-7 me-1" />
                    Select date for half-day leave
                  </div>
                )}
              </div>

              {/* Half Day Period Selection */}
              <div className="mb-7">
                <label className="form-label fw-bold required d-flex align-items-center">
                  <KTIcon iconName="time" className="fs-3 text-primary me-2" />
                  Time Period
                </label>
                <div className="row g-4">
                  <div className="col-md-6">
                    <div
                      className={`card cursor-pointer border-2 ${
                        formData.half_day_period === "MORNING"
                          ? "border-warning bg-light-warning"
                          : "border-gray-300"
                      }`}
                      onClick={() =>
                        setFormData({ ...formData, half_day_period: "MORNING" })
                      }
                      style={{ transition: "all 0.3s ease" }}
                    >
                      <div className="card-body d-flex align-items-center py-4">
                        <KTIcon
                          iconName="sun"
                          className={`fs-2x me-4 ${formData.half_day_period === "MORNING" ? "text-warning" : "text-gray-600"}`}
                        />
                        <div>
                          <h5 className="fw-bold mb-1">Morning</h5>
                          <p className="text-muted mb-0 fs-7">
                            8:30 AM - 12:00 PM
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div
                      className={`card cursor-pointer border-2 ${
                        formData.half_day_period === "AFTERNOON"
                          ? "border-info bg-light-info"
                          : "border-gray-300"
                      }`}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          half_day_period: "AFTERNOON",
                        })
                      }
                      style={{ transition: "all 0.3s ease" }}
                    >
                      <div className="card-body d-flex align-items-center py-4">
                        <KTIcon
                          iconName="moon"
                          className={`fs-2x me-4 ${formData.half_day_period === "AFTERNOON" ? "text-info" : "text-gray-600"}`}
                        />
                        <div>
                          <h5 className="fw-bold mb-1">Afternoon</h5>
                          <p className="text-muted mb-0 fs-7">
                            1:30 PM - 5:00 PM
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Reason */}
          <div className="mb-7">
            <label className="form-label fw-bold required d-flex align-items-center">
              <KTIcon iconName="note-2" className="fs-3 text-primary me-2" />
              Reason & Details
            </label>
            <textarea
              className="form-control form-control-lg"
              rows={4}
              placeholder="Explain your reason for leave clearly..."
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          {/* Total Days Display */}
          <div className="alert alert-primary d-flex align-items-center p-5 mb-0">
            <div className="d-flex flex-column flex-grow-1">
              <h4 className="mb-1 fw-bold">Total Leave Days</h4>
              <div className="text-gray-700">
                {formData.day_off_type === "FULL_DAY" &&
                formData.start_date &&
                formData.end_date
                  ? `${new Date(formData.start_date).toLocaleDateString()} to ${new Date(formData.end_date).toLocaleDateString()}`
                  : formData.day_off_type === "HALF_DAY" && formData.start_date
                    ? `${new Date(formData.start_date).toLocaleDateString()} (${formData.half_day_period === "MORNING" ? "MORNING" : "AFTERNOON"})`
                    : "Please select date"}
              </div>
            </div>
            <div className="text-end">
              <h1 className="fw-bold text-primary mb-0">
                {totalDays > 0 ? totalDays.toFixed(1) : "0.0"}
              </h1>
              <div className="text-gray-700 fs-7">
                {formData.day_off_type === "FULL_DAY" ? "Days" : "Days (Half)"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="card-footer d-flex justify-content-end py-6">
          <button
            type="button"
            className="btn btn-light me-3"
            onClick={onClose}
            disabled={loading}
          >
            <KTIcon iconName="cross" className="fs-3 me-2" />
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-success"
            disabled={
              loading || 
              matchingSupervisors.length === 0 || 
              loadingRequests ||
              !!dateErrors.start_date ||
              !!dateErrors.end_date
            }
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Submitting...
              </>
            ) : (
              <>
                <KTIcon iconName="check" className="fs-3 me-2" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveDayForm;