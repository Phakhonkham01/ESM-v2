import express, { Router } from 'express';
import { 
    getDepartments, 
    getDepartment, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment 
} from '../controller/departmentController';
import { protect } from '../middlewares/authMiddleware';

const router: Router = express.Router();

// Public routes (ไม่ต้อง login)
router.get("/", getDepartments);           // GET /api/departments
router.get("/:id", getDepartment);         // GET /api/departments/:id

// Protected routes (ต้อง login + admin เท่านั้น)
// Note: Add protect middleware if needed
router.post("/", createDepartment);           
router.put("/:id", updateDepartment);         
router.delete("/:id", deleteDepartment);      

export default router;
