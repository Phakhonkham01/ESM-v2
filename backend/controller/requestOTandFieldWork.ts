import { Request, Response } from "express";
import mongoose from "mongoose";
import RequestModel from "../models/requestOTandFieldWork";

/* ============================================================
   CONSTANTS
============================================================ */

const VALID_TITLES = ["OT", "FIELD_WORK"] as const;
const VALID_STATUSES = ["Pending", "Accepted", "Rejected"] as const;

/* ============================================================
   HELPERS
============================================================ */

const isValidTime = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/* ============================================================
   POPULATION HELPER
============================================================ */

const getPopulateConfig = () => [
  {
    path: "user_id",
    select: "user_name user_email first_name_en last_name_en nickname_en first_name_la last_name_la nickname_la department_id position_id",
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
    select: "user_name user_email first_name_en last_name_en first_name_la last_name_la _id"
  }
];

/* ============================================================
   CREATE REQUEST
============================================================ */

export const createRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      user_id,
      supervisor_id,
      date,
      title,
      start_hour,
      end_hour,
      fuel,
      reason,
      description,
      date_off,
    } = req.body;

    if (
      !user_id ||
      !supervisor_id ||
      !Array.isArray(supervisor_id) ||
      supervisor_id.length === 0 ||
      !date ||
      !title ||
      !start_hour ||
      !end_hour
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    const validSupervisorIds = supervisor_id.every((id: string) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (!validSupervisorIds) {
      res.status(400).json({ message: "Invalid supervisor IDs" });
      return;
    }

    if (!VALID_TITLES.includes(title)) {
      res.status(400).json({ message: "Invalid title. Must be 'OT' or 'FIELD_WORK'" });
      return;
    }

    if (!isValidTime(start_hour) || !isValidTime(end_hour)) {
      res.status(400).json({ message: "Invalid time format. Use HH:MM" });
      return;
    }

    if (toMinutes(end_hour) <= toMinutes(start_hour)) {
      res.status(400).json({ message: "End time must be later than start time" });
      return;
    }

    let finalFuel = 0;
    if (title === "FIELD_WORK") {
      if (fuel == null || isNaN(fuel) || Number(fuel) <= 0) {
        res.status(400).json({
          message: "Fuel price is required and must be greater than 0 for FIELD_WORK",
        });
        return;
      }
      finalFuel = Number(fuel);
    }

    const request = await RequestModel.create({
      user_id,
      supervisor_id,
      date,
      title,
      start_hour,
      end_hour,
      fuel: finalFuel,
      reason,
      description,
      date_off,
      status: "Pending",
    });

    const populatedRequest = await RequestModel.findById(request._id)
      .populate(getPopulateConfig());

    res.status(201).json({
      message: "Request submitted successfully",
      request: populatedRequest,
    });
  } catch (error: any) {
    console.error('❌ Backend error:', error);
    res.status(500).json({ message: error.message });
  }
};

/* ============================================================
   GET ALL REQUESTS
============================================================ */

export const getAllRequests = async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      status,
      title,
      search,
      department,
      year,
      month,
      page = '1',
      limit = '8',  // ✅ Default 8
    } = req.query;

    // ──────────────────────────────────────────────────
    // 1. Build MongoDB query for direct fields
    // ──────────────────────────────────────────────────
    const query: any = {};

    if (year && month) {
      const yearNum = parseInt(year as string);
      const monthNum = parseInt(month as string);
      const startOfMonth = new Date(yearNum, monthNum - 1, 1);
      const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (year) {
      const yearNum = parseInt(year as string);
      query.date = {
        $gte: new Date(yearNum, 0, 1),
        $lte: new Date(yearNum, 11, 31, 23, 59, 59, 999)
      };
    } else if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        query.date = { $gte: start, $lte: end };
      }
    }

    if (status && status !== '' && VALID_STATUSES.includes(status as any)) {
      query.status = status;
    }

    if (title && title !== '' && VALID_TITLES.includes(title as any)) {
      query.title = title;
    }

    // ──────────────────────────────────────────────────
    // 2. Fetch with population
    // ──────────────────────────────────────────────────
    let requests: any[] = await RequestModel.find(query)
      .populate(getPopulateConfig())
      .sort({ createdAt: -1 })
      .lean();

    // ──────────────────────────────────────────────────
    // 3. Post-filters (for nested fields)
    // ──────────────────────────────────────────────────
    if (department && department !== '' && department !== 'All Departments') {
      requests = requests.filter((r: any) => {
        const user = r.user_id;
        if (!user) return false;

        const userDepartment = user.department_id;
        if (!userDepartment) return false;

        if (Array.isArray(userDepartment)) {
          return userDepartment.some(dept =>
            dept?.department_name === department
          );
        }

        if (typeof userDepartment === 'object') {
          return userDepartment.department_name === department;
        }

        return false;
      });
    }

    if (search && (search as string).trim() !== '') {
      const term = (search as string).toLowerCase().trim();
      requests = requests.filter((r: any) => {
        const searchableFields = [
          r.title?.toLowerCase(),
          r.description?.toLowerCase(),
          r.reason?.toLowerCase(),
          r.user_id?.first_name_en?.toLowerCase(),
          r.user_id?.last_name_en?.toLowerCase(),
          r.user_id?.user_name?.toLowerCase(),
          r.user_id?.user_email?.toLowerCase(),
          r.user_id?.employee_id?.toLowerCase()
        ];
        return searchableFields.some(field => field && field.includes(term));
      });
    }

    // ──────────────────────────────────────────────────
    // 4. Pagination
    // ✅ FIX: || fallback prevents NaN from breaking Math.max
    // ──────────────────────────────────────────────────
    const total = requests.length;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, parseInt(limit as string) || 8);
    const skip = (pageNum - 1) * limitNum;
    const paginated = requests.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      count: paginated.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      requests: paginated
    });

  } catch (error: any) {
    console.error('❌ Get all requests error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
      error: error.message
    });
  }
};

/* ============================================================
   GET ALL REQUESTS WITH AGGREGATION (More Efficient for Large Datasets)
============================================================ */

export const getAllRequestsWithAggregation = async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      status,
      title,
      search,
      department,
      year,
      month,
      page = '1',
      limit = '8',  // ✅ Fixed: was '10'
    } = req.query;

    const pipeline: any[] = [];
    const matchQuery: any = {};

    if (year && month) {
      const yearNum = parseInt(year as string);
      const monthNum = parseInt(month as string);
      const startOfMonth = new Date(yearNum, monthNum - 1, 1);
      const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
      matchQuery.date = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (year) {
      const yearNum = parseInt(year as string);
      matchQuery.date = {
        $gte: new Date(yearNum, 0, 1),
        $lte: new Date(yearNum, 11, 31, 23, 59, 59, 999)
      };
    } else if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        matchQuery.date = { $gte: start, $lte: end };
      }
    }

    if (status && VALID_STATUSES.includes(status as any)) {
      matchQuery.status = status;
    }

    if (title && VALID_TITLES.includes(title as any)) {
      matchQuery.title = title;
    }

    if (Object.keys(matchQuery).length > 0) {
      pipeline.push({ $match: matchQuery });
    }

    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      }
    });
    pipeline.push({ $unwind: { path: '$user', preserveNullAndEmptyArrays: true } });

    pipeline.push({
      $lookup: {
        from: 'departments',
        localField: 'user.department_id',
        foreignField: '_id',
        as: 'department'
      }
    });
    pipeline.push({ $unwind: { path: '$department', preserveNullAndEmptyArrays: true } });

    if (department && department !== '' && department !== 'All Departments') {
      pipeline.push({
        $match: { 'department.department_name': department }
      });
    }

    if (search && (search as string).trim() !== '') {
      const term = (search as string).trim();
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: term, $options: 'i' } },
            { description: { $regex: term, $options: 'i' } },
            { 'user.first_name_en': { $regex: term, $options: 'i' } },
            { 'user.last_name_en': { $regex: term, $options: 'i' } },
            { 'user.user_email': { $regex: term, $options: 'i' } }
          ]
        }
      });
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await RequestModel.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // ✅ FIX: || fallback prevents NaN from breaking Math.max
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, parseInt(limit as string) || 8);
    const skip = (pageNum - 1) * limitNum;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    const requests = await RequestModel.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      requests
    });

  } catch (error: any) {
    console.error('❌ Aggregation error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
      error: error.message
    });
  }
};

/* ============================================================
   GET ALL REQUESTS OPTIMIZED
============================================================ */

export const getAllRequestsOptimized = async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      status,
      title,
      search,
      page = '1',
      limit = '8',  // ✅ Fixed: was '10'
    } = req.query;

    // ✅ FIX: || fallback prevents NaN from breaking Math.max
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, parseInt(limit as string) || 8);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        query.date = { $gte: start, $lte: end };
      }
    }

    if (status && status !== '' && VALID_STATUSES.includes(status as any)) {
      query.status = status;
    }

    if (title && title !== '' && VALID_TITLES.includes(title as any)) {
      query.title = title;
    }

    if (search && (search as string).trim() !== '') {
      const searchTerm = (search as string).trim();
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const total = await RequestModel.countDocuments(query);

    const requests = await RequestModel.find(query)
      .populate(getPopulateConfig())
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      requests
    });

  } catch (error: any) {
    console.error('❌ Get all requests error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
      error: error.message
    });
  }
};

/* ============================================================
   READ BY USER
============================================================ */

export const getRequestsByUser = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "Invalid userId" });
      return;
    }

    const requests = await RequestModel.find({ user_id: userId })
      .populate(getPopulateConfig())
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error: any) {
    console.error('❌ Get requests by user error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ============================================================
   READ BY SUPERVISOR
============================================================ */

export const getRequestsBySupervisor = async (
  req: Request,
  res: Response
) => {
  try {
    const { supervisorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
      res.status(400).json({ message: "Invalid supervisorId" });
      return;
    }

    const requests = await RequestModel.find({
      supervisor_id: supervisorId,
    })
      .populate(getPopulateConfig())
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Successfully fetched requests",
      count: requests.length,
      requests,
    });
  } catch (error: any) {
    console.error('❌ Get requests by supervisor error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ============================================================
   READ BY ID
============================================================ */

export const getRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid request ID" });
      return;
    }

    const request = await RequestModel.findById(id)
      .populate(getPopulateConfig());

    if (!request) {
      res.status(404).json({
        success: false,
        message: "Request not found"
      });
      return;
    }

    res.json({
      success: true,
      request
    });
  } catch (error: any) {
    console.error('❌ Get request by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ============================================================
   UPDATE STATUS
============================================================ */

export const updateRequestStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid request ID" });
      return;
    }

    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    const updated = await RequestModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate(getPopulateConfig());

    if (!updated) {
      res.status(404).json({ message: "Request not found" });
      return;
    }

    res.json({
      success: true,
      message: "Status updated",
      request: updated
    });
  } catch (error: any) {
    console.error('❌ Update status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ============================================================
   UPDATE REQUEST (EDIT)
============================================================ */

export const updateRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, start_hour, end_hour, fuel, reason, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid request ID" });
      return;
    }

    const existing = await RequestModel.findById(id);
    if (!existing) {
      res.status(404).json({ message: "Request not found" });
      return;
    }

    const finalTitle = title ?? existing.title;
    if (!VALID_TITLES.includes(finalTitle)) {
      res.status(400).json({ message: "Invalid title" });
      return;
    }

    const finalStart = start_hour ?? existing.start_hour;
    const finalEnd = end_hour ?? existing.end_hour;

    if (!isValidTime(finalStart) || !isValidTime(finalEnd)) {
      res.status(400).json({ message: "Invalid time format" });
      return;
    }

    if (toMinutes(finalEnd) <= toMinutes(finalStart)) {
      res.status(400).json({ message: "End time must be later than start time" });
      return;
    }

    let finalFuel = 0;
    if (finalTitle === "FIELD_WORK") {
      if (fuel == null || isNaN(fuel) || Number(fuel) <= 0) {
        res.status(400).json({
          message: "Fuel price is required for FIELD_WORK",
        });
        return;
      }
      finalFuel = Number(fuel);
    }

    const updated = await RequestModel.findByIdAndUpdate(
      id,
      {
        title: finalTitle,
        start_hour: finalStart,
        end_hour: finalEnd,
        fuel: finalFuel,
        reason: reason ?? existing.reason,
        date: date ?? existing.date,
      },
      { new: true, runValidators: true }
    ).populate(getPopulateConfig());

    res.json({
      success: true,
      message: "Request updated successfully",
      request: updated,
    });
  } catch (error: any) {
    console.error('❌ Update request error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ============================================================
   DELETE
============================================================ */

export const deleteRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid request ID" });
      return;
    }

    const deleted = await RequestModel.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Request not found"
      });
      return;
    }

    res.json({
      success: true,
      message: "Request deleted successfully",
      request: deleted
    });
  } catch (error: any) {
    console.error('❌ Delete request error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ============================================================
   ANALYTICS
============================================================ */

export const getRequestStats = async (
  _: Request,
  res: Response
) => {
  try {
    // ✅ Bonus: parallel queries for better performance
    const [total, pending, accepted, rejected, ot, fieldWork] = await Promise.all([
      RequestModel.countDocuments(),
      RequestModel.countDocuments({ status: "Pending" }),
      RequestModel.countDocuments({ status: "Accepted" }),
      RequestModel.countDocuments({ status: "Rejected" }),
      RequestModel.countDocuments({ title: "OT" }),
      RequestModel.countDocuments({ title: "FIELD_WORK" }),
    ]);

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
          ot,
          fieldWork,
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