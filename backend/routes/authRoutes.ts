import express, { Router, Response } from 'express';
import { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile 
} from '../controller/authController';
import { protect, AuthRequest } from '../middlewares/authMiddleware';

const router: Router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

router.get("/verify", protect, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

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

export default router;