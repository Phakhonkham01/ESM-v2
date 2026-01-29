import { Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/authMiddleware';
import mongoose from 'mongoose';

// ================= Interfaces =================

interface RegisterBody {
    user_name: string;
    user_email: string;
    password: string;
    department_id?: mongoose.Types.ObjectId | null;
    adminInviteToken?: string;
    ceoInviteToken?: string;
    first_name_en: string;
    last_name_en: string;
    nickname_en?: string;
    first_name_la: string;
    last_name_la: string;
    nickname_la?: string;
    date_of_birth: string | Date;
    start_work: string | Date;
    gender?: 'male' | 'female' | 'other';
}

interface LoginBody {
    user_email: string;
    password: string;
}

interface UpdateProfileBody {
    user_name?: string;
    user_email?: string;
    department_id?: mongoose.Types.ObjectId;
    password?: string;
}

// ================= Helper Functions =================

const generateToken = (userId: mongoose.Types.ObjectId): string => {
    return jwt.sign(
        { id: userId }, 
        process.env.JWT_SECRET as string, 
        { expiresIn: "7d" }
    );
};

// ================= Controllers =================

export const registerUser = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { 
            user_name, 
            user_email, 
            password, 
            department_id, 
            adminInviteToken, 
            ceoInviteToken,
            first_name_en,
            last_name_en,
            nickname_en,
            first_name_la,
            last_name_la,
            nickname_la,
            date_of_birth,
            start_work,
            gender
        } = req.body as RegisterBody;

        const userExists = await User.findOne({ user_email });
        if (userExists) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        let role: 'CEO' | 'admin' | 'employee' | 'supervisor' = "employee";
        if (ceoInviteToken && ceoInviteToken === process.env.CEO_INVITE_TOKEN) {
            role = "CEO";
        } else if (adminInviteToken && adminInviteToken === process.env.ADMIN_INVITE_TOKEN) {
            role = "admin";
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            user_name,
            user_email,
            password: hashedPassword,
            department_id: department_id || null,
            role,
            leave_days: 15,
            first_name_en,
            last_name_en,
            nickname_en: nickname_en || '',
            first_name_la,
            last_name_la,
            nickname_la: nickname_la || '',
            date_of_birth: new Date(date_of_birth),
            start_work: new Date(start_work),
            gender: gender || 'male'
        });

        res.status(201).json({
            _id: user._id,
            user_name: user.user_name,
            user_email: user.user_email,
            role: user.role,
            department_id: user.department_id,
            leave_days: user.leave_days,
            token: generateToken(user._id),
        });
    } catch (error: any) {
        console.error('❌ Register error:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const loginUser = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { user_email, password } = req.body as LoginBody;

        const user = await User.findOne({ user_email });
        
        if (!user) {
            res.status(401).json({ message: "Invalid email" });
            return;
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        console.log("🚀 ~ loginUser ~ user.password:", user.password);
        console.log("🚀 ~ loginUser ~ password:", password);
        
        if (!isPasswordMatch) {
            res.status(401).json({ message: "Invalid password" });
            return;
        }

        // ✅ Return ข้อมูล user ทั้งหมดตาม model
        res.status(200).json({
            _id: user._id,
            user_name: user.user_name,
            user_email: user.user_email,
            role: user.role,
            department_id: user.department_id,
            leave_days: user.leave_days,
            status: user.status,
            
            // Personal Information (English)
            first_name_en: user.first_name_en,
            last_name_en: user.last_name_en,
            nickname_en: user.nickname_en,
            
            // Personal Information (Lao)
            first_name_la: user.first_name_la,
            last_name_la: user.last_name_la,
            nickname_la: user.nickname_la,
            
            // Basic Information
            date_of_birth: user.date_of_birth,
            start_work: user.start_work,
            gender: user.gender,
            
            // Position & Salary
            position_id: user.position_id,
            base_salary: user.base_salary,
            
            // Timestamps
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            
            // Token
            token: generateToken(user._id),
        });
    } catch (error: any) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getUserProfile = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }

        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json(user);
    } catch (error: any) {
        console.error('❌ Get profile error:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateUserProfile = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }

        const { user_name, user_email, department_id, password } = req.body as UpdateProfileBody;

        const user = await User.findById(req.user.id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (user_name) user.user_name = user_name;
        if (user_email) user.user_email = user_email;
        if (department_id) user.department_id = [department_id];

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await user.save();

        res.status(200).json({
            _id: updatedUser._id,
            user_name: updatedUser.user_name,
            user_email: updatedUser.user_email,
            role: updatedUser.role,
            department_id: updatedUser.department_id,
            leave_days: updatedUser.leave_days,
        });
    } catch (error: any) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};