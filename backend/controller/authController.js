import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const registerUser = async (req, res) => {
  try {
    const { user_name, user_email, password, department_id, adminInviteToken, ceoInviteToken } = req.body;

    const userExists = await User.findOne({ user_email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    let role = "member";
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
      leave_days: 15
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
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const loginUser = async (req, res) => {
    try {
        const { user_email, password } = req.body;

        // ✅ ไม่ใช้ populate
        const user = await User.findOne({ user_email });
        
        if (!user) {
            return res.status(401).json({ message: "Invalid email" });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        console.log("🚀 ~ loginUser ~ user.password:", user.password)
        console.log("🚀 ~ loginUser ~ password:", password)
        
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        res.status(200).json({
            _id: user._id,
            user_name: user.user_name,
            user_email: user.user_email,
            role: user.role,
            department_id: user.department_id,
            leave_days: user.leave_days,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        // ✅ ไม่ใช้ populate
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('❌ Get profile error:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { user_name, user_email, department_id, password } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user_name) user.user_name = user_name;
        if (user_email) user.user_email = user_email;
        if (department_id) user.department_id = department_id;

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
    } catch (error) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
};