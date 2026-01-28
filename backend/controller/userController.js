import mongoose from "mongoose";
import User from '../models/User.js';
import bcrypt from "bcryptjs";

// @desc    สร้าง user ใหม่
// @route   POST /api/users
// @access  Admin / CEO
export const createUser = async (req, res) => {
  try {
    const {
      user_name,
      user_email,
      password,
      role,
      department_id,
      leave_days,
      status,
      // ✅ ฟิลด์ใหม่
      first_name_en,
      last_name_en,
      nickname_en,
      first_name_la,
      last_name_la,
      nickname_la,
      date_of_birth,
      start_work,
      gender,
      position_id,
      base_salary,
    } = req.body;

    console.log('📥 Create user request body:', req.body);

    // ✅ ตรวจสอบฟิลด์ที่จำเป็น
    if (!first_name_en || !last_name_en || !first_name_la || !last_name_la) {
      return res.status(400).json({ 
        message: "First name and last name (both EN and LA) are required." 
      });
    }

    if (!date_of_birth || !start_work) {
      return res.status(400).json({ 
        message: "Date of birth and start work date are required." 
      });
    }

    // เช็ค email ซ้ำ
    const existingUser = await User.findOne({ user_email });
    if (existingUser) {
      return res.status(400).json({ message: "The email is already in use." });
    }

    // ✅ สร้าง user พร้อมฟิลด์ใหม่
    const user = new User({
      user_name,
      user_email,
      password,
      role,
      department_id: department_id || null,
      leave_days: leave_days || 15,
      status: status || "work day",
      // ฟิลด์ใหม่
      first_name_en,
      last_name_en,
      nickname_en: nickname_en || '',
      first_name_la,
      last_name_la,
      nickname_la: nickname_la || '',
      date_of_birth: new Date(date_of_birth),
      start_work: new Date(start_work),
      gender: gender || 'male',
      position_id: position_id || null,
      base_salary: base_salary || 0,
    });

    console.log('💾 Saving user:', user);
    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        user_name: user.user_name,
        user_email: user.user_email,
        role: user.role,
        department_id: user.department_id,
        leave_days: user.leave_days,
        status: user.status,
        first_name_en: user.first_name_en,
        last_name_en: user.last_name_en,
        nickname_en: user.nickname_en,
        first_name_la: user.first_name_la,
        last_name_la: user.last_name_la,
        nickname_la: user.nickname_la,
        date_of_birth: user.date_of_birth,
        start_work: user.start_work,
        gender: user.gender,
        position_id: user.position_id,
        base_salary: user.base_salary,
      },
    });
  } catch (err) {
    console.error('❌ Create user error:', err);
    res.status(500).json({ 
      message: "An error occurred while creating the user.",
      error: err.message 
    });
  }
};

// @desc    ดึงรายชื่อผู้ใช้ทั้งหมด
// @route   GET /api/users
// @access  Admin / CEO
export const getUsers = async (req, res) => {
  const searchTerm = req.query.search || "";
  const roleFilter = req.query.role || null;
  console.log("🚀 ~ roleFilter:", roleFilter);
  console.log("🚀 ~ searchTerm:", searchTerm);

  try {
    const sortField = req.query.sort || "createdAt";
    const order = req.query.order === "desc" ? -1 : 1;

    const allowedSortFields = [
      "user_name",
      "user_email",
      "role",
      "status",
      "leave_days",
      "createdAt",
    ];

    const finalSortField = allowedSortFields.includes(sortField)
      ? sortField
      : "createdAt";

    const query = {
      user_name: { $regex: searchTerm, $options: "i" },
    };

    if (roleFilter) {
      query.role = { $regex: roleFilter, $options: "i" };
    }

    const users = await User.find(query)
      .sort({ [finalSortField]: order })
      .populate("department_id", "department_name")
      .populate("position_id", "position_name"); // ✅ เพิ่ม populate position

    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: "An error occurred while retrieving user data." 
    });
  }
};

// @desc    ดึง user ตาม ID
// @route   GET /api/users/:id
// @access  Admin / CEO / ตัวเอง
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("department_id", "department_name")
      .populate("position_id", "position_name"); // ✅ เพิ่ม populate position

    if (!user) {
      return res.status(404).json({ message: "This user was not found." });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: "An error occurred while retrieving user data." 
    });
  }
};

// @desc    อัปเดตข้อมูล user
// @route   PUT /api/users/:id
// @access  Admin / CEO / ตัวเอง
export const updateUser = async (req, res) => {
  try {
    const { 
      user_name, 
      user_email, 
      role, 
      department_id, 
      leave_days, 
      status, 
      password, 
      new_password,
      // ✅ ฟิลด์ใหม่
      first_name_en,
      last_name_en,
      nickname_en,
      first_name_la,
      last_name_la,
      nickname_la,
      date_of_birth,
      start_work,
      gender,
      position_id,
      base_salary,
    } = req.body;
    
    console.log("🚀 ~ Update user request body:", req.body);

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "This user was not found." });
    }

    // ✅ อัพเดทฟิลด์เดิม
    if (user_name) user.user_name = user_name;
    if (user_email) user.user_email = user_email;
    if (role) user.role = role;
    if (department_id !== undefined) user.department_id = department_id;
    if (leave_days !== undefined) user.leave_days = leave_days;
    if (status) user.status = status;
    if (new_password) user.password = new_password;

    // ✅ อัพเดทฟิลด์ใหม่
    if (first_name_en) user.first_name_en = first_name_en;
    if (last_name_en) user.last_name_en = last_name_en;
    if (nickname_en !== undefined) user.nickname_en = nickname_en;
    if (first_name_la) user.first_name_la = first_name_la;
    if (last_name_la) user.last_name_la = last_name_la;
    if (nickname_la !== undefined) user.nickname_la = nickname_la;
    if (date_of_birth) user.date_of_birth = new Date(date_of_birth);
    if (start_work) user.start_work = new Date(start_work);
    if (gender) user.gender = gender;
    if (position_id !== undefined) user.position_id = position_id;
    if (base_salary !== undefined) user.base_salary = base_salary;

    await user.save();

    res.status(200).json({ message: "User update completed.", user });
  } catch (err) { 
    console.error('❌ Update user error:', err);
    res.status(500).json({ 
      message: "An error occurred while updating the user.",
      error: err.message 
    });
  }
};

// @desc    ลบ user
// @route   DELETE /api/users/:id
// @access  Admin / CEO
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User successfully deleted",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the user",
    });
  }
};

// @desc    Get users on leave today
// @route   GET /api/holidays/users-on-leave
// @access  Private
export const getUsersOnLeave = async (req, res) => {
    try {
        const date = req.query.date ? new Date(req.query.date) : new Date();
        const users = await User.findUsersOnLeave(date);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};