// Change requires to imports
import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile 
} from '../controller/authController.js'; // Added .js extension
import { protect } from '../middlewares/authMiddleware.js'; // Added .js extension

const router = express.Router();

// ... (your routes remain the same) ...
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

router.get("/verify", protect, (req, res) => {
    res.status(200).json({
        valid: true,
        user: {
            _id: req.user._id,
            user_name: req.user.user_name,
            user_email: req.user.user_email,
            role: req.user.role,
            department_id: req.user.department_id,
            leave_days: req.user.leave_days
        }
    });
});

// Change module.exports to export default
export default router;