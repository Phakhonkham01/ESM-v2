// ==================== requestController.ts ====================
import { Request, Response } from "express";
import RequestModel from "../models/requestOTandFieldWork";
import mongoose from "mongoose";

/* ============================================================
   Helpers
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
   CREATE
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
    } = req.body;

    if (
      !user_id ||
      !supervisor_id ||
      !date ||
      !title ||
      !start_hour ||
      !end_hour
    ) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(user_id) ||
      !mongoose.Types.ObjectId.isValid(supervisor_id)
    ) {
      res.status(400).json({ message: "Invalid user_id or supervisor_id" });
      return;
    }

    if (!["OT", "FIELD_WORK"].includes(title)) {
      res.status(400).json({ message: "Invalid title" });
      return;
    }

    if (!isValidTime(start_hour) || !isValidTime(end_hour)) {
      res.status(400).json({ message: "Invalid time format (HH:mm)" });
      return;
    }

    if (toMinutes(end_hour) <= toMinutes(start_hour)) {
      res.status(400).json({ message: "End time must be later than start time" });
      return;
    }

    let fuelPrice = 0;
    if (title === "FIELD_WORK") {
      if (fuel == null || isNaN(fuel) || Number(fuel) <= 0) {
        res.status(400).json({ message: "Fuel price is required" });
        return;
      }
      fuelPrice = Number(fuel);
    }

    const newRequest = await RequestModel.create({
      user_id,
      supervisor_id,
      date,
      title,
      start_hour,
      end_hour,
      fuel: fuelPrice,
      reason,
      status: "Pending",
    });

    res.status(201).json({
      message: "Request submitted successfully",
      request: newRequest,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/* ============================================================
   READ
============================================================ */
export const getAllRequests = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status, title } = req.query;

    const query: any = {};

    // Filter by date (frontend ส่ง startDate / endDate)
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      // ให้รวมวันสุดท้ายเต็มวัน
      end.setHours(23, 59, 59, 999);

      query.date = { $gte: start, $lte: end };
    }

    // Filter by status
    if (status && typeof status === "string") {
      query.status = status;
    }

    // Filter by title
    if (title && typeof title === "string") {
      query.title = title;
    }

    const requests = await RequestModel.find(query)
      .populate("user_id", "first_name_en last_name_en email department_id")
      .populate("supervisor_id", "first_name_en last_name_en email")
      .sort({ date: -1 }); // ใช้ date ไม่ใช่ created_at

    res.json({ requests });
  } catch (error: any) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};

export const getRequestsByUser = async (
  req: Request,
  res: Response
) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid userId" });
    return;
  }

  const requests = await RequestModel.find({ user_id: userId })
    .populate("supervisor_id", "first_name_en last_name_en email")
    .sort({ created_at: -1 });

  res.json({ requests });
};
// ในไฟล์ requestController.ts
export const getRequestsBySupervisor = async (
  req: Request,
  res: Response
) => {
  const { supervisorId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
    res.status(400).json({ message: "Invalid supervisorId" });
    return;
  }

  try {
    // วิธีที่ 1: Populate ข้อมูลทั้งหมดของ user
    const requests = await RequestModel.find({
      supervisor_id: supervisorId,
    })
    .populate({
      path: 'user_id',
      select: '-password', // ไม่เอา password
    })
    .sort({ created_at: -1 });

    res.json({ 
      message: "Successfully fetched requests",
      requests,
      count: requests.length 
    });
  } catch (error: any) {
    console.error('❌ Error in getRequestsBySupervisor:', error);
    res.status(500).json({ 
      message: "Error fetching supervisor requests", 
      error: error.message 
    });
  }
};

export const getRequestById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid request ID" });
    return;
  }

  const request = await RequestModel.findById(id)
    .populate("user_id", "first_name_en last_name_en email")
    .populate("supervisor_id", "first_name_en last_name_en email");

  if (!request) {
    res.status(404).json({ message: "Request not found" });
    return;
  }

  res.json({ request });
};

/* ============================================================
   UPDATE
============================================================ */

export const updateRequestStatus = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Pending", "Accept", "Reject"].includes(status)) {
    res.status(400).json({ message: "Invalid status" });
    return;
  }

  const updated = await RequestModel.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  res.json({ message: "Status updated", request: updated });
};

//update edit request
export const updateRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      start_hour,
      end_hour,
      fuel,
      reason,
      date,
    } = req.body;

    /* =====================
       Validate ID
    ===================== */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid request ID" });
      return;
    }

    /* =====================
       Find existing request
    ===================== */
    const existing = await RequestModel.findById(id);
    if (!existing) {
      res.status(404).json({ message: "Request not found" });
      return;
    }

    /* =====================
       Validate title
    ===================== */
    if (title && !["OT", "FIELD_WORK"].includes(title)) {
      res.status(400).json({ message: "Invalid title" });
      return;
    }

    const finalTitle = title ?? existing.title;

    /* =====================
       Validate time
    ===================== */
    const finalStart = start_hour ?? existing.start_hour;
    const finalEnd = end_hour ?? existing.end_hour;

    if (!isValidTime(finalStart) || !isValidTime(finalEnd)) {
      res.status(400).json({ message: "Invalid time format (HH:mm)" });
      return;
    }

    if (toMinutes(finalEnd) <= toMinutes(finalStart)) {
      res
        .status(400)
        .json({ message: "End time must be later than start time" });
      return;
    }

    /* =====================
       Fuel logic
    ===================== */
    let finalFuel = existing.fuel;

    if (finalTitle === "FIELD_WORK") {
      if (fuel == null || isNaN(fuel) || Number(fuel) <= 0) {
        res.status(400).json({
          message: "Fuel price is required for FIELD_WORK",
        });
        return;
      }
      finalFuel = Number(fuel);
    } else {
      // OT â†’ fuel always 0
      finalFuel = 0;
    }

    /* =====================
       Update request
    ===================== */
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
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("user_id", "first_name_en last_name_en email")
      .populate("supervisor_id", "first_name_en last_name_en email");

    res.json({
      message: "Request updated successfully",
      request: updated,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


/* ============================================================
   DELETE
============================================================ */

export const deleteRequest = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const deleted = await RequestModel.findByIdAndDelete(id);
  res.json({ message: "Request deleted", request: deleted });
};

/* ============================================================
   ANALYTICS
============================================================ */

export const getRequestStats = async (
  _: Request,
  res: Response
) => {
  const total = await RequestModel.countDocuments();
  const pending = await RequestModel.countDocuments({ status: "Pending" });
  const accepted = await RequestModel.countDocuments({ status: "Accept" });
  const rejected = await RequestModel.countDocuments({ status: "Reject" });

  res.json({
    total,
    pending,
    accepted,
    rejected,
  });
};