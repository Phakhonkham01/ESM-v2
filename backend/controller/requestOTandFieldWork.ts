import { Request, Response } from "express";
import mongoose from "mongoose";
import RequestModel from "../models/requestOTandFieldWork";

/* ============================================================
   CONSTANTS
============================================================ */

const VALID_TITLES = ["OT", "FIELD_WORK"] as const;
const VALID_STATUSES = ["Pending", "Accepted", "Rejected"] as const;
const COST_PER_KM = 3000; // ค่าใช้จ่ายต่อกิโลเมตร (LAK/km)

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

// ✅ Helper คำนวณค่าน้ำมันจากระยะทาง
const calculateFuelCost = (distance: number): number => {
  return distance * COST_PER_KM;
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
  },
  {
    path: "employee_id",
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
      employee_id,
      date,
      title,
      start_hour,
      end_hour,
      distance, // ✅ รับ distance แทน fuel
      reason,
      description,
      date_off,
    } = req.body;

    // ตรวจสอบ required fields
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

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    // Validate supervisor IDs
    const validSupervisorIds = supervisor_id.every((id: string) => 
      mongoose.Types.ObjectId.isValid(id)
    );
    
    if (!validSupervisorIds) {
      res.status(400).json({ message: "Invalid supervisor IDs" });
      return;
    }

    // ✅ Validate employee IDs (optional field)
    if (employee_id) {
      if (!Array.isArray(employee_id)) {
        res.status(400).json({ message: "employee_id must be an array" });
        return;
      }
      const validEmployeeIds = employee_id.every((id: string) => 
        mongoose.Types.ObjectId.isValid(id)
      );
      if (!validEmployeeIds) {
        res.status(400).json({ message: "Invalid employee IDs" });
        return;
      }
    }

    // Validate title
    if (!VALID_TITLES.includes(title)) {
      res.status(400).json({ message: "Invalid title. Must be 'OT' or 'FIELD_WORK'" });
      return;
    }

    // Validate time format
    if (!isValidTime(start_hour) || !isValidTime(end_hour)) {
      res.status(400).json({ message: "Invalid time format. Use HH:MM" });
      return;
    }

    // Validate time logic
    if (toMinutes(end_hour) <= toMinutes(start_hour)) {
      res.status(400).json({ message: "End time must be later than start time" });
      return;
    }

    // ✅ Validate distance and calculate fuel for FIELD_WORK
    let finalDistance = 0;
    let finalFuel = 0;
    
    if (title === "FIELD_WORK") {
      if (distance == null || isNaN(distance) || Number(distance) <= 0) {
        res.status(400).json({
          message: "Distance is required and must be greater than 0 for FIELD_WORK",
        });
        return;
      }
      finalDistance = Number(distance);
      finalFuel = calculateFuelCost(finalDistance); // ✅ คำนวณค่าน้ำมันจากระยะทาง
    }

    // Create request
    const request = await RequestModel.create({
      user_id,
      supervisor_id,
      employee_id: employee_id || [],
      date,
      title,
      start_hour,
      end_hour,
      distance: finalDistance, // ✅ บันทึกระยะทาง
      fuel: finalFuel, // ✅ บันทึกค่าน้ำมันที่คำนวณได้
      reason,
      description,
      date_off,
      status: "Pending",
    });

    // Populate before sending response
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
    const { startDate, endDate, status, title } = req.query;
    const query: any = {};

    // Filter by date range
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    // Filter by status
    if (status && VALID_STATUSES.includes(status as any)) {
      query.status = status;
    }

    // Filter by title
    if (title && VALID_TITLES.includes(title as any)) {
      query.title = title;
    }

    const requests = await RequestModel.find(query)
      .populate(getPopulateConfig())
      .sort({ createdAt: -1 });

    res.json({ 
      success: true,
      count: requests.length,
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
    )
      .populate(getPopulateConfig());

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
    const { title, start_hour, end_hour, distance, reason, date, employee_id } = req.body;

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

    // ✅ Validate employee IDs if provided
    if (employee_id !== undefined) {
      if (!Array.isArray(employee_id)) {
        res.status(400).json({ message: "employee_id must be an array" });
        return;
      }
      const validEmployeeIds = employee_id.every((id: string) => 
        mongoose.Types.ObjectId.isValid(id)
      );
      if (!validEmployeeIds) {
        res.status(400).json({ message: "Invalid employee IDs" });
        return;
      }
    }

    // ✅ Calculate distance and fuel
    let finalDistance = existing.distance;
    let finalFuel = existing.fuel;
    
    if (finalTitle === "FIELD_WORK") {
      if (distance !== undefined) {
        if (distance == null || isNaN(distance) || Number(distance) <= 0) {
          res.status(400).json({
            message: "Distance is required and must be greater than 0 for FIELD_WORK",
          });
          return;
        }
        finalDistance = Number(distance);
        finalFuel = calculateFuelCost(finalDistance); // ✅ คำนวณค่าน้ำมันจากระยะทาง
      }
    } else {
      // ถ้าเปลี่ยนเป็น OT ให้ reset distance และ fuel
      finalDistance = 0;
      finalFuel = 0;
    }

    const updateData: any = {
      title: finalTitle,
      start_hour: finalStart,
      end_hour: finalEnd,
      distance: finalDistance, // ✅ บันทึกระยะทาง
      fuel: finalFuel, // ✅ บันทึกค่าน้ำมันที่คำนวณได้
      reason: reason ?? existing.reason,
      date: date ?? existing.date,
    };

    // ✅ อัพเดท employee_id ถ้ามี
    if (employee_id !== undefined) {
      updateData.employee_id = employee_id;
    }

    const updated = await RequestModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate(getPopulateConfig());

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
    const total = await RequestModel.countDocuments();
    const pending = await RequestModel.countDocuments({ status: "Pending" });
    const accepted = await RequestModel.countDocuments({ status: "Accepted" });
    const rejected = await RequestModel.countDocuments({ status: "Rejected" });
    const ot = await RequestModel.countDocuments({ title: "OT" });
    const fieldWork = await RequestModel.countDocuments({ title: "FIELD_WORK" });

    // ✅ คำนวณสถิติเพิ่มเติมสำหรับ Field Work
    const fieldWorkRequests = await RequestModel.find({ 
      title: "FIELD_WORK",
      status: "Accepted" 
    });
    
    const totalDistance = fieldWorkRequests.reduce((sum, req) => sum + (req.distance || 0), 0);
    const totalFuelCost = fieldWorkRequests.reduce((sum, req) => sum + (req.fuel || 0), 0);

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
        },
        fieldWorkStats: {
          totalDistance: totalDistance.toFixed(2),
          totalFuelCost: totalFuelCost.toFixed(2),
          averageDistance: fieldWorkRequests.length > 0 
            ? (totalDistance / fieldWorkRequests.length).toFixed(2) 
            : 0,
          costPerKm: COST_PER_KM
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