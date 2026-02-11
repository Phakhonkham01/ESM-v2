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
    date: "",
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

  // Check if a date string (YYYY-MM-DD) is blocked
  const isDateBlocked = (dateStr: string): boolean => {
    return blockedDatesSet.has(dateStr);
  };

  // Find which request is blocking a specific date
  const getBlockingRequest = (dateStr: string): OTFieldWorkRequest | null => {
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

  // Get min date (today)
  const minDate = useMemo(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }, []);

  // Config based on type
  const config =
    type === "OT"
      ? {
        title: "Overtime Request",
        icon: "timer",
        showFuel: false,
        titleLabel: "OT",
        color: "danger",
      }
      : {
        title: "Field Work Request",
        icon: "geolocation",
        showFuel: true,
        titleLabel: "FIELD_WORK",
        color: "primary",
      };

  // Handle date change with validation
  const handleDateChange = (value: string) => {
    if (!value) {
      setFormData({ ...formData, date: value });
      setDateError("");
      return;
    }

    // Check if date is blocked
    if (isDateBlocked(value)) {
      const blockingReq = getBlockingRequest(value);
      const errorMsg = `❌ This date is not available. You already have a ${blockingReq?.status || "pending/approved"} ${type} request on ${new Date(value).toLocaleDateString()}.`;
      setDateError(errorMsg);
      setFormData({ ...formData, date: value });
      return;
    }

    // Date is valid
    setDateError("");
    setFormData({ ...formData, date: value });
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

    if (
      !formData.date ||
      !formData.start_hour ||
      !formData.end_hour ||
      !formData.reason
    ) {
      alert("Please fill in all required fields including reason");
      return;
    }

    // Check for errors before submitting
    if (dateError) {
      alert("Please fix the date error before submitting");
      return;
    }

    if (timeError) {
      alert("Please fix the time error before submitting");
      return;
    }

    if (type === "FIELD_WORK" && !formData.fuel) {
      alert("Please enter fuel cost");
      return;
    }

    // Validate fuel price for field work
    let fuelPrice = 0;
    if (type === "FIELD_WORK") {
      fuelPrice = Number(formData.fuel);
      if (isNaN(fuelPrice) || fuelPrice <= 0) {
        alert("Fuel price must be a valid positive number");
        return;
      }
    }

    try {
      setLoading(true);

      const supervisorIds = matchingSupervisors.map((s) => s.id || s.id);

      const requestData = {
        user_id: currentUser._id,
        supervisor_id: supervisorIds,
        date: formData.date,
        title: config.titleLabel as "OT" | "FIELD_WORK",
        start_hour: formData.start_hour,
        end_hour: formData.end_hour,
        fuel: type === "FIELD_WORK" ? fuelPrice : undefined,
        reason: formData.reason,
      };

      console.log("📤 Sending data:", requestData);

      const response = await createOTFieldWorkRequest(requestData);

      console.log("✅ Response:", response);

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("❌ Error:", error);
      alert(error.message || `Failed to submit ${config.title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <h3 className="card-title">
          <KTIcon iconName={config.icon} className="fs-2 text-primary me-2" />
          {config.title}
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
              <span>Loading your existing {type} requests...</span>
            </div>
          )}

          {/* Show existing requests info */}
          {/* {!loadingRequests && existingRequests.length > 0 && (
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
                            className={`badge ms-2 ${req.status === "Pending" || "Accepted" ? "badge-light-warning" : "badge-light-success"}`}
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

          {/* Date */}
          <div className="mb-7">
            <label className="form-label fw-bold required d-flex align-items-center">
              <KTIcon iconName="calendar" className="fs-3 text-primary me-2" />
              Work Date
            </label>
            <input
              type="date"
              className={`form-control form-control-lg ${dateError ? "is-invalid" : ""}`}
              value={formData.date}
              onChange={(e) => handleDateChange(e.target.value)}
              min={minDate}
              required
              disabled={loadingRequests}
            />
            {dateError ? (
              <div className="invalid-feedback d-block">
                <KTIcon iconName="cross-circle" className="fs-7 me-1" />
                {dateError}
              </div>
            ) : (
              <div className="form-text">
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

            {/* Time Error Message - Shows below both time inputs */}
            {timeError ? (
              <div className="invalid-feedback d-block mt-2">
                <KTIcon iconName="cross-circle" className="fs-7 me-1" />
                {timeError}
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
              !!timeError
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