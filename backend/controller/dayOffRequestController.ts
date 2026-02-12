import { Request, Response } from "express";
import DayOffRequestModel from "../models/dayOffRequestModal.ts";
import User from "../models/User.ts";
import { Types } from "mongoose";

// ✅ Interface สำหรับ User ที่ถูก populate
interface PopulatedUser {
  _id: Types.ObjectId;
  first_name_en?: string;
  last_name_en?: string;
  user_email?: string;
  employee_id?: string;
  leave_days?: number;
  department_id?: {
    _id: Types.ObjectId;
    department_name?: string;
  };
  position_id?: {
    _id: Types.ObjectId;
    position_name?: string;
  };
}

// ✅ Interface สำหรับ DayOffRequest ที่ถูก populate
interface PopulatedDayOffRequest {
  _id: Types.ObjectId;
  user_id: Types.ObjectId | PopulatedUser;
  supervisor_id: Types.ObjectId | PopulatedUser | PopulatedUser[];
  employee_id: Types.ObjectId | PopulatedUser;
  day_off_type: "FULL_DAY" | "HALF_DAY";
  start_date_time: Date;
  end_date_time: Date;
  date_off_number: number;
  title: string;
  status: "Pending" | "Accepted" | "Rejected";
  created_at: Date;
}

/* ============================================================
   POPULATION HELPER - ✅ Centralized population config
============================================================ */

const getPopulateConfig = () => [
  {
    path: "user_id",
    select: "user_name user_email first_name_en last_name_en nickname_en first_name_la last_name_la nickname_la employee_id department_id position_id leave_days",
    populate: [
      {
        path: "department_id",
        select: "department_name _id"
      },
      {
        path: "position_id",
        select: "position_name _id"
      }
    ]
  },
  {
    path: "employee_id",
    select: "user_name user_email first_name_en last_name_en nickname_en first_name_la last_name_la nickname_la employee_id department_id position_id leave_days",
    populate: [
      {
        path: "department_id",
        select: "department_name _id"
      },
      {
        path: "position_id",
        select: "position_name _id"
      }
    ]
  },
  {
    path: "supervisor_id",
    select: "user_name user_email first_name_en last_name_en first_name_la last_name_la employee_id department_id position_id",
    populate: [
      {
        path: "department_id",
        select: "department_name _id"
      },
      {
        path: "position_id",
        select: "position_name _id"
      }
    ]
  }
];

/**
 * ======================================================
 * CREATE DAY OFF REQUEST
 * ======================================================
 */
export const createDayOffRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      user_id,
      supervisor_id,
      employee_id,
      day_off_type,
      start_date_time,
      end_date_time,
      title,
    } = req.body;

    // Validation - ตรวจสอบว่าเป็น array
    if (
      !user_id ||
      !supervisor_id ||
      !Array.isArray(supervisor_id) ||
      supervisor_id.length === 0 ||
      !employee_id ||
      !day_off_type ||
      !start_date_time ||
      !end_date_time ||
      !title?.trim()
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const startDate = new Date(start_date_time);
    const endDate = new Date(end_date_time);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({ message: "Invalid date format" });
      return;
    }

    if (endDate < startDate) {
      res.status(400).json({
        message: "End date must be later than start date",
      });
      return;
    }

    if (
      day_off_type === "HALF_DAY" &&
      startDate.toDateString() !== endDate.toDateString()
    ) {
      res.status(400).json({
        message: "Half day leave must be within the same day",
      });
      return;
    }

    // ================= CALCULATE DATE OFF NUMBER =================
    let date_off_number = 0;

    if (day_off_type === "HALF_DAY") {
      date_off_number = 0.5;
    } else if (day_off_type === "FULL_DAY") {
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      date_off_number = diffDays + 1; // inclusive
    }

    // ================= CREATE REQUEST =================
    const request = await DayOffRequestModel.create({
      user_id,
      supervisor_id, // บันทึกเป็น array
      employee_id,
      day_off_type,
      start_date_time,
      end_date_time,
      date_off_number,
      title,
      status: "Pending",
    });

    // ✅ Populate before sending response
    const populatedRequest = await DayOffRequestModel.findById(request._id)
      .populate(getPopulateConfig());

    res.status(201).json({
      success: true,
      message: "Day off request submitted successfully",
      request: populatedRequest,
    });
  } catch (error: any) {
    console.error("DAY OFF CREATE ERROR:", error);

    if (error.name === "ValidationError") {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * GET ALL DAY OFF REQUESTS FOR ALL USERS
 * ======================================================
 */
export const getDayOffRequestsAllUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // ✅ Use centralized population config
    const requests = await DayOffRequestModel.find({})
      .populate(getPopulateConfig())
      .sort({ created_at: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests,
    });
  } catch (error) {
    console.error("GET DAY OFF REQUESTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * GET DAY OFF REQUEST BY ID
 * ======================================================
 */
export const getDayOffRequestById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    // ✅ Use centralized population config
    const request = await DayOffRequestModel.findById(id)
      .populate(getPopulateConfig())
      .lean();

    if (!request) {
      res.status(404).json({
        success: false,
        message: 'Day off request not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('❌ Get request by ID error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * GET ALL DAY OFF REQUESTS WITH FILTERS
 * ======================================================
 */
export const getAllDayOffRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate, status } = req.query;
    const query: any = {};

    // Filter by date range
    if (startDate && endDate) {
      query.start_date_time = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    // Filter by status
    if (status && ["Pending", "Accepted", "Rejected"].includes(status as string)) {
      query.status = status;
    }

    // ✅ Use centralized population config
    const requests = await DayOffRequestModel.find(query)
      .populate(getPopulateConfig())
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("GET DAY OFF REQUESTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * GET DAY OFF REQUESTS FOR SUPERVISOR DASHBOARD
 * ======================================================
 */
export const getDayOffRequestsForSupervisorDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { supervisorId } = req.params;

    if (!supervisorId) {
      res.status(400).json({ success: false, message: "Supervisor ID is required" });
      return;
    }

    const supervisor = await User.findById(supervisorId)
      .populate([
        {
          path: "department_id",
          select: "department_name _id"
        },
        {
          path: "position_id",
          select: "position_name _id"
        }
      ]);

    if (!supervisor) {
      res.status(404).json({ success: false, message: "Supervisor not found" });
      return;
    }

    // ✅ Use centralized population config
    const requests = await DayOffRequestModel.find({
      supervisor_id: supervisor._id
    })
      .populate(getPopulateConfig())
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      supervisor: {
        id: supervisor._id,
        name: `${supervisor.first_name_en} ${supervisor.last_name_en}`,
        email: (supervisor as any).user_email,
        department: (supervisor as any).department_id,
        position: (supervisor as any).position_id
      },
      count: requests.length,
      requests: requests,
    });
  } catch (error) {
    console.error("GET SUPERVISOR DASHBOARD REQUESTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * GET DAY OFF REQUESTS BY USER
 * ======================================================
 */
export const getDayOffRequestsByUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ success: false, message: "User ID is required" });
      return;
    }

    // ✅ Use centralized population config
    const requests = await DayOffRequestModel.find({
      $or: [{ employee_id: userId }, { user_id: userId }],
    })
      .populate(getPopulateConfig())
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("GET DAY OFF REQUESTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * UPDATE DAY OFF REQUEST STATUS (Supervisor / Admin)
 * ✅ เพิ่มการหัก leave_days เมื่อ Approve
 * ======================================================
 */
export const updateDayOffRequestStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: "Status is required" });
      return;
    }

    if (!["Pending", "Accepted", "Rejected"].includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status" });
      return;
    }

    // ✅ หา request ก่อน populate
    const request = await DayOffRequestModel.findById(id);

    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    // ✅ ถ้า Approve และยังไม่เคย Approve มาก่อน
    if (status === "Accepted" && request.status !== "Accepted") {
      // หัก leave_days ของ employee
      const employee = await User.findById(request.employee_id);
      
      if (!employee) {
        res.status(404).json({ success: false, message: "Employee not found" });
        return;
      }

      // ตรวจสอบว่ามีวันลาพอหรือไม่
      if (employee.leave_days < request.date_off_number) {
        res.status(400).json({ 
          success: false, 
          message: `Insufficient leave days. Employee has ${employee.leave_days} days remaining, but request is for ${request.date_off_number} days.` 
        });
        return;
      }

      // หัก leave_days
      employee.leave_days -= request.date_off_number;
      await employee.save();
    }

    // ✅ ถ้า Reject request ที่เคย Approve ไว้แล้ว ให้คืนวันลา
    if (status === "Rejected" && request.status === "Accepted") {
      const employee = await User.findById(request.employee_id);
      
      if (employee) {
        employee.leave_days += request.date_off_number;
        await employee.save();
      }
    }

    // ✅ อัพเดท status และ populate
    const updated = await DayOffRequestModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate(getPopulateConfig());

    if (!updated) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: status === "Accepted" 
        ? `Status updated to ${status}. ${request.date_off_number} day(s) deducted from employee's leave balance.`
        : `Status updated to ${status}`,
      request: updated,
    });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * EDIT DAY OFF REQUEST (ONLY WHEN PENDING)
 * ======================================================
 */
export const updateDayOffRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      day_off_type,
      start_date_time,
      end_date_time,
      title,
      supervisor_id,
    } = req.body;

    if (
      !day_off_type ||
      !start_date_time ||
      !end_date_time ||
      !title?.trim() ||
      !supervisor_id
    ) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const request = await DayOffRequestModel.findById(id);

    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    if (request.status !== "Pending") {
      res.status(400).json({
        success: false,
        message: "Only pending requests can be edited",
      });
      return;
    }

    const startDate = new Date(start_date_time);
    const endDate = new Date(end_date_time);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({ success: false, message: "Invalid date format" });
      return;
    }

    if (endDate < startDate) {
      res.status(400).json({
        success: false,
        message: "End date must be later than start date",
      });
      return;
    }

    if (
      day_off_type === "HALF_DAY" &&
      startDate.toDateString() !== endDate.toDateString()
    ) {
      res.status(400).json({
        success: false,
        message: "Half day leave must be within the same day",
      });
      return;
    }

    let date_off_number = 0;

    if (day_off_type === "HALF_DAY") {
      date_off_number = 0.5;
    } else if (day_off_type === "FULL_DAY") {
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      date_off_number = diffDays + 1;
    }

    request.day_off_type = day_off_type;
    request.start_date_time = start_date_time;
    request.end_date_time = end_date_time;
    request.date_off_number = date_off_number;
    request.title = title;
    request.supervisor_id = supervisor_id;

    await request.save();

    // ✅ Use centralized population config
    const updatedRequest = await DayOffRequestModel.findById(id)
      .populate(getPopulateConfig());

    res.status(200).json({
      success: true,
      message: "Day off request updated successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("UPDATE DAY OFF REQUEST ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * DELETE DAY OFF REQUEST (ONLY WHEN PENDING)
 * ======================================================
 */
export const deleteDayOffRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "Request ID is required" });
      return;
    }

    const request = await DayOffRequestModel.findById(id);

    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    if (request.status !== "Pending") {
      res.status(400).json({
        success: false,
        message: "Only pending requests can be deleted",
      });
      return;
    }

    await request.deleteOne();

    res.status(200).json({
      success: true,
      message: "Day off request deleted successfully",
    });
  } catch (error) {
    console.error("DELETE DAY OFF REQUEST ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * CHECK FOR DAY OFF CONFLICTS
 * ======================================================
 */
export const checkDayOffConflict = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      employee_id,
      date,
      start_date,
      end_date,
      exclude_id,
    } = req.query;

    if (!employee_id) {
      res.status(400).json({
        success: false,
        message: "Employee ID is required"
      });
      return;
    }

    const employeeId = employee_id as string;
    const excludeId = exclude_id as string | undefined;

    const query: any = {
      employee_id: employeeId,
      status: { $in: ["Pending", "Accepted"] },
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    if (date && !start_date && !end_date) {
      const checkDate = new Date(date as string);

      if (isNaN(checkDate.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid date format"
        });
        return;
      }

      const startOfDay = new Date(checkDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(checkDate);
      endOfDay.setHours(23, 59, 59, 999);

      query.$or = [
        {
          day_off_type: "FULL_DAY",
          start_date_time: { $lte: endOfDay },
          end_date_time: { $gte: startOfDay }
        },
        {
          day_off_type: "HALF_DAY",
          start_date_time: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      ];

    } else if (start_date && end_date && !date) {
      const startDate = new Date(start_date as string);
      const endDate = new Date(end_date as string);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid date format"
        });
        return;
      }

      if (endDate < startDate) {
        res.status(400).json({
          success: false,
          message: "End date cannot be before start date"
        });
        return;
      }

      const startOfRange = new Date(startDate);
      startOfRange.setHours(0, 0, 0, 0);

      const endOfRange = new Date(endDate);
      endOfRange.setHours(23, 59, 59, 999);

      query.$or = [
        {
          start_date_time: { $lte: startOfRange },
          end_date_time: { $gte: startOfRange }
        },
        {
          start_date_time: { $lte: endOfRange },
          end_date_time: { $gte: endOfRange }
        },
        {
          start_date_time: { $gte: startOfRange },
          end_date_time: { $lte: endOfRange }
        },
        {
          start_date_time: { $lte: startOfRange },
          end_date_time: { $gte: endOfRange }
        }
      ];
    } else {
      res.status(400).json({
        success: false,
        message: "Provide either date (for half day) or start_date and end_date (for full day)"
      });
      return;
    }

    // ✅ Use centralized population config (only employee needed here)
    const existingRequests = await DayOffRequestModel.find(query)
      .populate({
        path: "employee_id",
        select: "first_name_en last_name_en user_email employee_id department_id position_id",
        populate: [
          {
            path: "department_id",
            select: "department_name _id"
          },
          {
            path: "position_id",
            select: "position_name _id"
          }
        ]
      })
      .sort({ start_date_time: 1 });

    const conflicts = existingRequests.map(req => {
      const request = req.toObject();
      const employee = request.employee_id as any;

      return {
        id: request._id,
        day_off_type: request.day_off_type,
        start_date: request.start_date_time,
        end_date: request.end_date_time,
        status: request.status,
        date_off_number: request.date_off_number,
        employee_name: employee
          ? `${employee.first_name_en || ''} ${employee.last_name_en || ''}`.trim()
          : 'Unknown',
        employee_department: employee?.department_id?.department_name || '',
        employee_position: employee?.position_id?.position_name || '',
        conflict_type: getConflictType(
          new Date(request.start_date_time),
          new Date(request.end_date_time),
          date ? new Date(date as string) : new Date(start_date as string),
          date ? undefined : new Date(end_date as string)
        )
      };
    });

    res.status(200).json({
      success: true,
      has_conflict: conflicts.length > 0,
      conflict_count: conflicts.length,
      conflicts,
      message: conflicts.length > 0
        ? "Found overlapping day off requests"
        : "No conflicts found"
    });

  } catch (error) {
    console.error("CHECK DAY OFF CONFLICT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Helper function to determine conflict type
 */
const getConflictType = (
  existingStart: Date,
  existingEnd: Date,
  newStart: Date,
  newEnd?: Date
): string => {
  if (!newEnd) {
    const newDate = newStart;
    const existingStartDate = existingStart.toDateString();
    const newDateStr = newDate.toDateString();

    if (existingStartDate === newDateStr) {
      return "SAME_DATE";
    }
    return "OVERLAPPING_RANGE";
  }

  const existingStartDate = new Date(existingStart).setHours(0, 0, 0, 0);
  const existingEndDate = new Date(existingEnd).setHours(23, 59, 59, 999);
  const newStartDate = new Date(newStart).setHours(0, 0, 0, 0);
  const newEndDate = new Date(newEnd).setHours(23, 59, 59, 999);

  if (newStartDate >= existingStartDate && newStartDate <= existingEndDate) {
    return "NEW_STARTS_IN_EXISTING";
  }
  if (newEndDate >= existingStartDate && newEndDate <= existingEndDate) {
    return "NEW_ENDS_IN_EXISTING";
  }
  if (newStartDate <= existingStartDate && newEndDate >= existingEndDate) {
    return "NEW_CONTAINS_EXISTING";
  }
  if (newStartDate >= existingStartDate && newEndDate <= existingEndDate) {
    return "EXISTING_CONTAINS_NEW";
  }

  return "OVERLAPPING";
};

/**
 * ======================================================
 * GET DAY OFF REQUEST STATS
 * ======================================================
 */
export const getDayOffStats = async (
  _: Request,
  res: Response
): Promise<void> => {
  try {
    const total = await DayOffRequestModel.countDocuments();
    const pending = await DayOffRequestModel.countDocuments({ status: "Pending" });
    const accepted = await DayOffRequestModel.countDocuments({ status: "Accepted" });
    const rejected = await DayOffRequestModel.countDocuments({ status: "Rejected" });
    const fullDay = await DayOffRequestModel.countDocuments({ day_off_type: "FULL_DAY" });
    const halfDay = await DayOffRequestModel.countDocuments({ day_off_type: "HALF_DAY" });
    res.json({
      success: true,
      stats: {
        total,
        byStatus: {
          pending,
          accepted,
          rejected,
        },
        byType: {
          fullDay,
          halfDay,
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};