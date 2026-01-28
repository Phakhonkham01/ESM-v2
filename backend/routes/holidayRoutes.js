import express from "express";
import * as holidayController from "../controller/holidayController.js";

const router = express.Router();

// ========================================
// PUBLIC ROUTES
// ========================================
router.get("/", holidayController.getAllHolidays);
router.get("/range/date", holidayController.getHolidaysByDateRange);
router.get("/public", holidayController.getPublicHolidays);
router.get("/stats", holidayController.getHolidayStats);
router.get("/user/:user_id", holidayController.getUserHolidays);
router.get("/:id", holidayController.getHolidayById);
router.post("/check-overlap", holidayController.checkOverlapHolidays);

// ========================================
// PROTECTED ROUTES
// ========================================
router.post("/", holidayController.createHoliday);
router.put("/:id", holidayController.updateHoliday);
router.delete("/:id", holidayController.deleteHoliday);

// ========================================
// ADMIN/MANAGER ROUTES
// ========================================
router.put("/:id/approve", holidayController.approveHoliday);
router.put("/:id/reject", holidayController.rejectHoliday);

export default router;
