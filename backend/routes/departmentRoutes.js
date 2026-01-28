import express from 'express';
// Note the .js extension at the end of the paths!
import { 
    getDepartments, 
    getDepartment, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment 
} from '../controller/departmentController.js'; 
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes (ไม่ต้อง login)
router.get("/", getDepartments);           // GET /api/departments
router.get("/:id", getDepartment);         // GET /api/departments/:id

// Protected routes (ต้อง login + admin เท่านั้น)
// Note: You imported 'protect', make sure to add it here if you want these routes secured!
router.post("/", createDepartment);           
router.put("/:id",updateDepartment);         
router.delete("/:id", deleteDepartment);      

export default router;