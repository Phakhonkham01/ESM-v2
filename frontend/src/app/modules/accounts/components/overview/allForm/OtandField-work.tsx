import React, { useState, useEffect, useMemo } from "react";
import { KTIcon } from "../../../../../../_metronic/helpers";
import {
  createOTFieldWorkRequest,
  getOTFieldWorkRequestsByUser,
} from "../../_core/_requests";
import { useAuth } from "../../../../auth";
import { getUsers } from "../../../../apps/user-management/users-list/core/_requests";
import type { User } from "../../../../apps/user-management/users-list/core/_models";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Select from "react-select";

const MySwal = withReactContent(Swal);

// Extend the User type to include employee_id
interface ExtendedUser extends User {
  employee_id?: string;
  nickname_en?: string;
}

// Define the interface for OT/Field Work request
interface OTFieldWorkRequest {
  _id?: string;
  user_id: string | { _id: string };
  supervisor_id: string | string[] | { _id: string }[];
  employee_id?: string | string[] | { _id: string }[];
  date: string | Date;
  title: "OT" | "FIELD_WORK";
  start_hour: string;
  end_hour: string;
  fuel?: number;
  distance?: number;
  reason: string;
  status: "Pending" | "Accepted" | "Rejected";
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define the response interface
interface OTFieldWorkResponse {
  success?: boolean;
  requests?: OTFieldWorkRequest[];
  message?: string;
  data?: OTFieldWorkRequest[];
}

interface OTFieldWorkProps {
  onClose: () => void;
  onSuccess?: () => void;
  type: "OT" | "FIELD_WORK";
}

// Define option type for react-select
interface UserOption {
  value: string;
  label: string;
  user: ExtendedUser;
}

const OtandFieldWork: React.FC<OTFieldWorkProps> = ({
  onClose,
  onSuccess,
  type,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [supervisors, setSupervisors] = useState<ExtendedUser[]>([]);
  const [allUsers, setAllUsers] = useState<ExtendedUser[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<UserOption[]>([]);
  const [existingRequests, setExistingRequests] = useState<
    OTFieldWorkRequest[]
  >([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Detect dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode on mount
    const checkDarkMode = () => {
      const htmlElement = document.documentElement;
      const bodyElement = document.body;
      const isDark =
        htmlElement.getAttribute("data-bs-theme") === "dark" ||
        htmlElement.getAttribute("data-theme") === "dark" ||
        bodyElement.getAttribute("data-bs-theme") === "dark" ||
        bodyElement.classList.contains("dark") ||
        htmlElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-bs-theme", "data-theme", "class"],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-bs-theme", "class"],
    });

    return () => observer.disconnect();
  }, []);

  // Error states for validation
  const [dateError, setDateError] = useState("");
  const [timeError, setTimeError] = useState("");

  const [formData, setFormData] = useState({
    date: null as Date | null,
    start_hour: "",
    end_hour: "",
    distance: "", // ✅ เปลี่ยนจาก fuel เป็น distance
    fuel: "", // ✅ fuel จะถูกคำนวณอัตโนมัติ
    reason: "",
  });

  // Load existing OT/Field Work requests for the user
  useEffect(() => {
    const loadExistingRequests = async () => {
      if (!currentUser?._id) return;

      try {
        setLoadingRequests(true);
        console.log("📅 Loading existing OT/Field Work requests...");
        const response = (await getOTFieldWorkRequestsByUser(
          currentUser._id,
        )) as OTFieldWorkResponse;

        console.log("📥 Response from API:", response);

        // Handle different response structures
        let requests: OTFieldWorkRequest[] = [];

        if (response && response.requests && Array.isArray(response.requests)) {
          requests = response.requests;
        } else if (response && response.data && Array.isArray(response.data)) {
          requests = response.data;
        } else if (Array.isArray(response)) {
          requests = response;
        } else if (response && typeof response === "object") {
          const possibleArrayProps = Object.values(response).filter((val) =>
            Array.isArray(val),
          );
          if (possibleArrayProps.length > 0) {
            requests = possibleArrayProps[0] as OTFieldWorkRequest[];
          }
        }

        // Filter only Pending and Accept requests for the current type
        const activeRequests = requests.filter(
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

  // Load all users for employee selection
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const response = await getUsers("");
        // Filter out current user and get only active users
        const otherUsers = (response.data || []).filter(
          (user: ExtendedUser) =>
            user.id !== currentUser?._id && user.status === "Active",
        );
        setAllUsers(otherUsers);
      } catch (error) {
        console.error("Error loading users:", error);
        setAllUsers([]);
      }
    };

    if (type === "FIELD_WORK") {
      loadAllUsers();
    }
  }, [currentUser?._id, type]);

  // Load supervisors
  useEffect(() => {
    const loadSupervisors = async () => {
      try {
        const response = await getUsers("");
        const supervisorUsers = (response.data || []).filter(
          (user: ExtendedUser) =>
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
    if (!id) return "";
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
      ? currentUser.department_id.map(extractId).filter(Boolean)
      : [extractId(currentUser.department_id)].filter(Boolean);

    const matched = supervisors.filter((s) => {
      const supervisorDeptIds = Array.isArray(s.department_id)
        ? s.department_id.map(extractId).filter(Boolean)
        : [extractId(s.department_id)].filter(Boolean);

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
      if (req.date) {
        const dateStr =
          typeof req.date === "string"
            ? req.date.split("T")[0]
            : new Date(req.date).toISOString().split("T")[0];
        dates.add(dateStr);
      }
    });

    return dates;
  }, [existingRequests]);

  // Convert blocked dates to Date objects for excludeDates prop
  const excludedDatesArray = useMemo(() => {
    const datesArray: Date[] = [];

    existingRequests.forEach((req) => {
      if (req.date) {
        const dateObj =
          typeof req.date === "string"
            ? new Date(req.date)
            : new Date(req.date);
        datesArray.push(dateObj);
      }
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
      if (!req.date) continue;

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

  // ✅ Validate time range และรองรับการทำงานข้ามวัน
  const validateTimeRange = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) {
      return ""; // Don't show error if fields are empty
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return "❌ Invalid time format. Please use HH:mm format (e.g., 08:00)";
    }

    // ไม่ต้อง validate ว่า end time ต้องมากกว่า start time
    // เพราะอาจจะทำงานข้ามวัน
    return ""; // No error
  };

  // ✅ คำนวณระยะเวลาและรองรับการทำงานข้ามวัน
  const calculateDuration = (
    startTime: string,
    endTime: string,
  ): { hours: number; isNextDay: boolean } => {
    if (!startTime || !endTime) return { hours: 0, isNextDay: false };

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    let totalMinutes = 0;
    let isNextDay = false;

    if (endMinutes <= startMinutes) {
      // ทำงานข้ามวัน (เช่น 22:00 - 02:00)
      totalMinutes = 24 * 60 - startMinutes + endMinutes;
      isNextDay = true;
    } else {
      // ทำงานในวันเดียวกัน
      totalMinutes = endMinutes - startMinutes;
      isNextDay = false;
    }

    return {
      hours: totalMinutes / 60,
      isNextDay: isNextDay,
    };
  };

  // ✅ Helper function สำหรับแสดงวันที่สิ้นสุด
  const getEndDate = (startDate: Date | null, isNextDay: boolean): string => {
    if (!startDate) return "Not selected";

    if (isNextDay) {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      return endDate.toLocaleDateString();
    }

    return startDate.toLocaleDateString();
  };

  // ✅ คำนวณค่าน้ำมันจากระยะทาง (distance * 3000)
  const calculateFuelCost = (distance: string): number => {
    const distanceValue = Number(distance);
    if (isNaN(distanceValue) || distanceValue <= 0) return 0;
    return distanceValue * 3000;
  };

  // Get min date (today)
 // แก้ไข minDate ให้เป็นวันที่ 1 ของเดือนปัจจุบันแทนวันนี้

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

// ✅ Get first day of current month for reference
const firstDayOfMonth = useMemo(() => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}, []);

// ✅ Get current month name
const currentMonthName = useMemo(() => {
  return firstDayOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}, [firstDayOfMonth]);

// ✅ Get date range text for display
const dateRangeText = useMemo(() => {
  const lastDay = new Date(maxDate);
  return `${firstDayOfMonth.getDate()}-${lastDay.getDate()} ${firstDayOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
}, [firstDayOfMonth, maxDate]);

  // Config based on type
  const config =
    type === "OT"
      ? {
          title: "Overtime Request",
          icon: "timer",
          showDistance: false,
          showFuel: false,
          showEmployeeSelection: false,
          titleLabel: "OT" as const,
          color: "danger",
          emoji: "⏰",
        }
      : {
          title: "Field Work Request",
          icon: "geolocation",
          showDistance: true,
          showFuel: true,
          showEmployeeSelection: true,
          titleLabel: "FIELD_WORK" as const,
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

  // ✅ Handle distance change with auto-calculation of fuel cost
  const handleDistanceChange = (value: string) => {
    const newDistance = value;
    const newFuel = calculateFuelCost(newDistance).toFixed(2);

    setFormData({
      ...formData,
      distance: newDistance,
      fuel: newFuel,
    });
  };

  // Handle employee selection change
  const handleEmployeeChange = (selected: any) => {
    setSelectedEmployees(selected || []);
  };

  // Custom day class name for styling
  const getDayClassName = (date: Date): string => {
    if (isDateBlocked(date)) {
      return "blocked-date";
    }
    return "";
  };

  // Prepare user options for react-select
  const userOptions: UserOption[] = useMemo(() => {
    return allUsers.map((user) => {
      // Safely access properties with fallbacks
      const firstName = user.first_name_en || "";
      const lastName = user.last_name_en || "";
      const nickname = (user as any).nickname_en || "";
      const employeeId = (user as any).employee_id || "";

      const namePart = `${firstName} ${lastName}`.trim();
      const nicknamePart = nickname ? ` (${nickname})` : "";
      const idPart = employeeId ? ` - ${employeeId}` : "";

      return {
        value: user.id || user.id || "",
        label: `${namePart}${nicknamePart}${idPart}`,
        user: user,
      };
    });
  }, [allUsers]);

  // React-select styles with dark mode support
  const selectStyles = useMemo(
    () => ({
      control: (base: any, state: any) => ({
        ...base,
        minHeight: "46px",
        backgroundColor: isDarkMode ? "#1e1e2d" : "white",
        borderColor: isDarkMode ? "#323248" : "#e4e6ef",
        color: isDarkMode ? "#a1a5b7" : "#181c32",
        "&:hover": {
          borderColor: "#009ef7",
        },
        boxShadow: state.isFocused
          ? isDarkMode
            ? "0 0 0 1px #009ef7"
            : "0 0 0 1px #009ef7"
          : "none",
      }),
      menu: (base: any) => ({
        ...base,
        backgroundColor: isDarkMode ? "#1e1e2d" : "white",
        border: isDarkMode ? "1px solid #323248" : "1px solid #e4e6ef",
        boxShadow: isDarkMode
          ? "0 0 50px 0 rgba(82, 63, 105, 0.15)"
          : "0 0 50px 0 rgba(82, 63, 105, 0.15)",
      }),
      menuList: (base: any) => ({
        ...base,
        padding: "8px",
      }),
      option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
          ? "#009ef7"
          : state.isFocused
            ? isDarkMode
              ? "#2b2b40"
              : "#f1faff"
            : "transparent",
        color: state.isSelected ? "white" : isDarkMode ? "#a1a5b7" : "#181c32",
        borderRadius: "6px",
        margin: "2px 0",
        cursor: "pointer",
        "&:active": {
          backgroundColor: "#009ef7",
        },
      }),
      multiValue: (base: any) => ({
        ...base,
        backgroundColor: isDarkMode ? "#2b2b40" : "#f1faff",
        borderRadius: "4px",
      }),
      multiValueLabel: (base: any) => ({
        ...base,
        color: isDarkMode ? "#009ef7" : "#009ef7",
        fontWeight: "500",
      }),
      multiValueRemove: (base: any) => ({
        ...base,
        color: isDarkMode ? "#009ef7" : "#009ef7",
        "&:hover": {
          backgroundColor: "#009ef7",
          color: "white",
          borderRadius: "0 4px 4px 0",
        },
      }),
      placeholder: (base: any) => ({
        ...base,
        color: isDarkMode ? "#565674" : "#a1a5b7",
      }),
      singleValue: (base: any) => ({
        ...base,
        color: isDarkMode ? "#a1a5b7" : "#181c32",
      }),
      input: (base: any) => ({
        ...base,
        color: isDarkMode ? "#a1a5b7" : "#181c32",
      }),
      indicatorSeparator: (base: any) => ({
        ...base,
        backgroundColor: isDarkMode ? "#323248" : "#e4e6ef",
      }),
      dropdownIndicator: (base: any) => ({
        ...base,
        color: isDarkMode ? "#565674" : "#a1a5b7",
        "&:hover": {
          color: "#009ef7",
        },
      }),
      clearIndicator: (base: any) => ({
        ...base,
        color: isDarkMode ? "#565674" : "#a1a5b7",
        "&:hover": {
          color: "#f1416c",
        },
      }),
    }),
    [isDarkMode],
  );

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

    if (
      !formData.date ||
      !formData.start_hour ||
      !formData.end_hour ||
      !formData.reason
    ) {
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

    // ✅ Validate distance for field work
    if (type === "FIELD_WORK" && !formData.distance) {
      MySwal.fire({
        icon: "warning",
        title: "Distance Required",
        text: "Please enter distance for field work.",
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

    // ✅ Validate distance for field work
    let distanceValue = 0;
    let fuelCost = 0;

    if (type === "FIELD_WORK") {
      distanceValue = Number(formData.distance);
      if (isNaN(distanceValue) || distanceValue <= 0) {
        MySwal.fire({
          icon: "error",
          title: "Invalid Distance",
          text: "Distance must be a valid positive number.",
          confirmButtonColor: "#f1416c",
        });
        return;
      }

      // Calculate fuel cost from distance
      fuelCost = calculateFuelCost(formData.distance);
    }

    try {
      setLoading(true);

      // Get supervisor IDs - handle both string and object formats
      const supervisorIds = matchingSupervisors
        .map((s) => s.id || s.id)
        .filter(Boolean);

      // Get employee IDs from selected employees
      const employeeIds = selectedEmployees
        .map((emp) => emp.value)
        .filter(Boolean);

      const requestData = {
        user_id: currentUser._id,
        supervisor_id: supervisorIds,
        employee_id:
          type === "FIELD_WORK" && employeeIds.length > 0
            ? employeeIds
            : undefined,
        date: formData.date.toISOString().split("T")[0],
        title: config.titleLabel,
        start_hour: formData.start_hour,
        end_hour: formData.end_hour,
        distance: type === "FIELD_WORK" ? distanceValue : undefined, // ✅ ส่ง distance
        reason: formData.reason,
      };

      console.log("📤 Sending data:", requestData);

      const response = await createOTFieldWorkRequest(requestData);

      console.log("✅ Response:", response);

      const { hours, isNextDay } = calculateDuration(
        formData.start_hour,
        formData.end_hour,
      );

      // Create employee names string for success message
      const employeeNames = selectedEmployees
        .map((emp) => emp.label.split(" - ")[0])
        .join(", ");

      // คำนวณวันที่สิ้นสุด
      const endDateStr = isNextDay
        ? new Date(
            new Date(formData.date).setDate(
              new Date(formData.date).getDate() + 1,
            ),
          ).toLocaleDateString()
        : formData.date.toLocaleDateString();

      await MySwal.fire({
        icon: "success",
        title: `${config.emoji} Request Submitted Successfully!`,
        html: `
          <div class="text-start">
            <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
              <div class="flex-grow-1">
                <div class="fw-bold text-gray-800 mb-1">
                  <i class="bi bi-calendar3 text-${config.color} me-2"></i>Start Date
                </div>
                <div class="text-gray-600">${formData.date.toLocaleDateString()}</div>
              </div>
            </div>
            
            ${
              isNextDay
                ? `
              <div class="d-flex align-items-center mb-3 p-3 bg-light-warning rounded">
                <div class="flex-grow-1">
                  <div class="fw-bold text-gray-800 mb-1">
                    <i class="bi bi-calendar-check text-warning me-2"></i>End Date
                  </div>
                  <div class="text-gray-600">
                    ${endDateStr}
                    <span class="badge badge-light-warning ms-2">Next Day</span>
                  </div>
                </div>
              </div>
            `
                : ""
            }
            
            <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
              <div class="flex-grow-1">
                <div class="fw-bold text-gray-800 mb-1">
                  <i class="bi bi-clock text-${config.color} me-2"></i>Time Period
                </div>
                <div class="text-gray-600">
                  ${formData.start_hour} - ${formData.end_hour}
                  ${isNextDay ? '<span class="badge badge-light-warning ms-2">Overnight</span>' : ""}
                </div>
              </div>
            </div>
            
            <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
              <div class="flex-grow-1">
                <div class="fw-bold text-gray-800 mb-1">
                  <i class="bi bi-hourglass-split text-${config.color} me-2"></i>Duration
                </div>
                <div class="text-gray-600">${hours.toFixed(1)} hours</div>
              </div>
            </div>
            
            ${
              type === "FIELD_WORK"
                ? `
              <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
                <div class="flex-grow-1">
                  <div class="fw-bold text-gray-800 mb-1">
                    <i class="bi bi-signpost-split text-${config.color} me-2"></i>Distance
                  </div>
                  <div class="text-gray-600">${distanceValue.toFixed(2)} km</div>
                </div>
              </div>
              
              <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
                <div class="flex-grow-1">
                  <div class="fw-bold text-gray-800 mb-1">
                    <i class="bi bi-fuel-pump text-${config.color} me-2"></i>Fuel Cost
                  </div>
                  <div class="text-gray-600">${fuelCost.toLocaleString()} LAK</div>
                </div>
              </div>
              
              ${
                selectedEmployees.length > 0
                  ? `
                <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
                  <div class="flex-grow-1">
                    <div class="fw-bold text-gray-800 mb-1">
                      <i class="bi bi-people text-${config.color} me-2"></i>Team Members
                    </div>
                    <div class="text-gray-600">${employeeNames}</div>
                  </div>
                </div>
              `
                  : ""
              }
            `
                : ""
            }
            
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
        text:
          error?.message ||
          error?.response?.data?.message ||
          `Failed to submit ${config.title.toLowerCase()}. Please try again.`,
        confirmButtonColor: "#f1416c",
        footer: '<a href="#" class="text-muted">Need help? Contact HR</a>',
      });
    } finally {
      setLoading(false);
    }
  };

  // Add CSS for blocked dates and datepicker
  useEffect(() => {
    const style = document.createElement("style");
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
        background-color: ${isDarkMode ? "#1e1e2d" : "#ffffff"};
        border: 1px solid ${isDarkMode ? "#323248" : "#e4e6ef"};
        border-radius: 12px;
        box-shadow: 0 10px 40px ${isDarkMode ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.1)"};
        padding: 8px;
      }
      
      /* ========== HEADER ========== */
      .react-datepicker__header {
        background-color: transparent;
        border-bottom: none;
        padding: 16px 8px 8px;
      }
      
      .react-datepicker__current-month {
        color: ${isDarkMode ? "#ffffff" : "#181c32"};
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
        color: ${isDarkMode ? "#7e8299" : "#a1a5b7"};
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
        background-color: ${isDarkMode ? "#2b2b40" : "#f5f8fa"};
        border-radius: 8px;
        transition: all 0.2s ease;
      }
      
      .react-datepicker__navigation:hover {
        background-color: ${type === "OT" ? "#f1416c" : "#009ef7"};
      }
      
      .react-datepicker__navigation--previous {
        left: 16px;
      }
      
      .react-datepicker__navigation--next {
        right: 16px;
      }
      
      .react-datepicker__navigation-icon::before {
        border-color: ${isDarkMode ? "#a1a5b7" : "#7e8299"};
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
        color: ${isDarkMode ? "#ffffff" : "#3f4254"};
        font-weight: 500;
        font-size: 14px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      
      .react-datepicker__day:hover:not(.react-datepicker__day--disabled):not(.react-datepicker__day--excluded) {
        background-color: ${isDarkMode ? "#2b2b40" : "#f5f8fa"};
        transform: scale(1.05);
      }
      
      /* ========== TODAY ========== */
      .react-datepicker__day--today {
        font-weight: 700;
        position: relative;
        color: ${type === "OT" ? "#f1416c" : "#009ef7"};
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
        background-color: ${type === "OT" ? "#f1416c" : "#009ef7"};
      }
      
      /* ========== SELECTED DATE ========== */
      .react-datepicker__day--selected,
      .react-datepicker__day--keyboard-selected {
        background: linear-gradient(135deg, ${type === "OT" ? "#f1416c" : "#009ef7"}, ${type === "OT" ? "#d63455" : "#0784c3"}) !important;
        color: #ffffff !important;
        font-weight: 700;
        transform: scale(1.1);
        box-shadow: 0 4px 12px ${type === "OT" ? "rgba(241, 65, 108, 0.4)" : "rgba(0, 158, 247, 0.4)"};
        border: none !important;
      }
      
      .react-datepicker__day--selected:hover,
      .react-datepicker__day--keyboard-selected:hover {
        background: linear-gradient(135deg, ${type === "OT" ? "#d63455" : "#0784c3"}, ${type === "OT" ? "#c02746" : "#006ba1"}) !important;
      }
      
      /* ========== BLOCKED/EXCLUDED DATES ========== */
      .react-datepicker__day--excluded,
      .react-datepicker__day.blocked-date {
        background: ${isDarkMode ? "linear-gradient(135deg, #3d1f1f 0%, #4d2626 100%)" : "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)"} !important;
        color: ${isDarkMode ? "#ff6b6b" : "#c62828"} !important;
        font-weight: 700 !important;
        text-decoration: line-through !important;
        cursor: not-allowed !important;
        border: 2px solid ${isDarkMode ? "#9c4146" : "#ef9a9a"} !important;
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
        color: ${isDarkMode ? "#ff6b6b" : "#c62828"};
      }
      
      /* ========== DISABLED/OUTSIDE MONTH ========== */
      .react-datepicker__day--disabled,
      .react-datepicker__day--outside-month {
        color: ${isDarkMode ? "#565674" : "#b5b5c3"} !important;
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
        background-color: ${isDarkMode ? "#1e1e2d" : "#ffffff"};
        border: 1px solid ${isDarkMode ? "#323248" : "#e4e6ef"};
        border-radius: 8px;
        box-shadow: 0 8px 24px ${isDarkMode ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.1)"};
        padding: 4px;
      }
      
      .react-datepicker__month-option,
      .react-datepicker__year-option {
        padding: 8px 16px;
        transition: all 0.2s ease;
        border-radius: 6px;
        color: ${isDarkMode ? "#a1a5b7" : "#3f4254"};
        font-size: 14px;
      }
      
      .react-datepicker__month-option:hover,
      .react-datepicker__year-option:hover {
        background-color: ${isDarkMode ? "#2b2b40" : "#f5f8fa"};
        color: ${type === "OT" ? "#f1416c" : "#009ef7"};
      }
      
      .react-datepicker__month-option--selected_month,
      .react-datepicker__year-option--selected_year {
        background: linear-gradient(135deg, ${type === "OT" ? "#f1416c" : "#009ef7"}, ${type === "OT" ? "#d63455" : "#0784c3"}) !important;
        color: #ffffff !important;
        font-weight: 600;
      }
      
      /* ========== WEEKEND STYLING (Optional) ========== */
      .react-datepicker__day--weekend {
        color: ${isDarkMode ? "#ff9f43" : "#ff6b6b"};
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
  }, [type, isDarkMode]);

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <h3 className="card-title">
          <KTIcon
            iconName={config.icon}
            className={`fs-2 text-${config.color} me-2`}
          />
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
                      const reqDateStr = req.date
                        ? typeof req.date === "string"
                          ? req.date.split("T")[0]
                          : new Date(req.date).toISOString().split("T")[0]
                        : "";
                      return (
                        <li key={idx} className="mb-1">
                          <strong>
                            {reqDateStr
                              ? new Date(reqDateStr).toLocaleDateString()
                              : "Unknown date"}
                          </strong>
                          {" - "}
                          <span className="text-muted">
                            {req.start_hour || "??"} to {req.end_hour || "??"}
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
                            {req.status || "Unknown"}
                          </span>
                          {req.distance && type === "FIELD_WORK" && (
                            <span className="badge badge-light-info ms-2">
                              {req.distance.toFixed(2)} km
                            </span>
                          )}
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
            <KTIcon iconName="user" className="fs-2 me-3 mt-1" />
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
                maxDate={maxDate} 
                dateFormat="dd/MM/yyyy"
                placeholderText="Select work date"
                className={`form-control form-control-lg ${dateError ? "is-invalid" : ""}`}
                disabled={loadingRequests}
                showMonthDropdown={false} 
                showYearDropdown={false} 
                popperClassName="datepicker-popper"
              />

              {/* Calendar icon indicator */}
              <div
                className="position-absolute top-50 end-0 translate-middle-y pe-4"
                style={{ pointerEvents: "none" }}
              >
                <KTIcon
                  iconName="calendar"
                  className={`fs-2 text-${config.color}`}
                />
              </div>
            </div>

            {dateError ? (
              <div className="alert alert-danger d-flex align-items-start mt-3 py-3 px-4 border-2">
                <KTIcon
                  iconName="cross-circle"
                  className="fs-2 me-3 text-danger"
                />
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

            {/* ✅ Time Error/Info Message with Overnight Support */}
            {timeError ? (
              <div className="alert alert-danger d-flex align-items-start mt-3 py-3 px-4 border-2">
                <KTIcon
                  iconName="cross-circle"
                  className="fs-2 me-3 text-danger"
                />
                <div className="flex-grow-1">
                  <h6 className="mb-0 text-danger fw-bold">{timeError}</h6>
                </div>
              </div>
            ) : formData.start_hour && formData.end_hour ? (
              (() => {
                const { hours, isNextDay } = calculateDuration(
                  formData.start_hour,
                  formData.end_hour,
                );
                return (
                  <div
                    className={`alert ${isNextDay ? "alert-light-warning" : "alert-light-primary"} d-flex align-items-start mt-3`}
                  >
                    <KTIcon
                      iconName="timer"
                      className={`fs-2 me-3 ${isNextDay ? "text-warning" : "text-primary"}`}
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-2">
                        <strong>Duration: </strong>
                        <span className="ms-2">{hours.toFixed(1)} hours</span>
                      </div>
                      {isNextDay && (
                        <div className="d-flex align-items-center">
                          <KTIcon
                            iconName="information-5"
                            className="fs-7 me-2 text-warning"
                          />
                          <small className="text-warning fw-bold">
                            ⚠️ Work continues to next day (
                            {formData.date
                              ? getEndDate(formData.date, true)
                              : ""}
                            )
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="form-text mt-2">
                <KTIcon iconName="information-5" className="fs-7 me-1" />
                Select start and end time (Format: HH:mm). System supports
                overnight work.
              </div>
            )}
          </div>

          {/* ✅ Distance - Only for Field Work (ตัวหลักที่ user กรอก) */}
          {config.showDistance && (
            <div className="mb-7">
              <label className="form-label fw-bold required d-flex align-items-center">
                <KTIcon
                  iconName="signpost-split"
                  className="fs-3 text-primary me-2"
                />
                Distance (km)
              </label>
              <div className="input-group input-group-lg">
                <span className="input-group-text">
                  <KTIcon iconName="signpost-split" className="fs-3" />
                </span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter distance"
                  value={formData.distance}
                  onChange={(e) => handleDistanceChange(e.target.value)}
                  min="0.01"
                  step="0.01"
                  required={type === "FIELD_WORK"}
                />
                <span className="input-group-text">km</span>
              </div>
              <div className="form-text">
                <KTIcon iconName="information-5" className="fs-7 me-1" />
                Enter the total distance for this field work
              </div>
            </div>
          )}

          {/* ✅ Fuel Cost - Only for Field Work (แสดงผลอัตโนมัติ) */}
          {config.showFuel && (
            <div className="mb-7">
              <label className="form-label fw-bold d-flex align-items-center">
                <KTIcon iconName="oil" className="fs-3 text-primary me-2" />
                Fuel Cost (LAK)
              </label>
              <div className="input-group input-group-lg">
                <span className="input-group-text">
                  <KTIcon iconName="oil" className="fs-3" />
                </span>
                <input
                  type="number"
                  className="form-control bg-light"
                  placeholder="Auto-calculated from distance"
                  value={formData.fuel}
                  readOnly
                  disabled
                />
                <span className="input-group-text">LAK</span>
              </div>
              <div className="form-text">
                <KTIcon iconName="information-5" className="fs-7 me-1" />
                Fuel Cost = Distance × 3,000 (auto-calculated)
              </div>
            </div>
          )}

          {/* Employee Selection - Only for Field Work */}
          {config.showEmployeeSelection && (
            <div className="mb-7">
              <label className="form-label fw-bold d-flex align-items-center">
                <KTIcon iconName="people" className="fs-3 text-primary me-2" />
                Team Members (Optional)
              </label>
              <Select
                isMulti
                options={userOptions}
                value={selectedEmployees}
                onChange={handleEmployeeChange}
                placeholder="Select team members to join..."
                className="react-select-container"
                classNamePrefix="react-select"
                isLoading={allUsers.length === 0}
                noOptionsMessage={() => "No users found"}
                styles={selectStyles}
              />
              <div className="form-text">
                <KTIcon iconName="information-5" className="fs-7 me-1" />
                Select colleagues who will join this field work (optional)
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

          {/* ✅ Summary Card with Overnight Support */}
          <div
            className={`alert alert-light-${config.color} d-flex align-items-start`}
          >
            <KTIcon
              iconName="information-2"
              className={`fs-2 me-3 mt-1 text-${config.color}`}
            />
            <div className="flex-grow-1">
              <h5 className="mb-3">Request Summary</h5>
              <div className="row g-3">
                <div className="col-6">
                  <small className="text-muted d-block">Start Date</small>
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
                {formData.start_hour &&
                  formData.end_hour &&
                  (() => {
                    const { hours, isNextDay } = calculateDuration(
                      formData.start_hour,
                      formData.end_hour,
                    );
                    return (
                      <>
                        {isNextDay && (
                          <div className="col-6">
                            <small className="text-muted d-block">
                              End Date
                            </small>
                            <strong className="text-warning">
                              {getEndDate(formData.date, isNextDay)}
                              <span className="badge badge-light-warning ms-2">
                                Next Day
                              </span>
                            </strong>
                          </div>
                        )}
                        <div className="col-6">
                          <small className="text-muted d-block">Duration</small>
                          <strong className={`text-${config.color}`}>
                            {hours.toFixed(1)} hours
                            {isNextDay && (
                              <span className="badge badge-light-warning ms-2">
                                Overnight
                              </span>
                            )}
                          </strong>
                        </div>
                      </>
                    );
                  })()}
                {type === "FIELD_WORK" && formData.distance && (
                  <div className="col-6">
                    <small className="text-muted d-block">Distance</small>
                    <strong className="text-primary">
                      {Number(formData.distance).toFixed(2)} km
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
                {type === "FIELD_WORK" && selectedEmployees.length > 0 && (
                  <div className="col-12">
                    <small className="text-muted d-block">Team Members</small>
                    <strong className="text-primary">
                      {selectedEmployees
                        .map((emp) => emp.label.split(" - ")[0])
                        .join(", ")}
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
              !formData.date ||
              !formData.start_hour ||
              !formData.end_hour ||
              !formData.reason ||
              (type === "FIELD_WORK" && !formData.distance) // ✅ เช็ค distance แทน fuel
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
