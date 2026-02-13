import React, { useState, useEffect, useMemo } from "react";
import { KTIcon } from "../../../../../../_metronic/helpers";
import {
  createOTFieldWorkRequest,
  getOTFieldWorkRequestsByUser,
} from "../../_core/_requests";
import { useAuth } from "../../../../auth";
import { getUsers } from "../../../../apps/user-management/users-list/core/_requests";
import type { User } from "../../../../apps/user-management/users-list/core/_models";
import type { OTFieldWorkRequest } from "../../_core/_requests";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

interface OTFieldWorkProps {
  onClose: () => void;
  onSuccess?: () => void;
  type: "OT" | "FIELD_WORK";
}

const OtandFieldWork: React.FC<OTFieldWorkProps> = ({
  onClose,
  onSuccess,
  type,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [existingRequests, setExistingRequests] = useState<
    OTFieldWorkRequest[]
  >([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Error states for validation
  const [dateError, setDateError] = useState("");
  const [timeError, setTimeError] = useState("");

  const [formData, setFormData] = useState({
    date: null as Date | null,
    start_hour: "",
    end_hour: "",
    fuel: "",
    reason: "",
  });

  // Load existing OT/Field Work requests for the user
  useEffect(() => {
    const loadExistingRequests = async () => {
      if (!currentUser?._id) return;

      try {
        setLoadingRequests(true);
        console.log("📅 Loading existing OT/Field Work requests...");
        const response = await getOTFieldWorkRequestsByUser(currentUser._id);

        // Filter only Pending and Accept requests for the current type
        const activeRequests = (response.requests || []).filter(
          (req) =>
            (req.status === "Pending" || req.status === "Accepted") &&
            req.title === type,
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
  }, [currentUser?._id, type]);

  // Load supervisors
  useEffect(() => {
    const loadSupervisors = async () => {
      try {
        const response = await getUsers("");
        const supervisorUsers = (response.data || []).filter(
          (user: User) =>
            user.role === "supervisor" && user.status === "Active",
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
        supervisorDeptIds.includes(userDept),
      );
    });

    return matched;
  }, [supervisors, currentUser?.department_id]);

  // Get all blocked dates as Set for O(1) lookup
  const blockedDatesSet = useMemo(() => {
    const dates = new Set<string>();

    existingRequests.forEach((req) => {
      const dateStr =
        typeof req.date === "string"
          ? req.date.split("T")[0]
          : new Date(req.date).toISOString().split("T")[0];
      dates.add(dateStr);
    });

    return dates;
  }, [existingRequests]);

  // Convert blocked dates to Date objects for excludeDates prop
  const excludedDatesArray = useMemo(() => {
    const datesArray: Date[] = [];
    
    existingRequests.forEach((req) => {
      const dateObj = typeof req.date === "string"
        ? new Date(req.date)
        : new Date(req.date);
      datesArray.push(dateObj);
    });
    
    return datesArray;
  }, [existingRequests]);

  // Check if a date is blocked
  const isDateBlocked = (date: Date): boolean => {
    const dateStr = date.toISOString().split("T")[0];
    return blockedDatesSet.has(dateStr);
  };

  // Find which request is blocking a specific date
  const getBlockingRequest = (date: Date): OTFieldWorkRequest | null => {
    const dateStr = date.toISOString().split("T")[0];
    
    for (const req of existingRequests) {
      const reqDateStr =
        typeof req.date === "string"
          ? req.date.split("T")[0]
          : new Date(req.date).toISOString().split("T")[0];

      if (reqDateStr === dateStr) {
        return req;
      }
    }
    return null;
  };

  // Validate time range
  const validateTimeRange = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) {
      return ""; // Don't show error if fields are empty
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return "❌ Invalid time format. Please use HH:mm format (e.g., 08:00)";
    }

    // Validate end time is after start time
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      return "❌ End time must be later than start time";
    }

    return ""; // No error
  };

  // Calculate duration in hours
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    return (endMinutes - startMinutes) / 60;
  };

  // Get min date (today)
  const minDate = new Date();

  // Config based on type
  const config =
    type === "OT"
      ? {
          title: "Overtime Request",
          icon: "timer",
          showFuel: false,
          titleLabel: "OT",
          color: "danger",
          emoji: "⏰",
        }
      : {
          title: "Field Work Request",
          icon: "geolocation",
          showFuel: true,
          titleLabel: "FIELD_WORK",
          color: "primary",
          emoji: "🚗",
        };

  // Handle date change with validation
  const handleDateChange = (date: Date | null) => {
    if (!date) {
      setFormData({ ...formData, date: null });
      setDateError("");
      return;
    }

    // Check if date is blocked
    if (isDateBlocked(date)) {
      const blockingReq = getBlockingRequest(date);
      const errorMsg = `❌ This date is not available. You already have a ${blockingReq?.status || "pending/approved"} ${type} request on ${date.toLocaleDateString()}.`;
      setDateError(errorMsg);
      setFormData({ ...formData, date: null });
      return;
    }

    // Date is valid
    setDateError("");
    setFormData({ ...formData, date });
  };

  // Handle time change with validation
  const handleTimeChange = (
    field: "start_hour" | "end_hour",
    value: string,
  ) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Validate time range if both times are filled
    if (newFormData.start_hour && newFormData.end_hour) {
      const error = validateTimeRange(
        newFormData.start_hour,
        newFormData.end_hour,
      );
      setTimeError(error);
    } else {
      setTimeError("");
    }
  };

  // Custom day class name for styling
  const getDayClassName = (date: Date): string => {
    if (isDateBlocked(date)) {
      return "blocked-date";
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

    if (!formData.date || !formData.start_hour || !formData.end_hour || !formData.reason) {
      MySwal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in all required fields including reason.",
        confirmButtonColor: "#ffc107",
      });
      return;
    }

    // Check for errors before submitting
    if (dateError) {
      MySwal.fire({
        icon: "error",
        title: "Invalid Date",
        text: "Please fix the date error before submitting.",
        confirmButtonColor: "#f1416c",
      });
      return;
    }

    if (timeError) {
      MySwal.fire({
        icon: "error",
        title: "Invalid Time",
        text: "Please fix the time error before submitting.",
        confirmButtonColor: "#f1416c",
      });
      return;
    }

    if (type === "FIELD_WORK" && !formData.fuel) {
      MySwal.fire({
        icon: "warning",
        title: "Fuel Cost Required",
        text: "Please enter fuel cost for field work.",
        confirmButtonColor: "#ffc107",
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
            <p class="mb-2">This date (<strong>${formData.date.toLocaleDateString()}</strong>) already has a <strong>${blockingReq?.status || "pending/approved"}</strong> ${type} request.</p>
            <p class="mb-0 text-muted">Please select a different date.</p>
          </div>
        `,
        confirmButtonColor: "#f1416c",
        confirmButtonText: "Choose Another Date",
      });
      return;
    }

    // Validate fuel price for field work
    let fuelPrice = 0;
    if (type === "FIELD_WORK") {
      fuelPrice = Number(formData.fuel);
      if (isNaN(fuelPrice) || fuelPrice <= 0) {
        MySwal.fire({
          icon: "error",
          title: "Invalid Fuel Cost",
          text: "Fuel price must be a valid positive number.",
          confirmButtonColor: "#f1416c",
        });
        return;
      }
    }

    try {
      setLoading(true);

      const supervisorIds = matchingSupervisors.map((s) => s.id || s.id);

      const requestData = {
        user_id: currentUser._id,
        supervisor_id: supervisorIds,
        date: formData.date.toISOString().split('T')[0],
        title: config.titleLabel as "OT" | "FIELD_WORK",
        start_hour: formData.start_hour,
        end_hour: formData.end_hour,
        fuel: type === "FIELD_WORK" ? fuelPrice : undefined,
        reason: formData.reason,
      };

      console.log("📤 Sending data:", requestData);

      const response = await createOTFieldWorkRequest(requestData);

      console.log("✅ Response:", response);

      const duration = calculateDuration(formData.start_hour, formData.end_hour);

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
                  <i class="bi bi-clock text-${config.color} me-2"></i>Time Period
                </div>
                <div class="text-gray-600">${formData.start_hour} - ${formData.end_hour}</div>
              </div>
            </div>
            
            <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
              <div class="flex-grow-1">
                <div class="fw-bold text-gray-800 mb-1">
                  <i class="bi bi-hourglass-split text-${config.color} me-2"></i>Duration
                </div>
                <div class="text-gray-600">${duration.toFixed(1)} hours</div>
              </div>
            </div>
            
            ${type === "FIELD_WORK" ? `
              <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
                <div class="flex-grow-1">
                  <div class="fw-bold text-gray-800 mb-1">
                    <i class="bi bi-fuel-pump text-${config.color} me-2"></i>Fuel Cost
                  </div>
                  <div class="text-gray-600">${fuelPrice.toLocaleString()} LAK</div>
                </div>
              </div>
            ` : ''}
            
            <div class="alert alert-light-${config.color} mt-3">
              <i class="bi bi-info-circle text-${config.color} me-2"></i>
              <span class="text-${config.color}">Your request has been sent to supervisors for approval.</span>
            </div>
          </div>
        `,
        confirmButtonColor: type === "OT" ? "#f1416c" : "#009ef7",
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
        text: error.message || `Failed to submit ${config.title.toLowerCase()}. Please try again.`,
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
          <KTIcon iconName={config.icon} className={`fs-2 text-${config.color} me-2`} />
          {config.emoji} {config.title}
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
              background-color: ${type === "OT" ? "#fff5f8" : "#f1faff"};
              border-bottom: 2px solid #e4e6ef;
              border-radius: 0.95rem 0.95rem 0 0;
              padding: 1rem 0;
            }
            
            .react-datepicker__current-month {
              color: ${type === "OT" ? "#f1416c" : "#009ef7"};
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
              background-color: ${type === "OT" ? "#fff5f8" : "#e8f5fc"};
              border-radius: 0.475rem;
            }
            
            .react-datepicker__navigation:hover {
              background-color: ${type === "OT" ? "#f1416c" : "#009ef7"};
            }
            
            .react-datepicker__navigation-icon::before {
              border-color: ${type === "OT" ? "#f1416c" : "#009ef7"};
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
            
            /* Blocked/Excluded Dates */
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
            
            /* Selected Date */
            .react-datepicker__day--selected,
            .react-datepicker__day--keyboard-selected {
              background: linear-gradient(135deg, ${type === "OT" ? "#f1416c" : "#009ef7"} 0%, ${type === "OT" ? "#e8285a" : "#0095e8"} 100%);
              color: white;
              border-color: ${type === "OT" ? "#f1416c" : "#009ef7"};
              transform: scale(1.1);
              box-shadow: 0 5px 20px ${type === "OT" ? "rgba(241, 65, 108, 0.5)" : "rgba(0, 158, 247, 0.5)"};
            }
            
            /* Today */
            .react-datepicker__day--today {
              font-weight: 700;
              border: 2px solid ${type === "OT" ? "#f1416c" : "#009ef7"};
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
              background-color: ${type === "OT" ? "#fff5f8" : "#f1faff"};
              color: ${type === "OT" ? "#f1416c" : "#009ef7"};
            }
            
            .react-datepicker__month-option--selected_month,
            .react-datepicker__year-option--selected_year {
              background-color: ${type === "OT" ? "#f1416c" : "#009ef7"};
              color: white;
            }
          `}</style>

          {/* Loading existing requests indicator */}
          {loadingRequests && (
            <div className="alert alert-info d-flex align-items-center mb-7">
              <span className="spinner-border spinner-border-sm me-3"></span>
              <span>Loading your existing {type} requests...</span>
            </div>
          )}

          {/* Show existing requests info */}
          {!loadingRequests && existingRequests.length > 0 && (
            <div className="alert alert-warning d-flex align-items-start mb-7">
              <KTIcon iconName="information-5" className="fs-2 me-3 mt-1" />
              <div className="flex-grow-1">
                <h5 className="mb-2">🔒 Active {type} Requests</h5>
                <p className="mb-2">
                  You have {existingRequests.length} active {type} request(s):
                </p>
                <div className="bg-light-warning p-3 rounded mb-3">
                  <ul className="mb-0">
                    {existingRequests.slice(0, 5).map((req, idx) => {
                      const reqDateStr =
                        typeof req.date === "string"
                          ? req.date.split("T")[0]
                          : new Date(req.date).toISOString().split("T")[0];
                      return (
                        <li key={idx} className="mb-1">
                          <strong>
                            {new Date(reqDateStr).toLocaleDateString()}
                          </strong>
                          {" - "}
                          <span className="text-muted">
                            {req.start_hour} to {req.end_hour}
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
                    {existingRequests.length > 5 && (
                      <li className="text-muted">
                        + {existingRequests.length - 5} more...
                      </li>
                    )}
                  </ul>
                </div>
                <small className="text-muted">
                  <KTIcon iconName="shield-cross" className="fs-7 me-1" />
                  Blocked dates cannot be selected
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

          {/* Date with DatePicker */}
          <div className="mb-7">
            <label className="form-label fw-bold required d-flex align-items-center">
              <KTIcon iconName="calendar" className="fs-3 text-primary me-2" />
              Work Date
            </label>
            
            <div className="position-relative">
              <DatePicker
                selected={formData.date}
                onChange={handleDateChange}
                excludeDates={excludedDatesArray}
                dayClassName={getDayClassName}
                minDate={minDate}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select work date"
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
                  className={`fs-2 text-${config.color}`} 
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
                <KTIcon iconName="information-5" className="fs-7 me-1" />
                Select the date for {type === "OT" ? "overtime" : "field work"}
              </div>
            )}
          </div>

          {/* Time Selection */}
          <div className="mb-7">
            <div className="row">
              {/* Start Hour */}
              <div className="col-md-6 mb-4 mb-md-0">
                <label className="form-label fw-bold required d-flex align-items-center">
                  <KTIcon iconName="time" className="fs-3 text-primary me-2" />
                  Start Time
                </label>
                <input
                  type="time"
                  className={`form-control form-control-lg ${timeError ? "is-invalid" : ""}`}
                  value={formData.start_hour}
                  onChange={(e) =>
                    handleTimeChange("start_hour", e.target.value)
                  }
                  required
                />
              </div>

              {/* End Hour */}
              <div className="col-md-6">
                <label className="form-label fw-bold required d-flex align-items-center">
                  <KTIcon iconName="time" className="fs-3 text-primary me-2" />
                  End Time
                </label>
                <input
                  type="time"
                  className={`form-control form-control-lg ${timeError ? "is-invalid" : ""}`}
                  value={formData.end_hour}
                  onChange={(e) => handleTimeChange("end_hour", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Time Error/Info Message */}
            {timeError ? (
              <div className="alert alert-danger d-flex align-items-start mt-3 py-3 px-4 border-2">
                <KTIcon iconName="cross-circle" className="fs-2 me-3 text-danger" />
                <div className="flex-grow-1">
                  <h6 className="mb-0 text-danger fw-bold">{timeError}</h6>
                </div>
              </div>
            ) : formData.start_hour && formData.end_hour ? (
              <div className="alert alert-light-primary d-flex align-items-center mt-3">
                <KTIcon iconName="timer" className="fs-2 me-3 text-primary" />
                <div>
                  <strong>Duration: </strong>
                  {calculateDuration(formData.start_hour, formData.end_hour).toFixed(1)} hours
                </div>
              </div>
            ) : (
              <div className="form-text mt-2">
                <KTIcon iconName="information-5" className="fs-7 me-1" />
                End time must be later than start time (Format: HH:mm)
              </div>
            )}
          </div>

          {/* Fuel Price - Only for Field Work */}
          {config.showFuel && (
            <div className="mb-7">
              <label className="form-label fw-bold required d-flex align-items-center">
                <KTIcon iconName="oil" className="fs-3 text-primary me-2" />
                Fuel Cost (LAK)
              </label>
              <div className="input-group input-group-lg">
                <span className="input-group-text">
                  <KTIcon iconName="oil" className="fs-3" />
                </span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter fuel cost"
                  value={formData.fuel}
                  onChange={(e) =>
                    setFormData({ ...formData, fuel: e.target.value })
                  }
                  min="1"
                  step="0.01"
                  required
                />
                <span className="input-group-text">LAK</span>
              </div>
              <div className="form-text">
                <KTIcon iconName="information-5" className="fs-7 me-1" />
                Enter the total fuel cost for this field work
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="mb-7">
            <label className="form-label fw-bold required d-flex align-items-center">
              <KTIcon iconName="note-2" className="fs-3 text-primary me-2" />
              {type === "OT" ? "Reason (Required)" : "Purpose and Location"}
            </label>
            <textarea
              className="form-control form-control-lg"
              rows={4}
              placeholder={
                type === "OT"
                  ? "Describe the reason for overtime"
                  : "Describe the purpose and location of field work"
              }
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              required
            />
          </div>

          {/* Summary Card */}
          <div className={`alert alert-light-${config.color} d-flex align-items-start`}>
            <KTIcon iconName="information-2" className={`fs-2 me-3 mt-1 text-${config.color}`} />
            <div className="flex-grow-1">
              <h5 className="mb-3">Request Summary</h5>
              <div className="row g-3">
                <div className="col-6">
                  <small className="text-muted d-block">Date</small>
                  <strong>
                    {formData.date
                      ? formData.date.toLocaleDateString()
                      : "Not selected"}
                  </strong>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Time</small>
                  <strong>
                    {formData.start_hour && formData.end_hour
                      ? `${formData.start_hour} - ${formData.end_hour}`
                      : "Not selected"}
                  </strong>
                </div>
                {formData.start_hour && formData.end_hour && (
                  <div className="col-6">
                    <small className="text-muted d-block">Duration</small>
                    <strong className={`text-${config.color}`}>
                      {calculateDuration(formData.start_hour, formData.end_hour).toFixed(1)} hours
                    </strong>
                  </div>
                )}
                {type === "FIELD_WORK" && formData.fuel && (
                  <div className="col-6">
                    <small className="text-muted d-block">Fuel Cost</small>
                    <strong className="text-primary">
                      {Number(formData.fuel).toLocaleString()} LAK
                    </strong>
                  </div>
                )}
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
              !!timeError ||
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

export default OtandFieldWork;