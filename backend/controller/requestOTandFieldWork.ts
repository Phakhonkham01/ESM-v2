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
      !date ||
      !title ||
      !start_hour ||
      !end_hour ||
      !reason
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

    if (!VALID_TITLES.includes(title)) {
      res.status(400).json({ message: "Invalid title" });
      return;
    }

    if (!isValidTime(start_hour) || !isValidTime(end_hour)) {
      res.status(400).json({ message: "Invalid time format (HH:mm)" });
      return;
    }

    if (toMinutes(end_hour) <= toMinutes(start_hour)) {
      res
        .status(400)
        .json({ message: "End time must be later than start time" });
      return;
    }

    let fuelPrice = 0;
    if (title === "FIELD_WORK") {
      if (fuel == null || isNaN(fuel) || Number(fuel) <= 0) {
        res
          .status(400)
          .json({ message: "Fuel price is required for FIELD_WORK" });
        return;
      }
      fuelPrice = Number(fuel);
    }

    const request = await RequestModel.create({
      user_id,
      supervisor_id,
      date,
      title,
      start_hour,
      end_hour,
      fuel: fuelPrice,
      reason,
      description,
      date_off,
      status: "Pending",
    });

    res.status(201).json({
      message: "Request submitted successfully",
      request,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/* ============================================================
   READ ALL REQUESTS (FILTER)
============================================================ */

export const getAllRequests = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status, title } = req.query;
    const query: any = {};

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    if (status && VALID_STATUSES.includes(status as any)) {
      query.status = status;
    }

    if (title && VALID_TITLES.includes(title as any)) {
      query.title = title;
    }

    const requests = await RequestModel.find(query)
      .populate("user_id", "first_name_en last_name_en email department_id")
      .populate("supervisor_id", "first_name_en last_name_en email")
      .sort({ date: -1 });

    res.json({ requests });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch requests" });
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
      .populate("supervisor_id", "first_name_en last_name_en email")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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
      .populate({
        path: "user_id",
        select: "-password",
      })
      .sort({ createdAt: -1 });

    res.json({
      message: "Successfully fetched requests",
      count: requests.length,
      requests,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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
      .populate("user_id", "first_name_en last_name_en email")
      .populate("supervisor_id", "first_name_en last_name_en email");

    if (!request) {
      res.status(404).json({ message: "Request not found" });
      return;
    }

    res.json({ request });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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
    );

    if (!updated) {
      res.status(404).json({ message: "Request not found" });
      return;
    }

    res.json({ message: "Status updated", request: updated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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
      res
        .status(400)
        .json({ message: "End time must be later than start time" });
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
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid request ID" });
      return;
    }

    const deleted = await RequestModel.findByIdAndDelete(id);
    res.json({ message: "Request deleted", request: deleted });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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

    res.json({
      total,
      pending,
      accepted,
      rejected,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
