// routes/sat_sunRequestRoutes.ts
import express from "express";
import {
  createSatSunRequest,
  getAllSatSunRequests,
  getSatSunRequestsAllUser,
  getSatSunRequestsByUser,
  getSatSunRequestById,
  getSatSunRequestsForSupervisorDashboard,
  updateSatSunRequestStatus,
  updateSatSunRequest,
  deleteSatSunRequest,
  checkSatSunConflict,
  getSatSunStats
} from "../controller/sat_sunRequestController.ts";

const router = express.Router();

// Create
router.post("/", createSatSunRequest);

// Read
router.get('/check-conflict', checkSatSunConflict);
router.get('/stats', getSatSunStats);
router.get("/allrequests", getAllSatSunRequests);
router.get("/allusers", getSatSunRequestsAllUser);
router.get("/supervisor/:supervisorId", getSatSunRequestsForSupervisorDashboard);
router.get("/user/:userId", getSatSunRequestsByUser);
router.get("/:id", getSatSunRequestById);

// Update
router.patch("/:id/status", updateSatSunRequestStatus);
router.put("/:id", updateSatSunRequest);

// Delete
router.delete("/:id", deleteSatSunRequest);

export default router;