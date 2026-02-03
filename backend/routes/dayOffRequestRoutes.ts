import express from "express";
import {
  createDayOffRequest,
  getAllDayOffRequests,
  getDayOffRequestsAllUser,
  getDayOffRequestsByUser,
  updateDayOffRequestStatus,
  updateDayOffRequest,
  deleteDayOffRequest,
} from "../controller/dayOffRequestController.ts";

const router = express.Router();

// POST /api/day-off-requests
router.post("/", createDayOffRequest);

router.get("/", getAllDayOffRequests);

// GET /api/day-off-requests/user/:userId
router.get("/all-users", getDayOffRequestsAllUser);

// GET /api/day-off-requests/user/:userId
router.get("/user/:userId", getDayOffRequestsByUser);

// PATCH /api/day-off-requests/:id/status
router.patch("/:id/status", updateDayOffRequestStatus);
router.put("/:id", updateDayOffRequest)
router.delete("/:id", deleteDayOffRequest)

export default router;