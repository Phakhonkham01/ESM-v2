
import User from "../models/User.js";
import CronService from "../services/cron.js";

// ========================================
// CREATE HOLIDAY
// ========================================
export const createHoliday = async (req, res) => {
  try {
    // รับ user_id จาก body
    const holidayData = {
      ...req.body,
    };

    // ตรวจสอบว่ามี user_id หรือไม่
    if (!holidayData.user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่จริง
    const user = await User.findById(holidayData.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ตรวจสอบว่า holiday ซ้อนทับกันหรือไม่
    const holiday = new Holiday(holidayData);
    const overlapping = await holiday.checkOverlap();

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: "Holiday overlaps with existing holidays",
        data: overlapping,
      });
    }

    await holiday.save();

    // Populate ข้อมูลที่จำเป็น
    await holiday.populate([
      { path: "user_id", select: "user_name user_email" },
      { path: "approvedBy", select: "user_name user_email" },
    ]);

    res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      data: holiday,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET ALL HOLIDAYS
// ========================================
export const getAllHolidays = async (req, res) => {
  try {
    const {
      search = "",
      status,
      holiday_type,
      user_id,
      year,
      start_date,
      end_date,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (holiday_type) filter.holiday_type = holiday_type;
    if (user_id) filter.user_id = user_id;

    /** 🔍 SEARCH holiday_name */
    if (search) {
      filter.holiday_name = { $regex: search, $options: "i" };
      // หรือถ้าจะ search หลาย field
      // filter.$or = [
      //   { holiday_name: { $regex: search, $options: "i" } },
      //   { description: { $regex: search, $options: "i" } },
      // ];
    }

    /** 📅 Date filter */
    if (year) {
      filter.start_date = {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31, 23, 59, 59),
      };
    } else if (start_date || end_date) {
      filter.start_date = {};
      if (start_date) filter.start_date.$gte = new Date(start_date);
      if (end_date) filter.start_date.$lte = new Date(end_date);
    }

    /** 📄 Pagination */
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [holidays, total] = await Promise.all([
      Holiday.find(filter)
        .populate("user_id", "user_name user_email")
        .populate("approvedBy", "user_name user_email")
        .sort({ start_date: -1 }),
      // .skip(skip)
      // .limit(limitNum),
      Holiday.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: holidays,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET HOLIDAY BY ID
// ========================================
export const getHolidayById = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id)
      .populate("user_id", "user_name user_email")
      .populate("approvedBy", "user_name user_email");

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      success: true,
      data: holiday,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET HOLIDAYS BY USER
// ========================================
export const getUserHolidays = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { status, holiday_type, year } = req.query;

    const options = {};
    if (status) options.status = status;
    if (holiday_type) options.holiday_type = holiday_type;

    const holidays = await Holiday.findByUser(user_id, options);

    // กรองตามปีถ้ามี
    let filteredHolidays = holidays;
    if (year) {
      filteredHolidays = holidays.filter((holiday) => {
        const holidayYear = new Date(holiday.start_date).getFullYear();
        return holidayYear === parseInt(year);
      });
    }

    res.status(200).json({
      success: true,
      count: filteredHolidays.length,
      data: filteredHolidays,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET HOLIDAYS BY DATE RANGE
// ========================================
export const getHolidaysByDateRange = async (req, res) => {
  try {
    const { start_date, end_date, user_id, holiday_type } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "start_date and end_date are required",
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    // สร้าง filter เพิ่มเติม
    const additionalFilter = {};
    if (user_id) additionalFilter.user_id = user_id;
    if (holiday_type) additionalFilter.holiday_type = holiday_type;

    const holidays = await Holiday.findByDateRange(startDate, endDate).where(
      additionalFilter
    );

    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET PUBLIC HOLIDAYS
// ========================================
export const getPublicHolidays = async (req, res) => {
  try {
    const { year } = req.query;

    const holidays = await Holiday.findPublicHolidays(
      year ? parseInt(year) : null
    );

    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// UPDATE HOLIDAY
// ========================================
export const updateHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    // ตรวจสอบสิทธิ์
    const { requesting_user_id } = req.body;

    if (requesting_user_id) {
      const user = await User.findById(requesting_user_id);

      // เฉพาะเจ้าของหรือ admin เท่านั้นที่สามารถอัพเดทได้
      if (
        holiday.user_id.toString() !== requesting_user_id &&
        user?.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this holiday",
        });
      }
    }

    // ไม่ให้อัพเดท status โดยตรง (ให้ใช้ approve/reject endpoints แทน)
    const { status, approvedBy, comment, ...updateData } = req.body;

    // ตรวจสอบการซ้อนทับ (ถ้ามีการเปลี่ยนแปลงวันที่)
    if (
      (updateData.start_date || updateData.end_date) &&
      (updateData.start_date !== holiday.start_date ||
        updateData.end_date !== holiday.end_date)
    ) {
      // สร้าง holiday ชั่วคราวเพื่อตรวจสอบการซ้อนทับ
      const tempHoliday = new Holiday({
        ...holiday.toObject(),
        ...updateData,
        _id: holiday._id, // ใช้ _id เดิมเพื่อแยกตัวเองออก
      });

      const overlapping = await tempHoliday.checkOverlap();
      if (overlapping) {
        return res.status(400).json({
          success: false,
          message: "Updated dates overlap with existing holidays",
          data: overlapping,
        });
      }
    }

    // อัพเดทข้อมูล
    Object.assign(holiday, updateData);
    await holiday.save();

    await holiday.populate([
      { path: "user_id", select: "user_name user_email" },
      { path: "approvedBy", select: "user_name user_email" },
    ]);

    res.status(200).json({
      success: true,
      message: "Holiday updated successfully",
      data: holiday,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// DELETE HOLIDAY
// ========================================
export const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    const requesting_user_id = req.query.user_id || req.body.user_id;

    if (!requesting_user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findById(requesting_user_id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    const isOwner = holiday.user_id.toString() === requesting_user_id;
    const isAdmin = user.role === "admin";
    const isCEO = user.role === "CEO";

    // ===============================
    // 🔒 RULE 1: public holiday
    // ===============================
    if (holiday.holiday_type === "public") {
      if (!isAdmin && !isCEO) {
        return res.status(403).json({
          success: false,
          message: "Only admin or CEO can delete public holidays",
        });
      }
    }

    // ===============================
    // 🔒 RULE 2: private (leave request)
    // ===============================
    if (holiday.holiday_type === "private") {
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own leave request",
        });
      }

      if (user.role !== "admin" && user.role !== "employee") {
        return res.status(403).json({
          success: false,
          message: "Only admin or employee can delete leave requests",
        });
      }
    }

    await holiday.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Holiday deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ใน approveHoliday และ rejectHoliday functions
export const approveHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    const { approved_by, comment } = req.body;

    if (!approved_by) {
      return res.status(400).json({
        success: false,
        message: "approved_by (user_id) is required",
      });
    }

    // ตรวจสอบว่าเป็น admin, manager, หรือ CEO
    const user = await User.findById(approved_by);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ แก้ไข: เพิ่ม CEO เข้ามา
    const allowedRoles = ["admin", "manager", "ceo"];

    if (!allowedRoles.includes(user.role.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: "Only admin, manager, or CEO can approve holidays",
      });
    }

    await holiday.approve(approved_by, comment);

    await holiday.populate([
      { path: "user_id", select: "user_name user_email" },
      { path: "approvedBy", select: "user_name user_email" },
    ]);

    await CronService.updateUserStatuses();
    await CronService.verifyUserStatuses();

    res.status(200).json({
      success: true,
      message: "Holiday approved successfully",
      data: holiday,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    const { approved_by, comment } = req.body;

    if (!approved_by) {
      return res.status(400).json({
        success: false,
        message: "approved_by (user_id) is required",
      });
    }

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: "comment is required when rejecting a holiday",
      });
    }

    // ตรวจสอบว่าเป็น admin, manager, หรือ CEO
    const user = await User.findById(approved_by);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ แก้ไข: เพิ่ม CEO เข้ามา
    const allowedRoles = ["admin", "manager", "ceo"];

    if (!allowedRoles.includes(user.role.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: "Only admin, manager, or CEO can reject holidays",
      });
    }

    await holiday.reject(approved_by, comment);

    await holiday.populate([
      { path: "user_id", select: "user_name user_email" },
      { path: "approvedBy", select: "user_name user_email" },
    ]);

    await CronService.updateUserStatuses();
    await CronService.verifyUserStatuses();

    res.status(200).json({
      success: true,
      message: "Holiday rejected successfully",
      data: holiday,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// CHECK OVERLAP HOLIDAYS
// ========================================
export const checkOverlapHolidays = async (req, res) => {
  try {
    const { user_id, start_date, end_date, exclude_id } = req.body;

    if (!user_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "user_id, start_date and end_date are required",
      });
    }

    // สร้าง holiday ชั่วคราวเพื่อตรวจสอบการซ้อนทับ
    const tempHoliday = new Holiday({
      user_id,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      _id: exclude_id, // ถ้ามีการ exclude holiday ใดๆ
    });

    const overlapping = await tempHoliday.checkOverlap();

    res.status(200).json({
      success: true,
      hasOverlap: overlapping !== null,
      data: overlapping,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// GET HOLIDAY STATISTICS
// ========================================
export const getHolidayStats = async (req, res) => {
  try {
    const { year, user_id } = req.query;

    const matchStage = {};

    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      matchStage.start_date = { $gte: startOfYear, $lte: endOfYear };
    }

    if (user_id) {
      matchStage.user_id = user_id;
    }

    const statusStats = await Holiday.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalDays: { $sum: "$total_days" },
        },
      },
    ]);

    const typeStats = await Holiday.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$holiday_type",
          count: { $sum: 1 },
          totalDays: { $sum: "$total_days" },
        },
      },
    ]);

    // สถิติตามเดือน
    const monthlyStats = await Holiday.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $month: "$start_date" },
          count: { $sum: 1 },
          totalDays: { $sum: "$total_days" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: statusStats,
        byType: typeStats,
        byMonth: monthlyStats,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// // ========================================
// // EXPORT ALL FUNCTIONS
// // ========================================
// module.exports = {
//   createHoliday,
//   getAllHolidays,
//   getHolidayById,
//   getUserHolidays,
//   getHolidaysByDateRange,
//   getPublicHolidays,
//   updateHoliday,
//   deleteHoliday,
//   approveHoliday,
//   rejectHoliday,
//   checkOverlapHolidays,
//   getHolidayStats,
// };
