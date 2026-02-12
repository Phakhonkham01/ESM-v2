// controllers/satSunRequestController.ts
import { Request, Response } from "express";
import SatSunRequestModel from "../models/sat_sunRequestModel";
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

// ✅ Interface สำหรับ SatSunRequest ที่ถูก populate
interface PopulatedSatSunRequest {
  _id: Types.ObjectId;
  user_id: Types.ObjectId | PopulatedUser;
  supervisor_id: Types.ObjectId | PopulatedUser | PopulatedUser[];
  employee_id: Types.ObjectId | PopulatedUser;
  day_choice: "Saturday" | "Sunday";
  day_off_type: "Full day" | "Half day";
  start_date_time: Date;
  end_date_time: Date;
  date_off_number: number;
  description: string;
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
 * CREATE SAT-SUN REQUEST - ✅ IMPROVED VERSION
 * ======================================================
 */
export const createSatSunRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('📥 Received Saturday/Sunday request data:', req.body);
    
    const {
      user_id,
      supervisor_id,
      employee_id,
      day_choice,
      day_off_type,
      start_date_time,
      end_date_time,
      description,
    } = req.body;

    // ✅ Validation - ตรวจสอบว่าเป็น array
    if (
      !user_id ||
      !supervisor_id ||
      !Array.isArray(supervisor_id) ||
      supervisor_id.length === 0 ||
      !employee_id ||
      !day_choice ||
      !day_off_type ||
      !start_date_time ||
      !end_date_time
    ) {
      console.log('❌ Missing fields');
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // ✅ Validate day_choice
    if (!["Saturday", "Sunday"].includes(day_choice)) {
      res.status(400).json({ message: "Invalid day_choice. Must be Saturday or Sunday" });
      return;
    }

    // ✅ Validate day_off_type
    if (!["Full day", "Half day"].includes(day_off_type)) {
      res.status(400).json({ message: "Invalid day_off_type. Must be 'Full day' or 'Half day'" });
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

    // ✅ Validate that the selected day matches day_choice
    const dayOfWeek = startDate.getDay(); // 0 = Sunday, 6 = Saturday
    const expectedDay = day_choice === "Saturday" ? 6 : 0;

    if (dayOfWeek !== expectedDay) {
      res.status(400).json({
        message: `Selected date must be a ${day_choice}`,
      });
      return;
    }

    // ✅ Improved HALF_DAY validation - ตรวจสอบว่าอยู่ในวันเดียวกัน
    if (day_off_type === "Half day") {
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      if (startDateOnly.getTime() !== endDateOnly.getTime()) {
        res.status(400).json({
          message: "Half day leave must be within the same day",
        });
        return;
      }

      // ✅ ตรวจสอบว่าเวลาถูกต้อง (morning: 08:30-12:00, afternoon: 13:30-17:00)
      const startHour = startDate.getHours();
      const startMinute = startDate.getMinutes();
      const endHour = endDate.getHours();
      const endMinute = endDate.getMinutes();

      const isMorning = (startHour === 8 && startMinute === 30) && (endHour === 12 && endMinute === 0);
      const isAfternoon = (startHour === 13 && startMinute === 30) && (endHour === 17 && endMinute === 0);

      if (!isMorning && !isAfternoon) {
        console.log('⚠️ Invalid half-day time:', {
          start: `${startHour}:${startMinute}`,
          end: `${endHour}:${endMinute}`,
          isMorning,
          isAfternoon
        });
        res.status(400).json({
          message: "Invalid half-day time. Must be either Morning (08:30-12:00) or Afternoon (13:30-17:00)",
        });
        return;
      }

      console.log('✅ Valid half-day time:', isMorning ? 'MORNING' : 'AFTERNOON');
    }

    // ================= CALCULATE DATE OFF NUMBER =================
    let date_off_number = 0;

    if (day_off_type === "Half day") {
      date_off_number = 0.5;
    } else if (day_off_type === "Full day") {
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      const diffTime = endDateOnly.getTime() - startDateOnly.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      date_off_number = diffDays + 1; // inclusive
    }

    console.log('📊 Calculated date_off_number:', date_off_number);

    // ✅ ตรวจสอบว่า employee มีวันลาเพียงพอหรือไม่
    const employee = await User.findById(employee_id);
    
    if (!employee) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    if (employee.leave_days < date_off_number) {
      res.status(400).json({ 
        message: `Insufficient leave days. You have ${employee.leave_days} days remaining, but requesting ${date_off_number} days.`,
        available_days: employee.leave_days,
        requested_days: date_off_number
      });
      return;
    }

    // ================= CREATE REQUEST =================
    const request = await SatSunRequestModel.create({
      user_id,
      supervisor_id,
      employee_id,
      day_choice,
      day_off_type,
      start_date_time,
      end_date_time,
      date_off_number,
      description: description || "",
      status: "Pending",
    });

    // ✅ Populate before sending response
    const populatedRequest = await SatSunRequestModel.findById(request._id)
      .populate(getPopulateConfig());

    console.log('✅ Created Saturday/Sunday request:', populatedRequest);

    res.status(201).json({
      success: true,
      message: "Saturday/Sunday request submitted successfully",
      request: populatedRequest,
      remaining_leave_days: employee.leave_days
    });
  } catch (error: any) {
    console.error("SAT-SUN CREATE ERROR:", error);

    if (error.name === "ValidationError") {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    if (error.code === 11000) {
      res.status(400).json({ success: false, message: "Duplicate request detected" });
      return;
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * GET ALL SAT-SUN REQUESTS FOR ALL USERS
 * ======================================================
 */
export const getSatSunRequestsAllUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('📋 Fetching all Saturday/Sunday requests');

    const requests = await SatSunRequestModel.find({})
      .populate(getPopulateConfig())
      .sort({ created_at: -1 })
      .lean();

    console.log(`✅ Found ${requests.length} requests`);

    if (requests.length > 0) {
      const sample = requests[0] as any;
      console.log('🔍 Sample request:', {
        _id: sample._id,
        employee: sample.employee_id,
        day_choice: sample.day_choice,
        description: sample.description
      });
    }

    res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests,
    });
  } catch (error) {
    console.error("GET SAT-SUN REQUESTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * GET SAT-SUN REQUEST BY ID
 * ======================================================
 */
export const getSatSunRequestById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    console.log(`📋 Fetching Saturday/Sunday request by ID: ${id}`);

    const request = await SatSunRequestModel.findById(id)
      .populate(getPopulateConfig())
      .lean();

    if (!request) {
      res.status(404).json({
        success: false,
        message: 'Saturday/Sunday request not found',
      });
      return;
    }

    console.log('✅ Found request:', {
      _id: (request as any)._id,
      employee: (request as any).employee_id?.first_name_en,
      day_choice: (request as any).day_choice
    });

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
 * GET ALL SAT-SUN REQUESTS WITH FILTERS
 * ======================================================
 */
export const getAllSatSunRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate, status, day_choice } = req.query;
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

    // Filter by day choice
    if (day_choice && ["Saturday", "Sunday"].includes(day_choice as string)) {
      query.day_choice = day_choice;
    }

    console.log('📋 Query filters:', query);

    const requests = await SatSunRequestModel.find(query)
      .populate(getPopulateConfig())
      .sort({ created_at: -1 });

    console.log(`✅ Found ${requests.length} requests`);

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("GET SAT-SUN REQUESTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * GET SAT-SUN REQUESTS FOR SUPERVISOR DASHBOARD
 * ======================================================
 */
export const getSatSunRequestsForSupervisorDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { supervisorId } = req.params;

    if (!supervisorId) {
      res.status(400).json({ success: false, message: "Supervisor ID is required" });
      return;
    }

    console.log(`📋 Fetching Saturday/Sunday requests for supervisor: ${supervisorId}`);

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

    const requests = await SatSunRequestModel.find({
      supervisor_id: supervisor._id
    })
      .populate(getPopulateConfig())
      .sort({ created_at: -1 });

    console.log(`✅ Found ${requests.length} requests for supervisor`);

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
 * GET SAT-SUN REQUESTS BY USER
 * ======================================================
 */
export const getSatSunRequestsByUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ success: false, message: "User ID is required" });
      return;
    }

    console.log(`📋 Fetching Saturday/Sunday requests for user: ${userId}`);

    const requests = await SatSunRequestModel.find({
      $or: [{ employee_id: userId }, { user_id: userId }],
    })
      .populate(getPopulateConfig())
      .sort({ created_at: -1 });

    console.log(`✅ Found ${requests.length} requests for user`);

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("GET SAT-SUN REQUESTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * UPDATE SAT-SUN REQUEST STATUS (Supervisor / Admin)
 * ✅ เพิ่มการหัก leave_days เมื่อ Approve
 * ======================================================
 */
export const updateSatSunRequestStatus = async (
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

    console.log(`🔄 Updating Saturday/Sunday request ${id} to status: ${status}`);

    const request = await SatSunRequestModel.findById(id);

    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    // ✅ ถ้า Approve และยังไม่เคย Approve มาก่อน
    if (status === "Accepted" && request.status !== "Accepted") {
      const employee = await User.findById(request.employee_id);
      
      if (!employee) {
        res.status(404).json({ success: false, message: "Employee not found" });
        return;
      }

      if (employee.leave_days < request.date_off_number) {
        res.status(400).json({ 
          success: false, 
          message: `Insufficient leave days. Employee has ${employee.leave_days} days remaining, but request is for ${request.date_off_number} days.` 
        });
        return;
      }

      employee.leave_days -= request.date_off_number;
      await employee.save();

      console.log(`✅ Deducted ${request.date_off_number} days from employee ${employee._id}. Remaining: ${employee.leave_days}`);
    }

    // ✅ ถ้า Reject request ที่เคย Approve ไว้แล้ว ให้คืนวันลา
    if (status === "Rejected" && request.status === "Accepted") {
      const employee = await User.findById(request.employee_id);
      
      if (employee) {
        employee.leave_days += request.date_off_number;
        await employee.save();

        console.log(`✅ Restored ${request.date_off_number} days to employee ${employee._id}. New balance: ${employee.leave_days}`);
      }
    }

    const updated = await SatSunRequestModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate(getPopulateConfig());

    if (!updated) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    console.log('✅ Updated request status:', {
      _id: updated._id,
      status: updated.status
    });

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
 * EDIT SAT-SUN REQUEST (ONLY WHEN PENDING)
 * ======================================================
 */
export const updateSatSunRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      day_choice,
      day_off_type,
      start_date_time,
      end_date_time,
      description,
      supervisor_id,
    } = req.body;

    console.log(`🔄 Updating Saturday/Sunday request ${id}`);

    if (
      !day_choice ||
      !day_off_type ||
      !start_date_time ||
      !end_date_time ||
      !supervisor_id
    ) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const request = await SatSunRequestModel.findById(id);

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

    // Validate day choice
    const dayOfWeek = startDate.getDay();
    const expectedDay = day_choice === "Saturday" ? 6 : 0;

    if (dayOfWeek !== expectedDay) {
      res.status(400).json({
        success: false,
        message: `Selected date must be a ${day_choice}`,
      });
      return;
    }

    if (
      day_off_type === "Half day" &&
      startDate.toDateString() !== endDate.toDateString()
    ) {
      res.status(400).json({
        success: false,
        message: "Half day leave must be within the same day",
      });
      return;
    }

    let date_off_number = 0;

    if (day_off_type === "Half day") {
      date_off_number = 0.5;
    } else if (day_off_type === "Full day") {
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      date_off_number = diffDays + 1;
    }

    request.day_choice = day_choice;
    request.day_off_type = day_off_type;
    request.start_date_time = start_date_time;
    request.end_date_time = end_date_time;
    request.date_off_number = date_off_number;
    request.description = description || "";
    request.supervisor_id = supervisor_id;

    await request.save();

    const updatedRequest = await SatSunRequestModel.findById(id)
      .populate(getPopulateConfig());

    console.log('✅ Updated request:', {
      _id: updatedRequest?._id,
      day_choice: updatedRequest?.day_choice
    });

    res.status(200).json({
      success: true,
      message: "Saturday/Sunday request updated successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("UPDATE SAT-SUN REQUEST ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * DELETE SAT-SUN REQUEST (ONLY WHEN PENDING)
 * ======================================================
 */
export const deleteSatSunRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: "Request ID is required" });
      return;
    }

    console.log(`🗑️ Deleting Saturday/Sunday request ${id}`);

    const request = await SatSunRequestModel.findById(id);

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

    console.log('✅ Deleted request:', id);

    res.status(200).json({
      success: true,
      message: "Saturday/Sunday request deleted successfully",
    });
  } catch (error) {
    console.error("DELETE SAT-SUN REQUEST ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * CHECK FOR SAT-SUN CONFLICTS
 * ======================================================
 */
export const checkSatSunConflict = async (
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

    console.log('🔍 Checking Saturday/Sunday conflicts for employee:', employee_id);

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
          day_off_type: "Full day",
          start_date_time: { $lte: endOfDay },
          end_date_time: { $gte: startOfDay }
        },
        {
          day_off_type: "Half day",
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

    const existingRequests = await SatSunRequestModel.find(query)
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
        day_choice: request.day_choice,
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
      };
    });

    console.log(`✅ Found ${conflicts.length} conflicts`);

    res.status(200).json({
      success: true,
      has_conflict: conflicts.length > 0,
      conflict_count: conflicts.length,
      conflicts,
      message: conflicts.length > 0
        ? "Found overlapping Saturday/Sunday requests"
        : "No conflicts found"
    });

  } catch (error) {
    console.error("CHECK SAT-SUN CONFLICT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * ======================================================
 * GET SAT-SUN REQUEST STATS
 * ======================================================
 */
export const getSatSunStats = async (
  _: Request,
  res: Response
): Promise<void> => {
  try {
    const total = await SatSunRequestModel.countDocuments();
    const pending = await SatSunRequestModel.countDocuments({ status: "Pending" });
    const accepted = await SatSunRequestModel.countDocuments({ status: "Accepted" });
    const rejected = await SatSunRequestModel.countDocuments({ status: "Rejected" });
    const saturday = await SatSunRequestModel.countDocuments({ day_choice: "Saturday" });
    const sunday = await SatSunRequestModel.countDocuments({ day_choice: "Sunday" });
    const fullDay = await SatSunRequestModel.countDocuments({ day_off_type: "Full day" });
    const halfDay = await SatSunRequestModel.countDocuments({ day_off_type: "Half day" });

    console.log('📊 Saturday/Sunday stats:', {
      total,
      pending,
      accepted,
      rejected,
      saturday,
      sunday,
      fullDay,
      halfDay
    });

    res.json({
      success: true,
      stats: {
        total,
        byStatus: {
          pending,
          accepted,
          rejected,
        },
        byDay: {
          saturday,
          sunday,
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