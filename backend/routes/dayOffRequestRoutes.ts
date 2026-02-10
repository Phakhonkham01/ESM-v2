import express from "express";
import {
  createDayOffRequest,
  getAllDayOffRequests,
  getDayOffRequestsAllUser,
  getDayOffRequestsByUser,
  getDayOffRequestById,        // ✅ เพิ่มบรรทัดนี้
  updateDayOffRequestStatus,
  updateDayOffRequest,
  deleteDayOffRequest,
  checkDayOffConflict
} from "../controller/dayOffRequestController.ts";

const router = express.Router();

router.post("/", createDayOffRequest);
router.get('/check-conflict', checkDayOffConflict);
router.get("/allrequests", getAllDayOffRequests);
router.get("/allusers", getDayOffRequestsAllUser);
router.get("/user/:userId", getDayOffRequestsByUser);
router.get("/:id", getDayOffRequestById);          // ✅ เพิ่มบรรทัดนี้
router.patch("/:id/status", updateDayOffRequestStatus);
router.put("/:id", updateDayOffRequest);
router.delete("/:id", deleteDayOffRequest);

export default router;