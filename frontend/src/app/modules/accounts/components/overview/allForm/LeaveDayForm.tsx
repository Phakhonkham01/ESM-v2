import React, { useState, useEffect, useMemo } from "react";
import { KTIcon } from "../../../../../../_metronic/helpers";
import { createDayOffRequest, getDayOffRequestsByUser } from "../../_core/_requests";
import { useAuth } from "../../../../auth";
import { getUsers } from "../../../../apps/user-management/users-list/core/_requests";
import type { User } from "../../../../apps/user-management/users-list/core/_models";
import type { DayOffRequest } from "../../_core/_requests";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

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

  // ✅ Detect dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode on mount
    const checkDarkMode = () => {
      const htmlElement = document.documentElement;
      const bodyElement = document.body;
      const isDark = 
        htmlElement.getAttribute('data-bs-theme') === 'dark' ||
        htmlElement.getAttribute('data-theme') === 'dark' ||
        bodyElement.getAttribute('data-bs-theme') === 'dark' ||
        bodyElement.classList.contains('dark') ||
        htmlElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-bs-theme', 'data-theme', 'class'],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-bs-theme', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  // Error states for date validation
  const [dateErrors, setDateErrors] = useState({
    start_date: "",
    end_date: "",
  });

  const [formData, setFormData] = useState({
    day_off_type: "FULL_DAY" as "FULL_DAY" | "HALF_DAY",
    start_date: null as Date | null,
    end_date: null as Date | null,
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

  // ✅ Get min date (first day of current month)
  const minDate = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDay.setHours(0, 0, 0, 0);
    return firstDay;
  }, []);

  // ✅ Get max date (last day of current month)
  const maxDate = useMemo(() => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);
    return lastDay;
  }, []);

  // ✅ Get current month info
  const currentMonthName = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  // ✅ Get date range text
  const dateRangeText = useMemo(() => {
    const firstDay = new Date(minDate);
    const lastDay = new Date(maxDate);
    return `${firstDay.getDate()}-${lastDay.getDate()} ${firstDay.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  }, [minDate, maxDate]);

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

  // Convert blocked dates to Date objects array for DatePicker
  const excludedDatesArray = useMemo(() => {
    const datesArray: Date[] = [];
    blockedDatesSet.forEach(dateStr => {
      datesArray.push(new Date(dateStr));
    });
    return datesArray;
  }, [blockedDatesSet]);

  // Check if a date is blocked
  const isDateBlocked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDatesSet.has(dateStr);
  };

  // Find which request is blocking a specific date
  const getBlockingRequest = (date: Date): DayOffRequest | null => {
    const dateStr = date.toISOString().split('T')[0];
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
  const hasOverlappingRequest = (startDate: Date, endDate: Date): { hasOverlap: boolean; conflictingDates: string[] } => {
    const conflictingDates: string[] = [];
    
    // Check each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
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
  
  // Calculate total days
 // Calculate total days (excluding weekends)
const calculateTotalDays = () => {
  if (formData.day_off_type === "FULL_DAY") {
    if (!formData.start_date || !formData.end_date) return 0;
    
    // Count only weekdays (Monday-Friday)
    let count = 0;
    const currentDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  } else {
    return 0.5;
  }
};

  const totalDays = calculateTotalDays();

  // Get datetime strings for Full Day
  const getDateTimeForFullDay = (date: Date, isStart: boolean) => {
    const d = new Date(date);
    if (isStart) {
      d.setHours(0, 0, 0, 0);
    } else {
      d.setHours(23, 59, 59, 999);
    }
    return d.toISOString();
  };

  // Get datetime strings for Half Day
  const getDateTimeForHalfDay = (date: Date, period: 'MORNING' | 'AFTERNOON') => {
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
      MySwal.fire({
        icon: "error",
        title: "User Not Found",
        text: "Unable to identify the current user. Please try logging in again.",
        confirmButtonColor: "#50cd89",
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

    if (!formData.start_date || !formData.title) {
      MySwal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in all required fields",
        confirmButtonColor: "#ffc107",
      });
      return;
    }

    if (formData.day_off_type === "FULL_DAY" && !formData.end_date) {
      MySwal.fire({
        icon: "warning",
        title: "Missing End Date",
        text: "Please select end date for full day leave",
        confirmButtonColor: "#ffc107",
      });
      return;
    }

    // Check for errors before submitting
    if (dateErrors.start_date || dateErrors.end_date) {
      MySwal.fire({
        icon: "error",
        title: "Invalid Dates",
        text: "Please fix date errors before submitting",
        confirmButtonColor: "#f1416c",
      });
      return;
    }

    // Final validation for overlapping requests
    if (formData.day_off_type === "FULL_DAY" && formData.start_date && formData.end_date) {
      const overlap = hasOverlappingRequest(formData.start_date, formData.end_date);
      if (overlap.hasOverlap) {
        MySwal.fire({
          icon: "error",
          title: "Cannot Create Request",
          html: `
            <div class="text-start">
              <p class="mb-2">You already have pending or approved leave on the following dates:</p>
              <div class="bg-light-danger p-3 rounded mb-3">
                <ul class="mb-0">
                  ${overlap.conflictingDates.map(date => `<li>${date}</li>`).join('')}
                </ul>
              </div>
              <p class="mb-0 text-muted">Please choose different dates.</p>
            </div>
          `,
          confirmButtonColor: "#f1416c",
          confirmButtonText: "Choose Different Dates",
        });
        return;
      }
    } else if (formData.day_off_type === "HALF_DAY" && formData.start_date) {
      // For half day, just check the single date
      if (isDateBlocked(formData.start_date)) {
        MySwal.fire({
          icon: "error",
          title: "Cannot Create Request",
          html: `
            <div class="text-start">
              <p class="mb-2">You already have a pending or approved leave on <strong>${formData.start_date.toLocaleDateString()}</strong>.</p>
              <p class="mb-0 text-muted">Please choose a different date.</p>
            </div>
          `,
          confirmButtonColor: "#f1416c",
          confirmButtonText: "Choose Different Date",
        });
        return;
      }
    }

    try {
      setLoading(true);

      let startDateTime: string;
      let endDateTime: string;

      if (formData.day_off_type === "FULL_DAY" && formData.start_date && formData.end_date) {
        startDateTime = getDateTimeForFullDay(formData.start_date, true);
        endDateTime = getDateTimeForFullDay(formData.end_date, false);
      } else if (formData.day_off_type === "HALF_DAY" && formData.start_date) {
        const halfDayTimes = getDateTimeForHalfDay(
          formData.start_date,
          formData.half_day_period,
        );
        startDateTime = halfDayTimes.start;
        endDateTime = halfDayTimes.end;
      } else {
        throw new Error("Invalid date selection");
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

      await MySwal.fire({
        icon: "success",
        title: "🎉 Leave Request Submitted!",
        html: `
          <div class="text-start">
            <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
              <div class="flex-grow-1">
                <div class="fw-bold text-gray-800 mb-1">
                  <i class="bi bi-calendar3 text-success me-2"></i>Leave Period
                </div>
                <div class="text-gray-600">
                  ${formData.day_off_type === "FULL_DAY" && formData.start_date && formData.end_date
                    ? `${formData.start_date.toLocaleDateString()} - ${formData.end_date.toLocaleDateString()}`
                    : formData.start_date
                      ? `${formData.start_date.toLocaleDateString()} (${formData.half_day_period})`
                      : "N/A"
                  }
                </div>
              </div>
            </div>
            
            <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
              <div class="flex-grow-1">
                <div class="fw-bold text-gray-800 mb-1">
                  <i class="bi bi-hourglass-split text-success me-2"></i>Total Days
                </div>
                <div class="text-gray-600">${totalDays.toFixed(1)} day${totalDays !== 1 ? 's' : ''}</div>
              </div>
            </div>
            
            <div class="alert alert-light-success mt-3">
              <i class="bi bi-info-circle text-success me-2"></i>
              <span class="text-success">Your request has been sent to supervisors for approval.</span>
            </div>
          </div>
        `,
        confirmButtonColor: "#50cd89",
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
        text: error.message || "Failed to submit leave request. Please try again.",
        confirmButtonColor: "#f1416c",
        footer: '<a href="#" class="text-muted">Need help? Contact HR</a>',
      });
    } finally {
      setLoading(false);
    }
  };

  // Custom date input with inline error validation
  const handleStartDateChange = (date: Date | null) => {
    if (!date) {
      setFormData({ ...formData, start_date: null });
      setDateErrors({ ...dateErrors, start_date: "" });
      return;
    }

    // Check if date is blocked
    if (isDateBlocked(date)) {
      const blockingReq = getBlockingRequest(date);
      const errorMsg = `❌ This date is not available. You have a ${blockingReq?.status || 'pending/approved'} leave request on this date.`;
      setDateErrors({ ...dateErrors, start_date: errorMsg });
      setFormData({ ...formData, start_date: null });
      return;
    }

    // Date is valid
    setDateErrors({ ...dateErrors, start_date: "" });
    setFormData({ ...formData, start_date: date });
  };

  const handleEndDateChange = (date: Date | null) => {
    if (!date) {
      setFormData({ ...formData, end_date: null });
      setDateErrors({ ...dateErrors, end_date: "" });
      return;
    }

    if (!formData.start_date) {
      setDateErrors({ ...dateErrors, end_date: "Please select start date first" });
      return;
    }

    // Check if date is blocked
    if (isDateBlocked(date)) {
      const blockingReq = getBlockingRequest(date);
      const errorMsg = `❌ This date is not available. You have a ${blockingReq?.status || 'pending/approved'} leave request on this date.`;
      setDateErrors({ ...dateErrors, end_date: errorMsg });
      setFormData({ ...formData, end_date: null });
      return;
    }

    // Check if range has any blocked dates
    const overlap = hasOverlappingRequest(formData.start_date, date);
    if (overlap.hasOverlap) {
      const errorMsg = `❌ Date range contains blocked dates: ${overlap.conflictingDates.slice(0, 3).join(', ')}${overlap.conflictingDates.length > 3 ? '...' : ''}`;
      setDateErrors({ ...dateErrors, end_date: errorMsg });
      setFormData({ ...formData, end_date: null });
      return;
    }

    // Date is valid
    setDateErrors({ ...dateErrors, end_date: "" });
    setFormData({ ...formData, end_date: date });
  };

  // Custom day class name for styling
  const getDayClassName = (date: Date): string => {
    if (isDateBlocked(date)) {
      return "blocked-date";
    }
    return "";
  };

  // ✅ Add CSS with dark mode support
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      /* ========== DATEPICKER CONTAINER ========== */
      .react-datepicker-wrapper {
        width: 100%;
      }
      
      .react-datepicker-popper {
        z-index: 9999 !important;
      }
      
      .react-datepicker {
        font-family: inherit;
        background-color: ${isDarkMode ? '#1e1e2d' : '#ffffff'};
        border: 1px solid ${isDarkMode ? '#323248' : '#e4e6ef'};
        border-radius: 12px;
        box-shadow: 0 10px 40px ${isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'};
        padding: 8px;
      }
      
      /* ========== HEADER ========== */
      .react-datepicker__header {
        background-color: transparent;
        border-bottom: none;
        padding: 16px 8px 8px;
      }
      
      .react-datepicker__current-month {
        color: ${isDarkMode ? '#ffffff' : '#181c32'};
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 16px;
        text-align: center;
      }
      
      .react-datepicker__day-names {
        display: flex;
        justify-content: space-around;
        margin-bottom: 8px;
      }
      
      .react-datepicker__day-name {
        color: ${isDarkMode ? '#7e8299' : '#a1a5b7'};
        font-weight: 600;
        font-size: 13px;
        width: 40px;
        line-height: 40px;
        margin: 0;
        text-transform: uppercase;
      }
      
      /* ========== NAVIGATION ARROWS ========== */
      .react-datepicker__navigation {
        top: 20px;
        width: 32px;
        height: 32px;
        border: none;
        background-color: ${isDarkMode ? '#2b2b40' : '#f5f8fa'};
        border-radius: 8px;
        transition: all 0.2s ease;
      }
      
      .react-datepicker__navigation:hover {
        background-color: #50cd89;
      }
      
      .react-datepicker__navigation--previous {
        left: 16px;
      }
      
      .react-datepicker__navigation--next {
        right: 16px;
      }
      
      .react-datepicker__navigation-icon::before {
        border-color: ${isDarkMode ? '#a1a5b7' : '#7e8299'};
        border-width: 2px 2px 0 0;
        height: 8px;
        width: 8px;
        top: 11px;
      }
      
      .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
        border-color: #ffffff;
      }
      
      /* ========== MONTH CONTAINER ========== */
      .react-datepicker__month {
        margin: 8px;
      }
      
      .react-datepicker__week {
        display: flex;
        justify-content: space-around;
      }
      
      /* ========== DAY CELLS ========== */
      .react-datepicker__day {
        width: 40px;
        height: 40px;
        line-height: 40px;
        margin: 2px;
        border-radius: 8px;
        color: ${isDarkMode ? '#ffffff' : '#3f4254'};
        font-weight: 500;
        font-size: 14px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      
      .react-datepicker__day:hover:not(.react-datepicker__day--disabled):not(.react-datepicker__day--excluded) {
        background-color: ${isDarkMode ? '#2b2b40' : '#f5f8fa'};
        transform: scale(1.05);
      }
      
      /* ========== BLOCKED/EXCLUDED DATES ========== */
      .react-datepicker__day--excluded,
      .react-datepicker__day.blocked-date {
        background: ${isDarkMode 
          ? 'linear-gradient(135deg, #3d1f1f 0%, #4d2626 100%)' 
          : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)'} !important;
        color: ${isDarkMode ? '#ff6b6b' : '#c62828'} !important;
        font-weight: 700 !important;
        text-decoration: line-through !important;
        cursor: not-allowed !important;
        border: 2px solid ${isDarkMode ? '#9c4146' : '#ef9a9a'} !important;
        position: relative;
        pointer-events: none !important;
        opacity: 0.7;
      }
      
      .react-datepicker__day--excluded::before,
      .react-datepicker__day.blocked-date::before {
        content: '✕';
        position: absolute;
        top: 2px;
        right: 4px;
        font-size: 10px;
        font-weight: 900;
        color: ${isDarkMode ? '#ff6b6b' : '#c62828'};
      }
      
      /* ========== SELECTED DATE ========== */
      .react-datepicker__day--selected,
      .react-datepicker__day--keyboard-selected {
        background: linear-gradient(135deg, #50cd89, #47be7d) !important;
        color: #ffffff !important;
        font-weight: 700;
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(80, 205, 137, 0.4);
        border: none !important;
      }
      
      /* ========== IN RANGE ========== */
      .react-datepicker__day--in-range {
        background-color: ${isDarkMode ? 'rgba(80, 205, 137, 0.15)' : '#e8fff3'} !important;
        color: ${isDarkMode ? '#66bb6a' : '#50cd89'} !important;
      }
      
      .react-datepicker__day--in-selecting-range {
        background-color: ${isDarkMode ? 'rgba(80, 205, 137, 0.1)' : '#e8fff3'};
      }
      
      /* ========== TODAY ========== */
      .react-datepicker__day--today {
        font-weight: 700;
        position: relative;
        color: #50cd89;
      }
      
      .react-datepicker__day--today::after {
        content: '';
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: #50cd89;
      }
      
      /* ========== DISABLED/OUTSIDE MONTH ========== */
      .react-datepicker__day--disabled,
      .react-datepicker__day--outside-month {
        color: ${isDarkMode ? '#565674' : '#b5b5c3'} !important;
        cursor: default !important;
        opacity: 0.4;
      }
      
      .react-datepicker__day--disabled:hover,
      .react-datepicker__day--outside-month:hover {
        background-color: transparent !important;
        transform: none !important;
      }
      
      /* ========== DROPDOWNS ========== */
      .react-datepicker__month-dropdown,
      .react-datepicker__year-dropdown {
        background-color: ${isDarkMode ? '#1e1e2d' : '#ffffff'};
        border: 1px solid ${isDarkMode ? '#323248' : '#e4e6ef'};
        border-radius: 8px;
        box-shadow: 0 8px 24px ${isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'};
        padding: 4px;
      }
      
      .react-datepicker__month-option,
      .react-datepicker__year-option {
        padding: 8px 16px;
        transition: all 0.2s ease;
        border-radius: 6px;
        color: ${isDarkMode ? '#a1a5b7' : '#3f4254'};
        font-size: 14px;
      }
      
      .react-datepicker__month-option:hover,
      .react-datepicker__year-option:hover {
        background-color: ${isDarkMode ? '#2b2b40' : '#f5f8fa'};
        color: #50cd89;
      }
      
      .react-datepicker__month-option--selected_month,
      .react-datepicker__year-option--selected_year {
        background: linear-gradient(135deg, #50cd89, #47be7d) !important;
        color: #ffffff !important;
        font-weight: 600;
      }
      
      /* ========== WEEKEND STYLING ========== */
      .react-datepicker__day--weekend {
        color: ${isDarkMode ? '#ff9f43' : '#ff6b6b'};
      }
      
      /* ========== RESPONSIVE ========== */
      @media (max-width: 768px) {
        .react-datepicker {
          font-size: 0.9em;
        }
        
        .react-datepicker__day,
        .react-datepicker__day-name {
          width: 36px;
          height: 36px;
          line-height: 36px;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [isDarkMode]);

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <h3 className="card-title">
          <KTIcon iconName="calendar" className="fs-2 text-success me-2" />
          📅 Leave Day Request
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

          {/* ✅ Date Restriction Info */}
          <div className="alert alert-light-info d-flex align-items-center mb-4">
            <KTIcon iconName="calendar-tick" className="fs-2 me-3 text-info" />
            <div className="flex-grow-1">
              <div className="d-flex align-items-center justify-content-between">
                <small className="fw-bold text-info">
                  📅 Available dates: {dateRangeText}
                </small>
                <span className="badge badge-light-info">Current Month</span>
              </div>
              <small className="text-muted d-block mt-1">
                You can request leave for any date within this month
              </small>
            </div>
          </div>

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
                  Blocked dates cannot be selected
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
                      ? "border-success bg-light-success"
                      : "border-gray-300"
                  }`}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      day_off_type: "FULL_DAY",
                      end_date: null,
                    })
                  }
                  style={{ transition: "all 0.3s ease" }}
                >
                  <div className="card-body text-center py-5">
                    <KTIcon
                      iconName="calendar"
                      className={`fs-2x mb-3 ${formData.day_off_type === "FULL_DAY" ? "text-success" : "text-gray-600"}`}
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
                      ? "border-success bg-light-success"
                      : "border-gray-300"
                  }`}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      day_off_type: "HALF_DAY",
                      end_date: null,
                    })
                  }
                  style={{ transition: "all 0.3s ease" }}
                >
                  <div className="card-body text-center py-5">
                    <KTIcon
                      iconName="time"
                      className={`fs-2x mb-3 ${formData.day_off_type === "HALF_DAY" ? "text-success" : "text-gray-600"}`}
                    />
                    <h4 className="fw-bold mb-2">Half Day</h4>
                    <p className="text-muted mb-0 fs-7">Take specific period</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Date Selection with DatePicker */}
          {formData.day_off_type === "FULL_DAY" ? (
            <div className="row mb-7">
              {/* Start Date */}
              <div className="col-md-6 mb-7 mb-md-0">
                <label className="form-label fw-bold required d-flex align-items-center">
                  <KTIcon
                    iconName="calendar"
                    className="fs-3 text-success me-2"
                  />
                  Start Date
                </label>
                <div className="position-relative">
                  <DatePicker
                    selected={formData.start_date}
                    onChange={handleStartDateChange}
                    excludeDates={excludedDatesArray}
                    dayClassName={getDayClassName}
                    minDate={minDate}
                    maxDate={maxDate}
                    selectsStart
                    startDate={formData.start_date}
                    endDate={formData.end_date}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select start date"
                    className={`form-control form-control-lg ${dateErrors.start_date ? "is-invalid" : ""}`}
                    disabled={loadingRequests}
                    inline={false}
                    showMonthDropdown={true}
                    showYearDropdown={true}
                  />
                  <div 
                    className="position-absolute top-50 end-0 translate-middle-y pe-4" 
                    style={{ pointerEvents: 'none' }}
                  >
                    <KTIcon iconName="calendar" className="fs-2 text-success" />
                  </div>
                </div>
                {dateErrors.start_date ? (
                  <div className="alert alert-danger d-flex align-items-start mt-3 py-3 px-4 border-2">
                    <KTIcon iconName="cross-circle" className="fs-2 me-3 text-danger" />
                    <div className="flex-grow-1">
                      <h6 className="mb-0 text-danger fw-bold">{dateErrors.start_date}</h6>
                    </div>
                  </div>
                ) : (
                  <div className="form-text mt-2">
                    <KTIcon iconName="information-5" className="fs-7 me-1" />
                    Select start date in {currentMonthName}
                  </div>
                )}
              </div>

              {/* End Date */}
              <div className="col-md-6">
                <label className="form-label fw-bold required d-flex align-items-center">
                  <KTIcon
                    iconName="calendar"
                    className="fs-3 text-success me-2"
                  />
                  End Date
                </label>
                <div className="position-relative">
                  <DatePicker
                    selected={formData.end_date}
                    onChange={handleEndDateChange}
                    excludeDates={excludedDatesArray}
                    dayClassName={getDayClassName}
                    minDate={formData.start_date || minDate}
                    maxDate={maxDate}
                    selectsEnd
                    startDate={formData.start_date}
                    endDate={formData.end_date}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select end date"
                    className={`form-control form-control-lg ${dateErrors.end_date ? "is-invalid" : ""}`}
                    disabled={loadingRequests || !formData.start_date}
                    inline={false}
                    showMonthDropdown={true}
                    showYearDropdown={true}
                  />
                  <div 
                    className="position-absolute top-50 end-0 translate-middle-y pe-4" 
                    style={{ pointerEvents: 'none' }}
                  >
                    <KTIcon iconName="calendar" className="fs-2 text-success" />
                  </div>
                </div>
                {dateErrors.end_date ? (
                  <div className="alert alert-danger d-flex align-items-start mt-3 py-3 px-4 border-2">
                    <KTIcon iconName="cross-circle" className="fs-2 me-3 text-danger" />
                    <div className="flex-grow-1">
                      <h6 className="mb-0 text-danger fw-bold">{dateErrors.end_date}</h6>
                    </div>
                  </div>
                ) : (
                  <div className="form-text mt-2">
                    <KTIcon iconName="information-5" className="fs-7 me-1" />
                    End date must be in {currentMonthName}
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
                    className="fs-3 text-success me-2"
                  />
                  Leave Date
                </label>
                <div className="position-relative">
                  <DatePicker
                    selected={formData.start_date}
                    onChange={handleStartDateChange}
                    excludeDates={excludedDatesArray}
                    dayClassName={getDayClassName}
                    minDate={minDate}
                    maxDate={maxDate}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select leave date"
                    className={`form-control form-control-lg ${dateErrors.start_date ? "is-invalid" : ""}`}
                    disabled={loadingRequests}
                    inline={false}
                    showMonthDropdown={false}
                    showYearDropdown={false}
                  />
                  <div 
                    className="position-absolute top-50 end-0 translate-middle-y pe-4" 
                    style={{ pointerEvents: 'none' }}
                  >
                    <KTIcon iconName="calendar" className="fs-2 text-success" />
                  </div>
                </div>
                {dateErrors.start_date ? (
                  <div className="alert alert-danger d-flex align-items-start mt-3 py-3 px-4 border-2">
                    <KTIcon iconName="cross-circle" className="fs-2 me-3 text-danger" />
                    <div className="flex-grow-1">
                      <h6 className="mb-0 text-danger fw-bold">{dateErrors.start_date}</h6>
                    </div>
                  </div>
                ) : (
                  <div className="form-text mt-2">
                    <KTIcon iconName="information-5" className="fs-7 me-1" />
                    Select date in {currentMonthName}
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
          <div className="alert alert-light-success d-flex align-items-center p-5 mb-0">
            <div className="d-flex flex-column flex-grow-1">
              <h4 className="mb-1 fw-bold">Total Leave Days</h4>
              <div className="text-gray-700">
                {formData.day_off_type === "FULL_DAY" &&
                formData.start_date &&
                formData.end_date
                  ? `${formData.start_date.toLocaleDateString()} to ${formData.end_date.toLocaleDateString()}`
                  : formData.day_off_type === "HALF_DAY" && formData.start_date
                    ? `${formData.start_date.toLocaleDateString()} (${formData.half_day_period === "MORNING" ? "MORNING" : "AFTERNOON"})`
                    : "Please select date"}
              </div>
            </div>
            <div className="text-end">
              <h1 className="fw-bold text-success mb-0">
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