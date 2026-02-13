import React, { useState, useEffect, useMemo } from "react";
import { KTIcon } from "../../../../../../_metronic/helpers";
import {
  createSatSunRequest,
  getSatSunRequestsByUser,
  createMorningHalfDay,
  createAfternoonHalfDay,
  createFullDay,
  isSaturday,
  isSunday,
} from "../../_core/_requests";
import { useAuth } from "../../../../auth";
import { getUsers } from "../../../../apps/user-management/users-list/core/_requests";
import type { User } from "../../../../apps/user-management/users-list/core/_models";
import type { SatSunRequest } from "../../_core/_requests";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface SatSunRequestProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const SaturdaySundayRequest: React.FC<SatSunRequestProps> = ({
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [existingRequests, setExistingRequests] = useState<SatSunRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Error states for validation
  const [dateError, setDateError] = useState("");

  const [formData, setFormData] = useState({
    day_choice: "Saturday" as "Saturday" | "Sunday",
    date: null as Date | null,
    day_off_type: "Full day" as "Full day" | "Half day",
    half_day_period: "morning" as "morning" | "afternoon",
    description: "",
  });

  // Load existing Saturday/Sunday requests for the user
  useEffect(() => {
    const loadExistingRequests = async () => {
      if (!currentUser?._id) return;

      try {
        setLoadingRequests(true);
        console.log("📅 Loading existing Saturday/Sunday requests...");
        const response = await getSatSunRequestsByUser(currentUser._id);

        const activeRequests = (response.requests || []).filter(
          (req) =>
            req.status === "Pending" || req.status === "Accepted"
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

  // Reload requests when day_choice changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, date: null }));
    setDateError("");
  }, [formData.day_choice]);

  // Load supervisors
  useEffect(() => {
    const loadSupervisors = async () => {
      try {
        const response = await getUsers("");
        const supervisorUsers = (response.data || []).filter(
          (user: User) =>
            user.role === "supervisor" && user.status === "Active"
        );
        setSupervisors(supervisorUsers);
      } catch (error) {
        console.error("Error loading supervisors:", error);
        setSupervisors([]);
      }
    };
    loadSupervisors();
  }, []);

  // Helper function to extract ID
  const extractId = (id: any): string => {
    if (typeof id === "object" && id !== null) {
      return String(id._id || id.id || id);
    }
    return String(id);
  };

  // Find matching supervisors
  const matchingSupervisors = useMemo(() => {
    if (!currentUser?.department_id || supervisors.length === 0) {
      return [];
    }

    const userDeptIds = Array.isArray(currentUser.department_id)
      ? currentUser.department_id.map(extractId)
      : [extractId(currentUser.department_id)];

    const matched = supervisors.filter((s) => {
      const supervisorDeptIds = Array.isArray(s.department_id)
        ? s.department_id.map(extractId)
        : [extractId(s.department_id)];

      return userDeptIds.some((userDept) =>
        supervisorDeptIds.includes(userDept)
      );
    });

    return matched;
  }, [supervisors, currentUser?.department_id]);

  // Get blocked dates for the currently selected day_choice
  const blockedDatesSet = useMemo(() => {
    const dates = new Set<string>();

    existingRequests
      .filter(req => req.day_choice === formData.day_choice)
      .forEach((req) => {
        const dateStr =
          typeof req.start_date_time === "string"
            ? req.start_date_time.split("T")[0]
            : new Date(req.start_date_time).toISOString().split("T")[0];
        dates.add(dateStr);
      });

    return dates;
  }, [existingRequests, formData.day_choice]);

  // Convert blocked dates to Date objects for excludeDates prop
  const excludedDatesArray = useMemo(() => {
    const datesArray: Date[] = [];
    
    existingRequests
      .filter(req => req.day_choice === formData.day_choice)
      .forEach((req) => {
        const dateObj = typeof req.start_date_time === "string"
          ? new Date(req.start_date_time)
          : new Date(req.start_date_time);
        datesArray.push(dateObj);
      });
    
    return datesArray;
  }, [existingRequests, formData.day_choice]);

  // Check if a date is blocked
  const isDateBlocked = (date: Date): boolean => {
    const dateStr = date.toISOString().split("T")[0];
    return blockedDatesSet.has(dateStr);
  };

  // Get blocking request
  const getBlockingRequest = (date: Date): SatSunRequest | null => {
    const dateStr = date.toISOString().split("T")[0];
    
    for (const req of existingRequests) {
      if (req.day_choice !== formData.day_choice) continue;

      const reqDateStr =
        typeof req.start_date_time === "string"
          ? req.start_date_time.split("T")[0]
          : new Date(req.start_date_time).toISOString().split("T")[0];

      if (reqDateStr === dateStr) {
        return req;
      }
    }
    return null;
  };

  // Validate that selected date matches day choice
  const validateDateChoice = (date: Date): string => {
    if (!date) return "";

    const isValid =
      formData.day_choice === "Saturday" 
        ? isSaturday(date) 
        : isSunday(date);

    if (!isValid) {
      return `❌ Selected date must be a ${formData.day_choice}`;
    }

    return "";
  };

  // Get active requests for current day choice
  const currentDayRequests = useMemo(() => {
    return existingRequests.filter(req => req.day_choice === formData.day_choice);
  }, [existingRequests, formData.day_choice]);

  // Config based on day choice
  const config = useMemo(() => {
    return formData.day_choice === "Saturday"
      ? {
          emoji: "📅",
          color: "info",
          iconBg: "light-info",
        }
      : {
          emoji: "🗓️",
          color: "danger",
          iconBg: "light-danger",
        };
  }, [formData.day_choice]);

  // Handle date change with validation
  const handleDateChange = (date: Date | null) => {
    if (!date) {
      setFormData({ ...formData, date: null });
      setDateError("");
      return;
    }

    // Check if date matches day choice
    const dayChoiceError = validateDateChoice(date);
    if (dayChoiceError) {
      setDateError(dayChoiceError);
      setFormData({ ...formData, date: null }); // Don't allow invalid date
      return;
    }

    // Check if date is blocked
    if (isDateBlocked(date)) {
      const blockingReq = getBlockingRequest(date);
      const errorMsg = `❌ This date is not available. You already have a ${blockingReq?.status || "pending/approved"} ${formData.day_choice} request on ${date.toLocaleDateString()}.`;
      setDateError(errorMsg);
      setFormData({ ...formData, date: null }); // Don't allow blocked date
      return;
    }

    // Date is valid
    setDateError("");
    setFormData({ ...formData, date });
  };

  // Filter dates - only show Saturdays or Sundays
  const filterDate = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    
    // Check if it's the correct day of week
    if (formData.day_choice === "Saturday") {
      return dayOfWeek === 6; // Only Saturdays
    } else {
      return dayOfWeek === 0; // Only Sundays
    }
  };

  // Custom day class name for styling
  const getDayClassName = (date: Date): string => {
    const dayOfWeek = date.getDay();
    const expectedDay = formData.day_choice === "Saturday" ? 6 : 0;
    
    // Highlight the correct day
    if (dayOfWeek === expectedDay) {
      // Check if blocked
      if (isDateBlocked(date)) {
        return "blocked-date";
      }
      return "available-date";
    }
    
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser?._id) {
      MySwal.fire({
        icon: "error",
        title: "User Not Found",
        text: "Unable to identify the current user. Please try logging in again.",
        confirmButtonColor: "#f1416c",
      });
      return;
    }

    if (matchingSupervisors.length === 0) {
      MySwal.fire({
        icon: "warning",
        title: "No Supervisor Found",
        text: "No supervisor found in your department. Please contact HR.",
        confirmButtonColor: "#ffc107",
      });
      return;
    }

    if (!formData.date) {
      MySwal.fire({
        icon: "warning",
        title: "Date Required",
        text: "Please select a date for your leave request.",
        confirmButtonColor: "#ffc107",
      });
      return;
    }

    if (dateError) {
      MySwal.fire({
        icon: "error",
        title: "Invalid Date",
        text: "Please fix the date error before submitting.",
        confirmButtonColor: "#f1416c",
      });
      return;
    }

    // Double check if date is blocked
    if (isDateBlocked(formData.date)) {
      const blockingReq = getBlockingRequest(formData.date);
      MySwal.fire({
        icon: "error",
        title: "Cannot Submit Request",
        html: `
          <div class="text-start">
            <p class="mb-2">This ${formData.day_choice} (<strong>${formData.date.toLocaleDateString()}</strong>) already has a <strong>${blockingReq?.status || "pending/approved"}</strong> request.</p>
            <p class="mb-0 text-muted">Please select a different date.</p>
          </div>
        `,
        confirmButtonColor: "#f1416c",
        confirmButtonText: "Choose Another Date",
      });
      return;
    }

    try {
      setLoading(true);

      const supervisorIds = matchingSupervisors.map((s) => s.id || s.id);
      const selectedDate = formData.date;

      // Create time range based on day_off_type
      let timeRange: { start: Date; end: Date };

      if (formData.day_off_type === "Full day") {
        timeRange = createFullDay(selectedDate);
      } else {
        if (formData.half_day_period === "morning") {
          timeRange = createMorningHalfDay(selectedDate);
        } else {
          timeRange = createAfternoonHalfDay(selectedDate);
        }
      }

      const requestData = {
        user_id: currentUser._id,
        supervisor_id: supervisorIds,
        employee_id: currentUser._id,
        day_choice: formData.day_choice,
        day_off_type: formData.day_off_type,
        start_date_time: timeRange.start.toISOString(),
        end_date_time: timeRange.end.toISOString(),
        description: formData.description || `${formData.day_choice} leave request`,
      };

      console.log("📤 Sending data:", requestData);

      const response = await createSatSunRequest(requestData);

      console.log("✅ Response:", response);

      await MySwal.fire({
        icon: "success",
        title: `${config.emoji} Request Submitted Successfully!`,
        html: `
          <div class="text-start">
            <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
              <div class="flex-grow-1">
                <div class="fw-bold text-gray-800 mb-1">
                  <i class="bi bi-calendar3 text-${config.color} me-2"></i>Date
                </div>
                <div class="text-gray-600">${formData.date.toLocaleDateString()}</div>
              </div>
            </div>
            
            <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
              <div class="flex-grow-1">
                <div class="fw-bold text-gray-800 mb-1">
                  <i class="bi bi-clock text-${config.color} me-2"></i>Leave Type
                </div>
                <div class="text-gray-600">
                  ${formData.day_off_type}${formData.day_off_type === "Half day" ? ` (${formData.half_day_period})` : ""}
                </div>
              </div>
            </div>
            
            <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
              <div class="flex-grow-1">
                <div class="fw-bold text-gray-800 mb-1">
                  <i class="bi bi-file-earmark-text text-${config.color} me-2"></i>Days Used
                </div>
                <div class="text-gray-600">${response.request?.date_off_number || 0.5} day(s)</div>
              </div>
            </div>
            
            <div class="d-flex align-items-center p-3 bg-light-${config.color} rounded">
              <div class="flex-grow-1">
                <div class="fw-bold text-${config.color} mb-1">
                  <i class="bi bi-calendar-check text-${config.color} me-2"></i>Remaining Leave Days
                </div>
                <div class="fs-4 fw-bold text-${config.color}">${response.remaining_leave_days || 0} days</div>
              </div>
            </div>
          </div>
        `,
        confirmButtonColor: formData.day_choice === "Saturday" ? "#009ef7" : "#f1416c",
        confirmButtonText: "Great!",
        allowOutsideClick: false,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("❌ Error:", error);
      MySwal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error.message || `Failed to submit ${formData.day_choice} leave request. Please try again.`,
        confirmButtonColor: "#f1416c",
        footer: '<a href="#" class="text-muted">Need help? Contact HR</a>',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <h3 className="card-title">
          <KTIcon iconName="calendar-8" className={`fs-2 text-${config.color} me-2`} />
          {config.emoji} Weekend Leave Request
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
          {/* Enhanced custom styles for datepicker */}
          <style>{`
            /* DatePicker Container */
            .react-datepicker-wrapper {
              width: 100%;
            }
            
            .react-datepicker {
              font-family: inherit;
              border: 2px solid #e4e6ef;
              border-radius: 0.95rem;
              box-shadow: 0 0 50px 0 rgba(82, 63, 105, 0.15);
            }
            
            /* Header */
            .react-datepicker__header {
              background-color: ${formData.day_choice === "Saturday" ? "#f1faff" : "#fff5f8"};
              border-bottom: 2px solid #e4e6ef;
              border-radius: 0.95rem 0.95rem 0 0;
              padding: 1rem 0;
            }
            
            .react-datepicker__current-month {
              color: ${formData.day_choice === "Saturday" ? "#009ef7" : "#f1416c"};
              font-weight: 600;
              font-size: 1.1rem;
              margin-bottom: 0.5rem;
            }
            
            .react-datepicker__day-name {
              color: #7e8299;
              font-weight: 600;
              width: 2.5rem;
              line-height: 2.5rem;
              margin: 0.2rem;
            }
            
            /* Navigation */
            .react-datepicker__navigation {
              top: 1.2rem;
              width: 2rem;
              height: 2rem;
              border: none;
              background-color: ${formData.day_choice === "Saturday" ? "#e8f5fc" : "#fff5f8"};
              border-radius: 0.475rem;
            }
            
            .react-datepicker__navigation:hover {
              background-color: ${formData.day_choice === "Saturday" ? "#009ef7" : "#f1416c"};
            }
            
            .react-datepicker__navigation-icon::before {
              border-color: ${formData.day_choice === "Saturday" ? "#009ef7" : "#f1416c"};
              top: 8px;
            }
            
            .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
              border-color: #fff;
            }
            
            /* Days */
            .react-datepicker__month {
              margin: 1rem;
            }
            
            .react-datepicker__day {
              width: 2.5rem;
              line-height: 2.5rem;
              margin: 0.2rem;
              border-radius: 0.475rem;
              color: #3f4254;
              font-weight: 500;
              transition: all 0.2s ease;
            }
            
            .react-datepicker__day:hover {
              background-color: #f5f8fa;
              transform: scale(1.05);
            }
            
            /* Available Dates */
            .react-datepicker__day.available-date {
              background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
              color: #2e7d32;
              font-weight: 700;
              border: 2px solid #81c784;
              position: relative;
            }
            
            .react-datepicker__day.available-date::after {
              content: '✓';
              position: absolute;
              top: -2px;
              right: 2px;
              font-size: 10px;
              color: #2e7d32;
            }
            
            .react-datepicker__day.available-date:hover {
              background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
              color: white;
              transform: scale(1.1);
              box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
            }
            
            /* Blocked/Excluded Dates - Cannot be clicked or selected */
            .react-datepicker__day--excluded {
              background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%) !important;
              color: #c62828 !important;
              font-weight: 700 !important;
              text-decoration: line-through !important;
              cursor: not-allowed !important;
              border: 2px solid #ef9a9a !important;
              position: relative;
              pointer-events: none !important;
              opacity: 0.6;
            }
            
            .react-datepicker__day--excluded::before {
              content: '✕';
              position: absolute;
              top: -2px;
              right: 2px;
              font-size: 10px;
              color: #c62828;
            }
            
            .react-datepicker__day--excluded:hover {
              background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%) !important;
              color: #c62828 !important;
              transform: none !important;
              box-shadow: none !important;
            }
            
            /* Blocked Dates - Additional styling for custom class */
            .react-datepicker__day.blocked-date {
              background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
              color: #c62828;
              font-weight: 700;
              text-decoration: line-through;
              cursor: not-allowed !important;
              border: 2px solid #ef9a9a;
              position: relative;
              pointer-events: none;
              opacity: 0.6;
            }
            
            .react-datepicker__day.blocked-date::before {
              content: '✕';
              position: absolute;
              top: -2px;
              right: 2px;
              font-size: 10px;
              color: #c62828;
            }
            
            .react-datepicker__day.blocked-date:hover {
              background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
              color: #c62828;
              transform: none;
              box-shadow: none;
            }
            
            /* Make blocked dates unselectable */
            .react-datepicker__day--disabled.blocked-date,
            .react-datepicker__day.blocked-date.react-datepicker__day--disabled,
            .react-datepicker__day--excluded.blocked-date {
              cursor: not-allowed !important;
              pointer-events: none !important;
            }
            
            /* Selected Date */
            .react-datepicker__day--selected.available-date,
            .react-datepicker__day--keyboard-selected.available-date {
              background: linear-gradient(135deg, ${formData.day_choice === "Saturday" ? "#009ef7" : "#f1416c"} 0%, ${formData.day_choice === "Saturday" ? "#0095e8" : "#e8285a"} 100%);
              color: white;
              border-color: ${formData.day_choice === "Saturday" ? "#009ef7" : "#f1416c"};
              transform: scale(1.1);
              box-shadow: 0 5px 20px ${formData.day_choice === "Saturday" ? "rgba(0, 158, 247, 0.5)" : "rgba(241, 65, 108, 0.5)"};
            }
            
            .react-datepicker__day--selected.available-date::after {
              color: white;
            }
            
            /* Disabled/Outside Month Days */
            .react-datepicker__day--disabled,
            .react-datepicker__day--outside-month {
              color: #b5b5c3;
              cursor: default;
            }
            
            .react-datepicker__day--disabled:hover,
            .react-datepicker__day--outside-month:hover {
              background-color: transparent;
              transform: none;
            }
            
            /* Today */
            .react-datepicker__day--today {
              font-weight: 700;
              border: 2px solid ${formData.day_choice === "Saturday" ? "#009ef7" : "#f1416c"};
            }
            
            /* Dropdowns */
            .react-datepicker__month-dropdown,
            .react-datepicker__year-dropdown {
              background-color: #fff;
              border: 2px solid #e4e6ef;
              border-radius: 0.475rem;
              box-shadow: 0 0 30px 0 rgba(82, 63, 105, 0.15);
            }
            
            .react-datepicker__month-option,
            .react-datepicker__year-option {
              padding: 0.5rem 1rem;
              transition: all 0.2s ease;
            }
            
            .react-datepicker__month-option:hover,
            .react-datepicker__year-option:hover {
              background-color: ${formData.day_choice === "Saturday" ? "#f1faff" : "#fff5f8"};
              color: ${formData.day_choice === "Saturday" ? "#009ef7" : "#f1416c"};
            }
            
            .react-datepicker__month-option--selected_month,
            .react-datepicker__year-option--selected_year {
              background-color: ${formData.day_choice === "Saturday" ? "#009ef7" : "#f1416c"};
              color: white;
            }
          `}</style>

          {/* Loading existing requests indicator */}
          {loadingRequests && (
            <div className="alert alert-info d-flex align-items-center mb-7">
              <span className="spinner-border spinner-border-sm me-3"></span>
              <span>Loading your existing requests...</span>
            </div>
          )}

          {/* Day Choice Selection */}
          <div className="mb-7">
            <label className="form-label fw-bold required d-flex align-items-center">
              <KTIcon iconName="calendar" className="fs-3 text-primary me-2" />
              Select Day
            </label>
            <div className="row g-3">
              <div className="col-md-6">
                <div
                  className={`card cursor-pointer h-100 ${
                    formData.day_choice === "Saturday"
                      ? "border-info border-2 bg-light-info"
                      : "border-gray-300"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, day_choice: "Saturday" })
                  }
                >
                  <div className="card-body text-center">
                    <KTIcon
                      iconName="calendar-8"
                      className={`fs-2x mb-3 ${
                        formData.day_choice === "Saturday"
                          ? "text-info"
                          : "text-muted"
                      }`}
                    />
                    <h5
                      className={
                        formData.day_choice === "Saturday"
                          ? "text-info"
                          : ""
                      }
                    >
                      📅 Saturday
                    </h5>
                    <small className="text-muted">Weekend leave</small>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div
                  className={`card cursor-pointer h-100 ${
                    formData.day_choice === "Sunday"
                      ? "border-danger border-2 bg-light-danger"
                      : "border-gray-300"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, day_choice: "Sunday" })
                  }
                >
                  <div className="card-body text-center">
                    <KTIcon
                      iconName="calendar"
                      className={`fs-2x mb-3 ${
                        formData.day_choice === "Sunday"
                          ? "text-danger"
                          : "text-muted"
                      }`}
                    />
                    <h5
                      className={
                        formData.day_choice === "Sunday"
                          ? "text-danger"
                          : ""
                      }
                    >
                      🗓️ Sunday
                    </h5>
                    <small className="text-muted">Weekend leave</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Show existing requests info for selected day */}
          {!loadingRequests && currentDayRequests.length > 0 && (
            <div className="alert alert-warning d-flex align-items-start mb-7">
              <KTIcon iconName="information-5" className="fs-2 me-3 mt-1" />
              <div className="flex-grow-1">
                <h5 className="mb-2">🔒 Active {formData.day_choice} Requests</h5>
                <p className="mb-2">
                  You have {currentDayRequests.length} active {formData.day_choice} request(s):
                </p>
                <div className="bg-light-warning p-3 rounded mb-3">
                  <ul className="mb-0">
                    {currentDayRequests.slice(0, 5).map((req, idx) => {
                      const reqDateStr =
                        typeof req.start_date_time === "string"
                          ? req.start_date_time.split("T")[0]
                          : new Date(req.start_date_time).toISOString().split("T")[0];
                      return (
                        <li key={idx} className="mb-1">
                          <strong>
                            {new Date(reqDateStr).toLocaleDateString()}
                          </strong>
                          {" - "}
                          <span className="text-muted">
                            {req.day_off_type}
                          </span>
                          <span
                            className={`badge ms-2 ${
                              req.status === "Pending"
                                ? "badge-light-warning"
                                : req.status === "Accepted"
                                ? "badge-light-success"
                                : "badge-light-danger"
                            }`}
                          >
                            {req.status}
                          </span>
                        </li>
                      );
                    })}
                    {currentDayRequests.length > 5 && (
                      <li className="text-muted">
                        + {currentDayRequests.length - 5} more...
                      </li>
                    )}
                  </ul>
                </div>
                <small className="text-muted">
                  <KTIcon iconName="shield-cross" className="fs-7 me-1" />
                  Blocked dates will appear with a red strikethrough
                </small>
              </div>
            </div>
          )}

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
                        <div className="fw-bold text-success">
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

          {/* Date Selection with Enhanced DatePicker */}
          <div className="mb-7">
            <label className="form-label fw-bold required d-flex align-items-center">
              <KTIcon iconName="calendar" className="fs-3 text-primary me-2" />
              Select {formData.day_choice}
            </label>
            
            <div className="position-relative">
              <DatePicker
                selected={formData.date}
                onChange={handleDateChange}
                filterDate={filterDate}
                excludeDates={excludedDatesArray}
                dayClassName={getDayClassName}
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText={`Select a ${formData.day_choice}`}
                className={`form-control form-control-lg ${dateError ? "is-invalid" : ""}`}
                disabled={loadingRequests}
                inline={false}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
              
              {/* Calendar icon indicator */}
              <div 
                className="position-absolute top-50 end-0 translate-middle-y pe-4" 
                style={{ pointerEvents: 'none' }}
              >
                <KTIcon 
                  iconName="calendar" 
                  className={`fs-2 text-${formData.day_choice === "Saturday" ? "info" : "danger"}`} 
                />
              </div>
            </div>
            
            {dateError ? (
              <div className="alert alert-danger d-flex align-items-start mt-3 py-3 px-4 border-2">
                <KTIcon iconName="cross-circle" className="fs-2 me-3 text-danger" />
                <div className="flex-grow-1">
                  <h6 className="mb-0 text-danger fw-bold">{dateError}</h6>
                </div>
              </div>
            ) : (
              <div className="form-text mt-2">
                <div className="d-flex align-items-start">
                  <KTIcon iconName="information-5" className="fs-7 me-2 mt-1" />
                  <div>
                    <div>Only {formData.day_choice}s are available for selection</div>
                    <div className="mt-1">
                      <span className="badge badge-light-success me-2">
                        <span className="text-success">●</span> Available
                      </span>
                      <span className="badge badge-light-danger me-2">
                        <span className="text-danger">●</span> Blocked (Cannot select)
                      </span>
                    </div>
                    <small className="text-muted mt-1 d-block">
                      Dates with Pending or Accepted requests cannot be selected
                    </small>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Day Off Type */}
          <div className="mb-7">
            <label className="form-label fw-bold required d-flex align-items-center">
              <KTIcon iconName="time" className="fs-3 text-primary me-2" />
              Leave Type
            </label>
            <div className="row g-3">
              <div className="col-md-6">
                <div
                  className={`card cursor-pointer h-100 ${
                    formData.day_off_type === "Full day"
                      ? "border-primary border-2 bg-light-primary"
                      : "border-gray-300"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, day_off_type: "Full day" })
                  }
                >
                  <div className="card-body text-center">
                    <KTIcon
                      iconName="calendar-8"
                      className={`fs-2x mb-3 ${
                        formData.day_off_type === "Full day"
                          ? "text-primary"
                          : "text-muted"
                      }`}
                    />
                    <h5
                      className={
                        formData.day_off_type === "Full day"
                          ? "text-primary"
                          : ""
                      }
                    >
                      Full Day
                    </h5>
                    <small className="text-muted">08:30 - 17:00</small>
                    <div className="mt-2">
                      <span className="badge badge-light-primary">1 day</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div
                  className={`card cursor-pointer h-100 ${
                    formData.day_off_type === "Half day"
                      ? "border-primary border-2 bg-light-primary"
                      : "border-gray-300"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, day_off_type: "Half day" })
                  }
                >
                  <div className="card-body text-center">
                    <KTIcon
                      iconName="time"
                      className={`fs-2x mb-3 ${
                        formData.day_off_type === "Half day"
                          ? "text-primary"
                          : "text-muted"
                      }`}
                    />
                    <h5
                      className={
                        formData.day_off_type === "Half day"
                          ? "text-primary"
                          : ""
                      }
                    >
                      Half Day
                    </h5>
                    <small className="text-muted">Morning or Afternoon</small>
                    <div className="mt-2">
                      <span className="badge badge-light-primary">0.5 day</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Half Day Period Selection */}
          {formData.day_off_type === "Half day" && (
            <div className="mb-7">
              <label className="form-label fw-bold required d-flex align-items-center">
                <KTIcon iconName="clock" className="fs-3 text-primary me-2" />
                Select Period
              </label>
              <div className="row g-3">
                <div className="col-md-6">
                  <div
                    className={`card cursor-pointer h-100 ${
                      formData.half_day_period === "morning"
                        ? "border-info border-2 bg-light-info"
                        : "border-gray-300"
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, half_day_period: "morning" })
                    }
                  >
                    <div className="card-body text-center">
                      <KTIcon
                        iconName="sun"
                        className={`fs-2x mb-3 ${
                          formData.half_day_period === "morning"
                            ? "text-info"
                            : "text-muted"
                        }`}
                      />
                      <h5
                        className={
                          formData.half_day_period === "morning"
                            ? "text-info"
                            : ""
                        }
                      >
                        Morning
                      </h5>
                      <small className="text-muted">08:30 - 12:00</small>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div
                    className={`card cursor-pointer h-100 ${
                      formData.half_day_period === "afternoon"
                        ? "border-warning border-2 bg-light-warning"
                        : "border-gray-300"
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, half_day_period: "afternoon" })
                    }
                  >
                    <div className="card-body text-center">
                      <KTIcon
                        iconName="moon"
                        className={`fs-2x mb-3 ${
                          formData.half_day_period === "afternoon"
                            ? "text-warning"
                            : "text-muted"
                        }`}
                      />
                      <h5
                        className={
                          formData.half_day_period === "afternoon"
                            ? "text-warning"
                            : ""
                        }
                      >
                        Afternoon
                      </h5>
                      <small className="text-muted">13:30 - 17:00</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-7">
            <label className="form-label fw-bold d-flex align-items-center">
              <KTIcon iconName="note-2" className="fs-3 text-primary me-2" />
              Description (Optional)
            </label>
            <textarea
              className="form-control form-control-lg"
              rows={3}
              placeholder={`Describe the reason for your ${formData.day_choice} leave (optional)`}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <div className="form-text">
              <KTIcon iconName="information-5" className="fs-7 me-1" />
              You can provide additional details about your leave request
            </div>
          </div>

          {/* Summary Card */}
          <div className={`alert alert-light-${config.color} d-flex align-items-start`}>
            <KTIcon iconName="information-2" className={`fs-2 me-3 mt-1 text-${config.color}`} />
            <div className="flex-grow-1">
              <h5 className="mb-3">Request Summary</h5>
              <div className="row g-3">
                <div className="col-6">
                  <small className="text-muted d-block">Day</small>
                  <strong>{config.emoji} {formData.day_choice}</strong>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Type</small>
                  <strong>
                    {formData.day_off_type}
                    {formData.day_off_type === "Half day" &&
                      ` (${formData.half_day_period})`}
                  </strong>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Date</small>
                  <strong>
                    {formData.date
                      ? formData.date.toLocaleDateString()
                      : "Not selected"}
                  </strong>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Leave Days</small>
                  <strong className={`text-${config.color}`}>
                    {formData.day_off_type === "Full day" ? "1.0" : "0.5"} day
                  </strong>
                </div>
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
            className={`btn btn-${config.color}`}
            disabled={
              loading ||
              matchingSupervisors.length === 0 ||
              loadingRequests ||
              !!dateError ||
              !formData.date
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

export default SaturdaySundayRequest;