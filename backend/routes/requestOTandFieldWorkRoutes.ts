// ==================== requestRoutes.ts ====================
import express from "express";
import {
  createRequest,
  getAllRequests,
  getRequestsByUser,
  getRequestsBySupervisor,
  getRequestById,
  updateRequestStatus,
  updateRequest,
  deleteRequest,
  getRequestStats,
} from "../controller/requestOTandFieldWork";

const router = express.Router();

/* ============================================================
   CREATE
   POST /api/requests
============================================================ */
router.post("/", createRequest);

/* ============================================================
   READ
============================================================ */
router.get("/", getAllRequests);
router.get("/analytics/stats", getRequestStats);
router.get("/user/:userId", getRequestsByUser);
router.get("/supervisor/:supervisorId", getRequestsBySupervisor);
router.get("/:id", getRequestById);

/* ============================================================
   UPDATE
============================================================ */
router.put("/:id/status", updateRequestStatus);
router.put("/:id", updateRequest);

/* ============================================================
   DELETE
============================================================ */
router.delete("/:id", deleteRequest);

export default router;
