import express from 'express';
import { 
    getPositions, 
    getPosition, 
    createPosition, 
    updatePosition, 
    deletePosition,
    getPositionsByDepartment
} from '../controller/positionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get("/", getPositions);                                    // GET /api/positions
router.get("/:id", getPosition);                                  // GET /api/positions/:id
router.get("/department/:departmentId", getPositionsByDepartment); // GET /api/positions/department/:departmentId

// Protected routes (ต้อง login + admin)
router.post("/", createPosition);           
router.put("/:id", updatePosition);         
router.delete("/:id", deletePosition);      

export default router;