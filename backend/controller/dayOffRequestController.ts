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
      { path: "department_id", select: "department_name _id" },
      { path: "position_id",   select: "position_name _id"  }
    ]
  },
  {
    path: "employee_id",
    select: "user_name user_email first_name_en last_name_en nickname_en first_name_la last_name_la nickname_la employee_id department_id position_id leave_days",
    populate: [
      { path: "department_id", select: "department_name _id" },
      { path: "position_id",   select: "position_name _id"  }
    ]
  },
  {
    path: "supervisor_id",
    select: "user_name user_email first_name_en last_name_en first_name_la last_name_la employee_id department_id position_id",
    populate: [
      { path: "department_id", select: "department_name _id" },
      { path: "position_id",   select: "position_name _id"  }
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
    console.log('📥 Received data:', req.body);

    const {
      user_id,
      supervisor_id,
      employee_id,
      day_off_type,
      start_date_time,
      end_date_time,
      title,
    } = req.body;

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
    const endDate   = new Date(end_date_time);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({ message: "Invalid date format" });
      return;
    }

    if (endDate < startDate) {
      res.status(400).json({ message: "End date must be later than start date" });
      return;
    }

    if (day_off_type === "HALF_DAY" && startDate.toDateString() !== endDate.toDateString()) {
      res.status(400).json({ message: "Half day leave must be within the same day" });
      return;
    }

    let date_off_number = 0;
    if (day_off_type === "HALF_DAY") {
      date_off_number = 0.5;
    } else if (day_off_type === "FULL_DAY") {
      const diffTime = endDate.getTime() - startDate.getTime();
      date_off_number = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const request = await DayOffRequestModel.create({
      user_id,
      supervisor_id,
      employee_id,
      day_off_type,
      start_date_time,
      end_date_time,
      date_off_number,
      title,
      status: "Pending",
    });

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
 * ✅ GET DAY OFF REQUEST ALL USER — with filter + correct pagination
 *
 * Query params:
 *   year, month, department, status, search, page, limit
 *
 * IMPORTANT: department filter is applied AFTER populate (post-filter)
 * and BEFORE pagination so the page counts are correct.
 * ======================================================
 */
export const getDayOffRequestsAllUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      year,
      month,
      department,
      status,
      search,
      page  = '1',
      limit = '10',
    } = req.query;

    console.log('📋 Fetching all day off requests with filters:', { year, month, department, status, search, page, limit });

    // ──────────────────────────────────────────────────
    // 1.  Build MongoDB query (fields that exist on the document)
    // ──────────────────────────────────────────────────
    const query: any = {};

    // Filter by year only
    if (year && !month) {
      const yearNum = parseInt(year as string);
      if (!isNaN(yearNum)) {
        query.start_date_time = {
          $gte: new Date(yearNum, 0, 1),
          $lte: new Date(yearNum, 11, 31, 23, 59, 59, 999),
        };
      }
    }

    // Filter by year + month
    if (year && month) {
      const yearNum  = parseInt(year as string);
      const monthNum = parseInt(month as string);
      if (!isNaN(yearNum) && !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        query.start_date_time = {
          $gte: new Date(yearNum, monthNum - 1, 1),
          $lte: new Date(yearNum, monthNum, 0, 23, 59, 59, 999),
        };
      }
    }

    // Filter by status
    if (status && status !== '') {
      query.status = status;
    }

    // ──────────────────────────────────────────────────
    // 2.  Fetch ALL matching docs + populate
    //     (pagination is applied AFTER post-filters)
    // ──────────────────────────────────────────────────
    let requests: any[] = await DayOffRequestModel.find(query)
      .populate(getPopulateConfig())
      .sort({ created_at: -1 })
      .lean();

    // ──────────────────────────────────────────────────
    // 3.  Post-filters (populated fields — must run before paginate)
    // ──────────────────────────────────────────────────

    // ✅ department_id อาจเป็น Array หรือ Object — handle ทั้งสองกรณี
    const getDeptName = (r: any): string | undefined => {
      const deptId = r.employee_id?.department_id
      if (!deptId) return undefined
      if (Array.isArray(deptId)) return deptId[0]?.department_name
      return deptId?.department_name
    }

    // Filter by department name (populated field)
    if (department && department !== '' && department !== 'All Departments') {
      console.log(`🔍 Filtering by department: "${department}"`)
      const beforeCount = requests.length

      requests = requests.filter((r: any) => getDeptName(r) === department)

      console.log(`📊 Department filter: ${beforeCount} → ${requests.length} results`)
    }

    // Search in title / employee name / email
    if (search && (search as string).trim() !== '') {
      const term = (search as string).toLowerCase().trim();
      requests = requests.filter((r: any) => {
        const emp  = r.employee_id || {};
        const name = `${emp.first_name_en || ''} ${emp.last_name_en || ''}`.toLowerCase();
        return (
          r.title?.toLowerCase().includes(term) ||
          name.includes(term) ||
          emp.user_email?.toLowerCase().includes(term) ||
          emp.employee_id?.toLowerCase().includes(term)
        );
      });
    }

    // ──────────────────────────────────────────────────
    // 4.  Pagination — applied on the already-filtered list
    // ──────────────────────────────────────────────────
    const total    = requests.length;
    const pageNum  = Math.max(1, parseInt(page  as string));
    const limitNum = Math.max(1, parseInt(limit as string));
    const skip     = (pageNum - 1) * limitNum;
    const paginated = requests.slice(skip, skip + limitNum);

    console.log(`✅ Total after filters: ${total}, returning page ${pageNum} (${paginated.length} items)`);

    res.status(200).json({
      success:    true,
      count:      paginated.length,
      total,
      page:       pageNum,
      limit:      limitNum,
      totalPages: Math.ceil(total / limitNum),
      requests:   paginated,
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

    const request = await DayOffRequestModel.findById(id)
      .populate(getPopulateConfig())
      .lean();

    if (!request) {
      res.status(404).json({ success: false, message: 'Day off request not found' });
      return;
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('❌ Get request by ID error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * GET ALL DAY OFF REQUESTS WITH ADVANCED FILTERS
 * ======================================================
 */
export const getAllDayOffRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      startDate, endDate, month, year,
      status, userId, departmentId, positionId,
      dayOffType, search,
      page = '1', limit = '10',
      sortBy = 'created_at', sortOrder = 'desc'
    } = req.query;

    const query: any = {};

    if (startDate && endDate) {
      query.start_date_time = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    } else if (startDate) {
      query.start_date_time = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      query.start_date_time = { $lte: new Date(endDate as string) };
    }

    if (month && year) {
      const monthNum = parseInt(month as string);
      const yearNum  = parseInt(year  as string);
      if (!isNaN(monthNum) && !isNaN(yearNum) && monthNum >= 1 && monthNum <= 12) {
        query.start_date_time = {
          $gte: new Date(yearNum, monthNum - 1, 1),
          $lte: new Date(yearNum, monthNum, 0, 23, 59, 59, 999),
        };
      }
    }

    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        const statuses = (status as string).split(',');
        query.status = statuses.length > 1 ? { $in: statuses } : status;
      }
    }

    if (userId) {
      query.$or = [{ employee_id: userId }, { user_id: userId }];
    }

    if (dayOffType && ['FULL_DAY', 'HALF_DAY'].includes(dayOffType as string)) {
      query.day_off_type = dayOffType;
    }

    const pageNum  = parseInt(page  as string);
    const limitNum = parseInt(limit as string);
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    let requests: any[] = await DayOffRequestModel.find(query)
      .populate(getPopulateConfig())
      .sort(sortOptions)
      .lean();

    if (departmentId) {
      const deptStr = (departmentId as string);
      requests = requests.filter((r: any) =>
        r.employee_id?.department_id?._id?.toString() === deptStr
      );
    }

    if (positionId) {
      const posStr = (positionId as string);
      requests = requests.filter((r: any) =>
        r.employee_id?.position_id?._id?.toString() === posStr
      );
    }

    if (search) {
      const term = (search as string).toLowerCase();
      requests = requests.filter((r: any) => {
        const emp  = r.employee_id || {};
        const name = `${emp.first_name_en || ''} ${emp.last_name_en || ''}`.toLowerCase();
        if (r.title?.toLowerCase().includes(term))   return true;
        if (name.includes(term))                     return true;
        if (emp.user_email?.toLowerCase().includes(term)) return true;
        if (Array.isArray(r.supervisor_id)) {
          for (const sup of r.supervisor_id) {
            const sName = `${sup.first_name_en || ''} ${sup.last_name_en || ''}`.toLowerCase();
            if (sName.includes(term)) return true;
          }
        }
        return false;
      });
    }

    const totalItems = requests.length;
    const skip       = (pageNum - 1) * limitNum;
    const paginated  = requests.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalItems / limitNum);

    res.status(200).json({
      success: true,
      pagination: { page: pageNum, limit: limitNum, totalPages, totalItems, hasNext: pageNum < totalPages, hasPrev: pageNum > 1 },
      stats: {
        total:    totalItems,
        byStatus: {
          pending:  requests.filter((r: any) => r.status === 'Pending').length,
          accepted: requests.filter((r: any) => r.status === 'Accepted').length,
          rejected: requests.filter((r: any) => r.status === 'Rejected').length,
        },
        byType: {
          fullDay: requests.filter((r: any) => r.day_off_type === 'FULL_DAY').length,
          halfDay: requests.filter((r: any) => r.day_off_type === 'HALF_DAY').length,
        },
      },
      count:    paginated.length,
      requests: paginated,
    });
  } catch (error) {
    console.error("GET ALL DAY OFF REQUESTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error", error: error instanceof Error ? error.message : 'Unknown error' });
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
        { path: "department_id", select: "department_name _id" },
        { path: "position_id",   select: "position_name _id"  }
      ]);

    if (!supervisor) {
      res.status(404).json({ success: false, message: "Supervisor not found" });
      return;
    }

    const requests = await DayOffRequestModel.find({ supervisor_id: supervisor._id })
      .populate(getPopulateConfig())
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      supervisor: {
        id:         supervisor._id,
        name:       `${supervisor.first_name_en} ${supervisor.last_name_en}`,
        email:      (supervisor as any).user_email,
        department: (supervisor as any).department_id,
        position:   (supervisor as any).position_id,
      },
      count:    requests.length,
      requests,
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

    const requests = await DayOffRequestModel.find({
      $or: [{ employee_id: userId }, { user_id: userId }],
    })
      .populate(getPopulateConfig())
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error) {
    console.error("GET DAY OFF REQUESTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ======================================================
 * UPDATE DAY OFF REQUEST STATUS
 * ======================================================
 */
export const updateDayOffRequestStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: "Status is required" });
      return;
    }

    if (!["Pending", "Accepted", "Rejected"].includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status" });
      return;
    }

    const request = await DayOffRequestModel.findById(id);
    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    // Deduct leave days on Approve
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
    }

    // Restore leave days if rejecting a previously accepted request
    if (status === "Rejected" && request.status === "Accepted") {
      const employee = await User.findById(request.employee_id);
      if (employee) {
        employee.leave_days += request.date_off_number;
        await employee.save();
      }
    }

    const updated = await DayOffRequestModel.findByIdAndUpdate(id, { status }, { new: true })
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
    const { day_off_type, start_date_time, end_date_time, title, supervisor_id } = req.body;

    if (!day_off_type || !start_date_time || !end_date_time || !title?.trim() || !supervisor_id) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const request = await DayOffRequestModel.findById(id);
    if (!request) {
      res.status(404).json({ success: false, message: "Request not found" });
      return;
    }

    if (request.status !== "Pending") {
      res.status(400).json({ success: false, message: "Only pending requests can be edited" });
      return;
    }

    const startDate = new Date(start_date_time);
    const endDate   = new Date(end_date_time);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({ success: false, message: "Invalid date format" });
      return;
    }

    if (endDate < startDate) {
      res.status(400).json({ success: false, message: "End date must be later than start date" });
      return;
    }

    if (day_off_type === "HALF_DAY" && startDate.toDateString() !== endDate.toDateString()) {
      res.status(400).json({ success: false, message: "Half day leave must be within the same day" });
      return;
    }

    let date_off_number = 0;
    if (day_off_type === "HALF_DAY") {
      date_off_number = 0.5;
    } else if (day_off_type === "FULL_DAY") {
      const diffTime = endDate.getTime() - startDate.getTime();
      date_off_number = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    request.day_off_type     = day_off_type;
    request.start_date_time  = start_date_time;
    request.end_date_time    = end_date_time;
    request.date_off_number  = date_off_number;
    request.title            = title;
    request.supervisor_id    = supervisor_id;
    await request.save();

    const updatedRequest = await DayOffRequestModel.findById(id).populate(getPopulateConfig());

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
      res.status(400).json({ success: false, message: "Only pending requests can be deleted" });
      return;
    }

    await request.deleteOne();
    res.status(200).json({ success: true, message: "Day off request deleted successfully" });
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
    const { employee_id, date, start_date, end_date, exclude_id } = req.query;

    if (!employee_id) {
      res.status(400).json({ success: false, message: "Employee ID is required" });
      return;
    }

    const query: any = {
      employee_id: employee_id as string,
      status: { $in: ["Pending", "Accepted"] },
    };

    if (exclude_id) {
      query._id = { $ne: exclude_id };
    }

    if (date && !start_date && !end_date) {
      const checkDate = new Date(date as string);
      if (isNaN(checkDate.getTime())) {
        res.status(400).json({ success: false, message: "Invalid date format" });
        return;
      }
      const startOfDay = new Date(checkDate); startOfDay.setHours(0,  0,  0,  0);
      const endOfDay   = new Date(checkDate); endOfDay.setHours(23, 59, 59, 999);
      query.$or = [
        { day_off_type: "FULL_DAY",  start_date_time: { $lte: endOfDay   }, end_date_time: { $gte: startOfDay } },
        { day_off_type: "HALF_DAY",  start_date_time: { $gte: startOfDay, $lte: endOfDay } },
      ];
    } else if (start_date && end_date && !date) {
      const startDate = new Date(start_date as string);
      const endDate   = new Date(end_date   as string);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({ success: false, message: "Invalid date format" });
        return;
      }
      if (endDate < startDate) {
        res.status(400).json({ success: false, message: "End date cannot be before start date" });
        return;
      }
      const s = new Date(startDate); s.setHours(0,  0,  0,  0);
      const e = new Date(endDate);   e.setHours(23, 59, 59, 999);
      query.$or = [
        { start_date_time: { $lte: s }, end_date_time: { $gte: s } },
        { start_date_time: { $lte: e }, end_date_time: { $gte: e } },
        { start_date_time: { $gte: s }, end_date_time: { $lte: e } },
        { start_date_time: { $lte: s }, end_date_time: { $gte: e } },
      ];
    } else {
      res.status(400).json({ success: false, message: "Provide either date or start_date and end_date" });
      return;
    }

    const existingRequests = await DayOffRequestModel.find(query)
      .populate({
        path: "employee_id",
        select: "first_name_en last_name_en user_email employee_id department_id position_id",
        populate: [
          { path: "department_id", select: "department_name _id" },
          { path: "position_id",   select: "position_name _id"  }
        ]
      })
      .sort({ start_date_time: 1 });

    const conflicts = existingRequests.map(r => {
      const request  = r.toObject();
      const employee = request.employee_id as any;
      return {
        id:                  request._id,
        day_off_type:        request.day_off_type,
        start_date:          request.start_date_time,
        end_date:            request.end_date_time,
        status:              request.status,
        date_off_number:     request.date_off_number,
        employee_name:       employee ? `${employee.first_name_en || ''} ${employee.last_name_en || ''}`.trim() : 'Unknown',
        employee_department: employee?.department_id?.department_name || '',
        employee_position:   employee?.position_id?.position_name    || '',
      };
    });

    res.status(200).json({
      success:        true,
      has_conflict:   conflicts.length > 0,
      conflict_count: conflicts.length,
      conflicts,
      message: conflicts.length > 0 ? "Found overlapping day off requests" : "No conflicts found",
    });
  } catch (error) {
    console.error("CHECK DAY OFF CONFLICT ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
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
    const [total, pending, accepted, rejected, fullDay, halfDay] = await Promise.all([
      DayOffRequestModel.countDocuments(),
      DayOffRequestModel.countDocuments({ status: "Pending"   }),
      DayOffRequestModel.countDocuments({ status: "Accepted"  }),
      DayOffRequestModel.countDocuments({ status: "Rejected"  }),
      DayOffRequestModel.countDocuments({ day_off_type: "FULL_DAY" }),
      DayOffRequestModel.countDocuments({ day_off_type: "HALF_DAY" }),
    ]);

    res.json({
      success: true,
      stats: {
        total,
        byStatus: { pending, accepted, rejected },
        byType:   { fullDay, halfDay },
      },
    });
  } catch (error: any) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};