import mongoose from "mongoose";
import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import bcrypt from "bcryptjs";

// ================= Interfaces =================

interface CreateUserBody {
  user_name: string;
  user_email: string;
  password: string;
  role?: 'CEO' | 'admin' | 'employee' | 'supervisor';
  department_id?: mongoose.Types.ObjectId[] | null;
  leave_days?: number;
   actual_leave_days?: number;   // ← new optional field
  status?: 'Active' | 'On Leave' | 'Inactive';
  first_name_en: string;
  last_name_en: string;
  nickname_en?: string;
  first_name_la: string;
  last_name_la: string;
  nickname_la?: string;
  date_of_birth: string | Date;
  start_work: string | Date;
  gender?: 'male' | 'female' | 'other';
  position_id?: mongoose.Types.ObjectId | null;
  base_salary?: number;
}

interface UpdateUserBody extends Partial<CreateUserBody> {
  new_password?: string;
    actual_leave_days?: number;   // ← explicitly allowed
}

interface GetUsersQuery {
  search?: string;
  role?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface GetUsersOnLeaveQuery {
  date?: string;
}

// ================= Controllers =================

// @desc    สร้าง user ใหม่
// @route   POST /api/users
// @access  Admin / CEO
export const createUser = async (
  req: Request<{}, {}, CreateUserBody>,
  res: Response
): Promise<void> => {
  try {
    const {
      user_name,
      user_email,
      password,
      role,
      department_id,
      leave_days,
      actual_leave_days,    // ← get from body
      status,
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
      res.status(400).json({ 
        message: "First name and last name (both EN and LA) are required." 
      });
      return;
    }

    if (!date_of_birth || !start_work) {
      res.status(400).json({ 
        message: "Date of birth and start work date are required." 
      });
      return;
    }

    // เช็ค email ซ้ำ
    const existingUser = await User.findOne({ user_email });
    if (existingUser) {
      res.status(400).json({ message: "The email is already in use." });
      return;
    }

    // ✅ สร้าง user พร้อมฟิลด์ใหม่
    const user = new User({
      user_name,
      user_email,
      password,
      role,
      department_id: department_id || null,
      leave_days: leave_days || 15,
           actual_leave_days: actual_leave_days ?? (leave_days || 15), // ← priority logic
      status: status || "Active",
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
  } catch (err: any) {
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
export const getUsers = async (
  req: Request<{}, {}, {}, GetUsersQuery>,
  res: Response
): Promise<void> => {
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

    const query: any = {
      user_name: { $regex: searchTerm, $options: "i" },
    };

    if (roleFilter) {
      query.role = { $regex: roleFilter, $options: "i" };
    }

    const users = await User.find(query)
      .sort({ [finalSortField]: order })
      .populate("department_id", "department_name")
      .populate("position_id", "position_name");

    res.status(200).json(users);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ 
      message: "An error occurred while retrieving user data." 
    });
  }
};

// @desc    ดึง user ตาม ID
// @route   GET /api/users/:id
// @access  Admin / CEO / ตัวเอง
export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id)
      .populate("department_id", "department_name")
      .populate("position_id", "position_name");

    if (!user) {
      res.status(404).json({ message: "This user was not found." });
      return;
    }

    res.status(200).json(user);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ 
      message: "An error occurred while retrieving user data." 
    });
  }
};

// @desc    อัปเดตข้อมูล user
// @route   PUT /api/users/:id
// @access  Admin / CEO / ตัวเอง
export const updateUser = async (
  req: Request<{ id: string }, {}, UpdateUserBody>,
  res: Response
): Promise<void> => {
  try {
    const { 
      user_name, 
      user_email, 
      role, 
      department_id, 
      leave_days, 
            actual_leave_days,   // ← may be provided
      status, 
      password, 
      new_password,
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
      res.status(404).json({ message: "This user was not found." });
      return;
    }

    // ✅ อัพเดทฟิลด์เดิม
    if (user_name) user.user_name = user_name;
    if (user_email) user.user_email = user_email;
    if (role) user.role = role;
    if (department_id !== undefined) user.department_id = department_id;
    if (leave_days !== undefined) user.leave_days = leave_days;
     if (actual_leave_days !== undefined) user.actual_leave_days = actual_leave_days; // ← explicit update
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
  } catch (err: any) { 
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
export const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User successfully deleted",
    });
  } catch (error: any) {
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
export const getUsersOnLeave = async (
  req: Request<{}, {}, {}, GetUsersOnLeaveQuery>,
  res: Response
): Promise<void> => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const users = await User.findUsersOnLeave(date);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};