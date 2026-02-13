import { Request, Response } from "express";
import mongoose from "mongoose";
import Salary, { ISalary } from "../models/salaryModel.js";
import User from "../models/User.js";
import RequestModel from "../models/requestOTandFieldWork.js";
import DayOffRequestModel from "../models/dayOffRequestModal.js";
import Department from "../models/department.js";
import Position from "../models/Position.js";

// Interface สำหรับข้อมูล
interface DepartmentData {
  _id: mongoose.Types.ObjectId;
  department_name: string;
}
interface OTDetail {
  date: Date;
  title: string;
  start_hour: string;
  end_hour: string;
  total_hours: number;
  ot_type: 'weekday' | 'weekend';
  hourly_rate: number;
  rate_per_day: number;
  amount: number;
  description?: string;
  request_id?: mongoose.Types.ObjectId;
  is_manual: boolean;
  days?: number;
}

interface PositionData {
  _id: mongoose.Types.ObjectId;
  position_name: string;
}

/**
 * Helper function to get current month/year
 */
const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,  
    year: now.getFullYear()
  };
};

/**
 * Helper function to calculate OT from requests
 */
const calculateOTWithoutMultiplier = async (
  userId: string, 
  month: number, 
  year: number
): Promise<{
  total_amount: number;
  total_hours: number;
  details: any[];
  weekday_ot_hours: number;
  weekend_ot_hours: number;
  weekday_ot_amount: number;
  weekend_ot_amount: number;
}> => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // ดึงข้อมูลคำขอ OT
    const otRequests = await RequestModel.find({
      user_id: userId,
      title: "OT",
      status: "Accept",
      created_at: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ created_at: 1 });

    const details: any[] = [];
    let total_amount = 0;
    let total_hours = 0;
    let weekday_ot_hours = 0;
    let weekend_ot_hours = 0;
    let weekday_ot_amount = 0;
    let weekend_ot_amount = 0;

    // วนลูปคำนวณแต่ละรายการ OT
    for (const request of otRequests) {
      if (request.start_hour && request.end_hour) {
        const start = parseInt(request.start_hour.split(':')[0]);
        const end = parseInt(request.end_hour.split(':')[0]);
        const hours = Math.max(0, end - start);
        
        if (hours <= 0) continue;
        
        // ตรวจสอบประเภทวัน
        let requestDate = request.date_off || request.created_at;
        const dateObj = new Date(requestDate);
        const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ...
        
        let ot_type = 'weekday';
        
        // ถ้าเป็นเสาร์ (6) หรือ อาทิตย์ (0) = weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          ot_type = 'weekend';
          weekend_ot_hours += hours;
        } else {
          weekday_ot_hours += hours;
        }
        
        // สำหรับระบบ จะไม่คำนวณเงิน OT (ให้ป้อนเองใน manual)
        const amount = 0; // ระบบไม่คำนวณเงิน OT
        
        details.push({
          date: dateObj,
          title: request.title || 'OT',
          start_hour: request.start_hour,
          end_hour: request.end_hour,
          total_hours: hours,
          ot_type,
          hourly_rate: 0, // ป้อนเองใน manual
          rate_per_day: 0, // ป้อนเองใน manual
          amount: amount, // 0 สำหรับระบบ
          description: request.description || request.reason,
          request_id: request._id,
          is_manual: false
        });
        
        total_hours += hours;
        total_amount += amount;
      }
    }

    return { 
      total_amount, 
      total_hours, 
      details,
      weekday_ot_hours,
      weekend_ot_hours,
      weekday_ot_amount,
      weekend_ot_amount
    };
  } catch (error) {
    console.error("Error calculating OT:", error);
    return { 
      total_amount: 0, 
      total_hours: 0, 
      details: [],
      weekday_ot_hours: 0,
      weekend_ot_hours: 0,
      weekday_ot_amount: 0,
      weekend_ot_amount: 0
    };
  }
};
/**
 * Helper function: calculate used vacation days in a year
 */
const calculateUsedVacationDaysInYear = async (
  userId: string,
  year: number
): Promise<number> => {
  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const requests = await DayOffRequestModel.find({
      user_id: userId,
      status: "Accepted",
      created_at: {
        $gte: startDate,
        $lte: endDate
      }
    });

    return requests.reduce(
      (sum, r) => sum + (r.date_off_number || 0),
      0
    );
  } catch (error) {
    console.error("Error calculating yearly vacation:", error);
    return 0;
  }
};

/**
 * Helper function to calculate fuel costs from FIELD_WORK requests
 */
const calculateFuelCosts = async (
  userId: string,
  month: number,
  year: number
): Promise<number> => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const fieldWorkRequests = await RequestModel.find({
      user_id: userId,
      title: "FIELD_WORK",
      status: "Accept",
      created_at: {
        $gte: startDate,
        $lte: endDate
      },
      fuel: { $exists: true, $ne: null }
    });

    // รวมค่า fuel จากทุก request
    const totalFuelCost = fieldWorkRequests.reduce(
      (sum, req) => sum + (req.fuel || 0),
      0
    );

    return totalFuelCost;
  } catch (error) {
    console.error("Error calculating fuel costs:", error);
    return 0;
  }
};

/**
 * Helper function to calculate day off days
 */
const calculateDayOffDays = async (userId: string, month: number, year: number): Promise<number> => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const dayOffRequests = await DayOffRequestModel.find({
      user_id: userId,
      status: "Accepted",
      created_at: {
        $gte: startDate,
        $lte: endDate
      }
    });

    let totalDays = 0;
    
    dayOffRequests.forEach(request => {
      if (request.date_off_number) {
        totalDays += request.date_off_number;
      }
    });

    return totalDays;
  } catch (error) {
    console.error("Error calculating day off days:", error);
    return 0;
  }
};

/**
 * CREATE - Create salary calculation
 * POST /api/salaries
 */
export const createSalary = async (req: Request, res: Response): Promise<void> => {
  try {
    let net_salary_calculated: number = 0;

    const {
      user_id,
      month,
      year,
      bonus = 0,
      commission = 0,
      money_not_spent_on_holidays = 0,
      other_income = 0,
      office_expenses = 0,
      social_security = 0,
            cut_off_pay_days = 0,          // ✅ เพิ่ม
      cut_off_pay_amount = 0,        // ✅ เพิ่ม
      working_days = 0,
      notes,
      salary,
      net_salary,
      created_by,
      ot_details = [], // รวมทั้ง manual และ auto
      manual_ot, // ข้อมูล manual OT จาก frontend
      base_salary, // เงินเดือนพื้นฐาน (ส่งมาจาก frontend)
      fuel_costs, // ค่าน้ำมัน (ส่งมาจาก frontend)
      ot_amount, // ยอด OT ทั้งหมด (ส่งมาจาก frontend)
      ot_hours // จำนวนชั่วโมง OT ทั้งหมด (ส่งมาจาก frontend)
    } = req.body;

    if (!user_id) {
      res.status(400).json({ message: "Missing user_id", salary: null });
      return;
    }

    const currentMonth = month || getCurrentMonthYear().month;
    const currentYear = year || getCurrentMonthYear().year;
    const finalCreatedBy = created_by || user_id;

    // 🔎 หา salary เดิมที่ตรงกับเดือนและปีที่ระบุ
    const existingSalary = await Salary.findOne({
      user_id,
      month: currentMonth,
      year: currentYear
    });

    // ✅ ถ้ามี salary ในเดือน/ปีนี้แล้ว
    if (existingSalary) {
      if (existingSalary.status !== 'pending') {
        res.status(400).json({ 
          message: `Salary for ${currentMonth}/${currentYear} has already been ${existingSalary.status}. Cannot modify.`, 
          salary: null 
        });
        return;
      }
      console.log('Updating existing salary for month:', currentMonth, 'year:', currentYear);
    }

    // 👤 ข้อมูล user
    const user = await User.findById(user_id);
    if (!user) {
      res.status(404).json({ message: "User not found", salary: null });
      return;
    }

    // 📊 คำนวณค่าต่างๆ
    const finalBaseSalary = base_salary || user.base_salary || 0;
    
    // แยก OT details เป็น manual และ auto
    const manualOTDetails = Array.isArray(ot_details) 
      ? ot_details.filter((detail: any) => detail.is_manual === true)
      : [];
    
    const autoOTDetails = Array.isArray(ot_details) 
      ? ot_details.filter((detail: any) => !detail.is_manual)
      : [];

let autoOTCalculation: {
  total_amount: number;
  total_hours: number;
  details: OTDetail[]; // ✅
  weekday_ot_hours: number;
  weekend_ot_hours: number;
  weekday_ot_amount: number;
  weekend_ot_amount: number;
} = {
  total_amount: 0,
  total_hours: 0,
  details: [], // OK แล้ว
  weekday_ot_hours: 0,
  weekend_ot_hours: 0,
  weekday_ot_amount: 0,
  weekend_ot_amount: 0
};

    
    if (autoOTDetails.length === 0) {
      // ถ้าไม่มี auto OT details จาก frontend ให้คำนวณจากระบบ
      autoOTCalculation = await calculateOTWithoutMultiplier(
        user_id,
        currentMonth,
        currentYear
      );
    } else {
      // ถ้ามี auto OT details จาก frontend ให้ใช้ข้อมูลนั้น
      const weekdayDetails = autoOTDetails.filter((detail: any) => detail.ot_type === 'weekday');
      const weekendDetails = autoOTDetails.filter((detail: any) => detail.ot_type === 'weekend');
      
      autoOTCalculation = {
        total_amount: autoOTDetails.reduce((sum: number, detail: any) => sum + (detail.amount || 0), 0),
        total_hours: autoOTDetails.reduce((sum: number, detail: any) => sum + (detail.total_hours || 0), 0),
        details: autoOTDetails,
        weekday_ot_hours: weekdayDetails.reduce((sum: number, detail: any) => sum + (detail.total_hours || 0), 0),
        weekend_ot_hours: weekendDetails.reduce((sum: number, detail: any) => sum + (detail.total_hours || 0), 0),
        weekday_ot_amount: weekdayDetails.reduce((sum: number, detail: any) => sum + (detail.amount || 0), 0),
        weekend_ot_amount: weekendDetails.reduce((sum: number, detail: any) => sum + (detail.amount || 0), 0)
      };
    }

    // คำนวณ OT จาก manual entry
    const manualWeekdayDetails = manualOTDetails.filter((detail: any) => detail.ot_type === 'weekday');
    const manualWeekendDetails = manualOTDetails.filter((detail: any) => detail.ot_type === 'weekend');
    
    const manualOTAmount = manualOTDetails.reduce((sum: number, detail: any) => sum + (detail.amount || 0), 0);
    const manualOTHours = manualOTDetails.reduce((sum: number, detail: any) => sum + (detail.total_hours || 0), 0);
    
    const manualWeekdayOTAmount = manualWeekdayDetails.reduce((sum: number, detail: any) => sum + (detail.amount || 0), 0);
    const manualWeekdayOTHours = manualWeekdayDetails.reduce((sum: number, detail: any) => sum + (detail.total_hours || 0), 0);
    const manualWeekendOTAmount = manualWeekendDetails.reduce((sum: number, detail: any) => sum + (detail.amount || 0), 0);
    const manualWeekendOTDays = manualWeekendDetails.reduce((sum: number, detail: any) => sum + (detail.days || 0), 0);

    // รวม OT ทั้งหมด
    const finalOTAmount = (ot_amount !== undefined ? ot_amount : (autoOTCalculation.total_amount + manualOTAmount));
    const finalOTHours = (ot_hours !== undefined ? ot_hours : (autoOTCalculation.total_hours + manualOTHours));
    
    // รวม OT แยกประเภท
    const finalWeekdayOTHours = autoOTCalculation.weekday_ot_hours + manualWeekdayOTHours;
    const finalWeekendOTHours = autoOTCalculation.weekend_ot_hours + (manualWeekendOTDays * 8);
    const finalWeekdayOTAmount = autoOTCalculation.weekday_ot_amount + manualWeekdayOTAmount;
    const finalWeekendOTAmount = autoOTCalculation.weekend_ot_amount + manualWeekendOTAmount;
    
    // รวม OT details ทั้งหมด
    const allOTDetails = [
      ...autoOTCalculation.details,
      ...manualOTDetails
    ];

    // คำนวณ fuel costs
    const finalFuelCosts = fuel_costs !== undefined ? fuel_costs : await calculateFuelCosts(user_id, currentMonth, currentYear);
    
    const day_off_days = await calculateDayOffDays(user_id, currentMonth, currentYear);
    const remaining_vacation_days = Math.max(
      0,
      (user.vacation_days || 0) - day_off_days
    );

    // 💰 คำนวณ net salary
    if (salary || net_salary) {
      net_salary_calculated = salary || net_salary;
    } else {
      const totalIncome =
        finalBaseSalary +
        finalOTAmount +
        bonus +
        commission +
        finalFuelCosts +
        money_not_spent_on_holidays +
        other_income;

      const totalDeductions = 
      office_expenses + 
      social_security +
        cut_off_pay_amount;
      net_salary_calculated = totalIncome - totalDeductions;
    }

    // 🔁 UPDATE (ถ้ามีและ status = pending)
    if (existingSalary && existingSalary.status === 'pending') {
      existingSalary.set({
        base_salary: finalBaseSalary,
        ot_amount: finalOTAmount,
        ot_hours: finalOTHours,
        ot_details: allOTDetails,
        weekday_ot_hours: finalWeekdayOTHours,
        weekend_ot_hours: finalWeekendOTHours,
        weekday_ot_amount: finalWeekdayOTAmount,
        weekend_ot_amount: finalWeekendOTAmount,
        bonus,
        commission,
        fuel_costs: finalFuelCosts,
        money_not_spent_on_holidays,
        other_income,
        office_expenses,
        social_security,
                cut_off_pay_days,          // ✅ เพิ่ม
        cut_off_pay_amount,        // ✅ เพิ่ม
        working_days,
        day_off_days,
        remaining_vacation_days,
        net_salary: net_salary_calculated,
        notes: notes || `Manual OT: ${manualOTDetails.length > 0 ? 'Yes' : 'No'}`,
        updated_at: new Date(),
        manual_ot_data: manual_ot
      });

      await existingSalary.save();

      const populatedSalary = await Salary.findById(existingSalary._id)
        .populate("user_id", "first_name_en last_name_en email")
        .populate("created_by", "first_name_en last_name_en");

      console.log('Updated salary:', {
        id: populatedSalary?._id,
        month: populatedSalary?.month,
        year: populatedSalary?.year,
        ot_amount: finalOTAmount,
        weekday_ot: { hours: finalWeekdayOTHours, amount: finalWeekdayOTAmount },
        weekend_ot: { hours: finalWeekendOTHours, amount: finalWeekendOTAmount }
      });

      res.status(200).json({
        message: `อัพเดทเงินเดือน ${currentMonth}/${currentYear} สำเร็จ`,
        salary: populatedSalary
      });
      return;
    }

    const newSalary = await Salary.create({
      user_id,
      month: currentMonth,
      year: currentYear,
      base_salary: finalBaseSalary,
      ot_amount: finalOTAmount,
      ot_hours: finalOTHours,
      ot_details: allOTDetails,
      weekday_ot_hours: finalWeekdayOTHours,
      weekend_ot_hours: finalWeekendOTHours,
      weekday_ot_amount: finalWeekdayOTAmount,
      weekend_ot_amount: finalWeekendOTAmount,
      bonus,
      commission,
      fuel_costs: finalFuelCosts,
      money_not_spent_on_holidays,
      other_income,
      office_expenses,
      social_security,
            cut_off_pay_days,          // ✅ เพิ่ม
      cut_off_pay_amount,        // ✅ เพิ่ม
      working_days,
      day_off_days,
      remaining_vacation_days,
      net_salary: net_salary_calculated,
      payment_date: new Date(),
      status: "pending",
      created_by: finalCreatedBy,
      notes: notes || `Manual OT: ${manualOTDetails.length > 0 ? 'Yes' : 'No'}`,
      created_at: new Date(),
      updated_at: new Date(),
      manual_ot_data: manual_ot
    });

    const populatedSalary = await Salary.findById(newSalary._id)
      .populate("user_id", "first_name_en last_name_en email")
      .populate("created_by", "first_name_en last_name_en");

    console.log('Created new salary:', {
      id: populatedSalary?._id,
      month: populatedSalary?.month,
      year: populatedSalary?.year,
      base_salary: finalBaseSalary,
      net_salary: net_salary_calculated,
      ot_by_type: {
        weekday: { hours: finalWeekdayOTHours, amount: finalWeekdayOTAmount },
        weekend: { hours: finalWeekendOTHours, amount: finalWeekendOTAmount }
      }
    });

    res.status(201).json({
      message: `สร้างเงินเดือน ${currentMonth}/${currentYear} สำเร็จ`,
      salary: populatedSalary
    });
  } catch (error: any) {
    console.error("Error creating salary:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      salary: null
    });
  }
};

/**
 * GET - Get all salaries with department and position names
 * GET /api/salaries
 */
export const getAllSalaries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year, status, userId } = req.query;

    const filter: any = {};

    if (month) filter.month = parseInt(month as string);
    if (year) filter.year = parseInt(year as string);
    if (status) filter.status = status;
    if (userId) filter.user_id = userId;

    // ดึงข้อมูล salaries
    const salaries = await Salary.find(filter)
      .populate("user_id", "first_name_en last_name_en email role department_id position_id")
      .populate("created_by", "first_name_en last_name_en")
      .sort({ year: -1, month: -1, created_at: -1 })
      .lean();

    // ถ้าไม่มีข้อมูล
    if (salaries.length === 0) {
      res.status(200).json({
        message: "No salaries found",
        count: 0,
        salaries: []
      });
      return;
    }

    // ดึง department IDs ทั้งหมด
    const departmentIds: string[] = [];
    const positionIds: string[] = [];

    salaries.forEach(salary => {
      const user = salary.user_id as any;
      if (user?.department_id) {
        departmentIds.push(user.department_id.toString());
      }
      if (user?.position_id) {
        positionIds.push(user.position_id.toString());
      }
    });

    // ดึงข้อมูล departments และ positions
    const [departments, positions] = await Promise.all([
      Department.find({ _id: { $in: departmentIds } }, "_id department_name").lean(),
      Position.find({ _id: { $in: positionIds } }, "_id position_name").lean()
    ]);

    // สร้าง lookup maps
    const deptMap: Record<string, string> = {};
    departments.forEach((dept: any) => {
      deptMap[dept._id.toString()] = dept.department_name;
    });

    const posMap: Record<string, string> = {};
    positions.forEach((pos: any) => {
      posMap[pos._id.toString()] = pos.position_name;
    });

    // แปลงข้อมูล salaries
    const formattedSalaries = salaries.map(salary => {
      const user = salary.user_id as any;
      
      return {
        ...salary,
        user_id: {
          _id: user?._id || '',
          first_name_en: user?.first_name_en || '',
          last_name_en: user?.last_name_en || '',
          email: user?.email || '',
          role: user?.role || 'Employee',
          department_id: user?.department_id ? {
            _id: user.department_id,
            name: deptMap[user.department_id.toString()] || `Dept ID: ${user.department_id}`
          } : null,
          position_id: user?.position_id ? {
            _id: user.position_id,
            name: posMap[user.position_id.toString()] || `Pos ID: ${user.position_id}`
          } : null
        }
      };
    });

    res.status(200).json({
      message: "Salaries retrieved successfully",
      count: formattedSalaries.length,
      salaries: formattedSalaries
    });
  } catch (error: any) {
    console.error("Error fetching salaries:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      salaries: []
    });
  }
};

/**
 * GET - Get salary by ID with details
 * GET /api/salaries/:id
 */
export const getSalaryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        message: "Invalid salary ID",
        salary: null
      });
      return;
    }

    const salary = await Salary.findById(id)
      .populate("user_id", "first_name_en last_name_en email role department_id position_id")
      .populate("created_by", "first_name_en last_name_en");

    if (!salary) {
      res.status(404).json({ 
        message: "Salary not found",
        salary: null
      });
      return;
    }

    // ดึงข้อมูล department และ position
    const user = salary.user_id as any;
    let departmentInfo = null;
    let positionInfo = null;

    if (user?.department_id) {
      const department = await Department.findById(user.department_id, "department_name");
      if (department) {
        departmentInfo = {
          _id: department._id,
          name: department.department_name
        };
      }
    }

    if (user?.position_id) {
      const position = await Position.findById(user.position_id, "position_name");
      if (position) {
        positionInfo = {
          _id: position._id,
          name: position.position_name
        };
      }
    }

    // Format ข้อมูล
    const formattedSalary = {
      ...salary.toObject(),
      user_id: {
        ...user,
        department_id: departmentInfo,
        position_id: positionInfo
      }
    };

    res.status(200).json({
      message: "Salary retrieved successfully",
      salary: formattedSalary
    });
  } catch (error: any) {
    console.error("Error fetching salary:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      salary: null
    });
  }
};

/**
 * GET - Get prefill data for salary form
 * GET /api/salaries/prefill/:userId
 */
export const getPrefillData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ 
        message: "Invalid user ID",
        data: null
      });
      return;
    }

    const currentMonth = month ? parseInt(month as string) : getCurrentMonthYear().month;
    const currentYear = year ? parseInt(year as string) : getCurrentMonthYear().year;

    // ✅ Get user with correct leave fields
    const user = await User.findById(userId)
      .select(
        "first_name_en last_name_en base_salary leave_days actual_leave_days role department_id position_id"
      )
      .populate("department_id", "department_name")
      .populate("position_id", "position_name");

    if (!user) {
      res.status(404).json({ 
        message: "User not found",
        data: null
      });
      return;
    }

    // --- OT and fuel calculations (unchanged) ---
    const otCalculation = await calculateOTWithoutMultiplier(userId, currentMonth, currentYear);
    const fuel_costs = await calculateFuelCosts(userId, currentMonth, currentYear);

    // --- ✅ NEW: Day off calculations using actual_leave_days and paid_holidays ---
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // 1. Approved day‑off requests for this month
    const dayOffRequestsThisMonth = await DayOffRequestModel.find({
      employee_id: userId,
      status: "Accepted",
      start_date_time: { $lte: endOfMonth },
      end_date_time: { $gte: startOfMonth }
    }).select("date_off_number paid_holidays");

    // Total days taken (including paid holidays)
    const day_off_days_this_month = dayOffRequestsThisMonth.reduce(
      (sum, req) => sum + (req.date_off_number || 0),
      0
    );

    // Paid holidays this month (exceed days)
    const exceed_days = dayOffRequestsThisMonth.reduce(
      (sum, req) => sum + (req.paid_holidays || 0),
      0
    );

    // 2. Used vacation days this year (actual deduction, excluding paid holidays)
    const used_vacation_days_this_year = await calculateUsedVacationDaysInYear(userId, currentYear);

    // 3. Current leave balance = actual_leave_days
    const remaining_vacation_days = user.actual_leave_days ?? 0;
    const total_vacation_days = user.leave_days ?? 0;

    // 4. Vacation colour based on remaining balance
    let vacationColor = 'green';
    if (remaining_vacation_days <= 0) {
      vacationColor = 'red';
    } else if (remaining_vacation_days <= 5) {
      vacationColor = 'yellow';
    }

    // --- Department & position info (unchanged) ---
    const userObj = user.toObject() as any;
    const departmentInfo = userObj.department_id ? {
      _id: userObj.department_id._id,
      name: userObj.department_id.department_name
    } : null;

    const positionInfo = userObj.position_id ? {
      _id: userObj.position_id._id,
      name: userObj.position_id.position_name
    } : null;

    res.status(200).json({
      message: "Prefill data retrieved successfully",
      data: {
        user: {
          _id: user._id,
          name: `${user.first_name_en} ${user.last_name_en}`,
          base_salary: user.base_salary || 0,
          vacation_days: user.leave_days || 0,        // ✅ original allocation
          actual_leave_days: user.actual_leave_days,  // ✅ current balance
          role: user.role || 'Employee',
          department_id: departmentInfo,
          position_id: positionInfo
        },
        calculated: {
          ot_amount: otCalculation.total_amount,
          ot_hours: otCalculation.total_hours,
          ot_details: otCalculation.details,
          fuel_costs,
          day_off_days_this_month,
          used_vacation_days_this_year,
          total_vacation_days,
          remaining_vacation_days,
          exceed_days,
          vacation_color: vacationColor,
          weekday_ot_hours: otCalculation.weekday_ot_hours,
          weekend_ot_hours: otCalculation.weekend_ot_hours,
          weekday_ot_amount: otCalculation.weekday_ot_amount,
          weekend_ot_amount: otCalculation.weekend_ot_amount
        },
        month: currentMonth,
        year: currentYear
      }
    });
  } catch (error: any) {
    console.error("Error getting prefill data:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      data: null
    });
  }
};
/**
 * UPDATE - Update salary status
 * PUT /api/salaries/:id/status
 */
export const updateSalaryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        message: "Invalid salary ID",
        salary: null
      });
      return;
    }

    if (!['pending', 'approved', 'paid', 'cancelled'].includes(status)) {
      res.status(400).json({ 
        message: "Invalid status",
        salary: null
      });
      return;
    }

    const updatedSalary = await Salary.findByIdAndUpdate(
      id,
      { 
        status,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate("user_id", "first_name_en last_name_en email")
      .populate("created_by", "first_name_en last_name_en");

    if (!updatedSalary) {
      res.status(404).json({ 
        message: "Salary not found",
        salary: null
      });
      return;
    }

    res.status(200).json({
      message: `Salary status updated to ${status}`,
      salary: updatedSalary
    });
  } catch (error: any) {
    console.error("Error updating salary status:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      salary: null
    });
  }
};

/**
 * UPDATE - Update salary data
 * PUT /api/salaries/:id
 */
export const updateSalary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      bonus,
      commission,
      money_not_spent_on_holidays,
      other_income,
      office_expenses,
      social_security,
      cut_off_pay_days,          // ✅ เพิ่ม
      cut_off_pay_amount,        // ✅ เพิ่ม
      working_days,
      notes
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        message: "Invalid salary ID",
        salary: null
      });
      return;
    }

    const salary = await Salary.findById(id);
    if (!salary) {
      res.status(404).json({ 
        message: "Salary not found",
        salary: null
      });
      return;
    }

    // Only allow editing if status is pending
    if (salary.status !== 'pending') {
      res.status(400).json({ 
        message: "Cannot edit salary after it has been approved",
        salary: null
      });
      return;
    }

    // Update fields
    if (bonus !== undefined) salary.bonus = bonus;
    if (commission !== undefined) salary.commission = commission;
    if (money_not_spent_on_holidays !== undefined) salary.money_not_spent_on_holidays = money_not_spent_on_holidays;
    if (other_income !== undefined) salary.other_income = other_income;
    if (office_expenses !== undefined) salary.office_expenses = office_expenses;
    if (social_security !== undefined) salary.social_security = social_security;
    if (working_days !== undefined) salary.working_days = working_days;
    if (notes !== undefined) salary.notes = notes;

    // Recalculate net salary
    const totalIncome = salary.base_salary + salary.ot_amount + salary.bonus + salary.commission + 
                       salary.fuel_costs + salary.money_not_spent_on_holidays + salary.other_income;
    
    const totalDeductions = salary.office_expenses + 
    salary.social_security + 
    salary.cut_off_pay_amount;

    salary.net_salary = totalIncome - totalDeductions;
    salary.updated_at = new Date();

    await salary.save();

    const populatedSalary = await Salary.findById(id)
      .populate("user_id", "first_name_en last_name_en email")
      .populate("created_by", "first_name_en last_name_en");

    res.status(200).json({
      message: "Salary updated successfully",
      salary: populatedSalary
    });
  } catch (error: any) {
    console.error("Error updating salary:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      salary: null
    });
  }
};

/**
 * DELETE - Delete salary
 * DELETE /api/salaries/:id
 */
export const deleteSalary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        message: "Invalid salary ID"
      });
      return;
    }

    const salary = await Salary.findById(id);
    if (!salary) {
      res.status(404).json({ 
        message: "Salary not found"
      });
      return;
    }

    // Only allow deletion if status is pending
    if (salary.status !== 'pending') {
      res.status(400).json({ 
        message: "Cannot delete salary after it has been approved"
      });
      return;
    }

    await salary.deleteOne();

    res.status(200).json({
      message: "Salary deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting salary:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message
    });
  }
};

/**
 * GET - Get salary summary
 * GET /api/salaries/summary
 */
export const getSalarySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year } = req.query;

    const matchStage: any = {};
    if (month) matchStage.month = parseInt(month as string);
    if (year) matchStage.year = parseInt(year as string);

    const summary = await Salary.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSalaries: { $sum: 1 },
          totalNetSalary: { $sum: "$net_salary" },
          totalBaseSalary: { $sum: "$base_salary" },
          totalOT: { $sum: "$ot_amount" },
          totalBonus: { $sum: "$bonus" },
          averageSalary: { $avg: "$net_salary" },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] }
          }
        }
      }
    ]);

    const result = summary.length > 0 ? summary[0] : {
      totalSalaries: 0,
      totalNetSalary: 0,
      totalBaseSalary: 0,
      totalOT: 0,
      totalBonus: 0,
      averageSalary: 0,
      pendingCount: 0,
      approvedCount: 0,
      paidCount: 0
    };

    res.status(200).json({
      message: "Salary summary retrieved successfully",
      summary: result
    });
  } catch (error: any) {
    console.error("Error fetching salary summary:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      summary: null
    });
  }
};

/**
 * GET - Get OT summary by type
 * GET /api/salaries/ot-summary/:userId
 */
export const getOTSummaryByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ 
        message: "Invalid user ID",
        summary: null
      });
      return;
    }

    const currentMonth = month ? parseInt(month as string) : getCurrentMonthYear().month;
    const currentYear = year ? parseInt(year as string) : getCurrentMonthYear().year;

    // หา salary ของเดือน/ปีนั้น
    const salary = await Salary.findOne({
      user_id: userId,
      month: currentMonth,
      year: currentYear
    });

    if (!salary) {
      res.status(404).json({ 
        message: "Salary not found for this month/year",
        summary: null
      });
      return;
    }

    // สรุปข้อมูล OT
    const otSummary = {
      total: {
        hours: salary.ot_hours,
        amount: salary.ot_amount
      },
      weekday: {
        hours: salary.weekday_ot_hours,
        amount: salary.weekday_ot_amount,
        details: salary.ot_details.filter((detail: any) => detail.ot_type === 'weekday')
      },
      weekend: {
        hours: salary.weekend_ot_hours,
        amount: salary.weekend_ot_amount,
        details: salary.ot_details.filter((detail: any) => detail.ot_type === 'weekend')
      },
      manual_count: salary.ot_details.filter((detail: any) => detail.is_manual === true).length,
      auto_count: salary.ot_details.filter((detail: any) => !detail.is_manual).length
    };

    res.status(200).json({
      message: "OT summary retrieved successfully",
      summary: otSummary,
      salary_id: salary._id
    });
  } catch (error: any) {
    console.error("Error getting OT summary:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      summary: null
    });
  }
};

/**
 * GET - Get all OT by type for user
 * GET /api/salaries/ot-by-type/:userId
 */
export const getAllOTByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { startMonth, startYear, endMonth, endYear } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ 
        message: "Invalid user ID",
        ot_data: null
      });
      return;
    }

    const filter: any = { user_id: userId };
    
    if (startMonth && startYear && endMonth && endYear) {
      filter.$or = [
        {
          $and: [
            { year: parseInt(startYear as string) },
            { month: { $gte: parseInt(startMonth as string) } }
          ]
        },
        {
          $and: [
            { year: { $gt: parseInt(startYear as string) } },
            { year: { $lt: parseInt(endYear as string) } }
          ]
        },
        {
          $and: [
            { year: parseInt(endYear as string) },
            { month: { $lte: parseInt(endMonth as string) } }
          ]
        }
      ];
    }

    const salaries = await Salary.find(filter)
      .select("month year ot_amount ot_hours weekday_ot_hours weekend_ot_hours weekday_ot_amount weekend_ot_amount")
      .sort({ year: 1, month: 1 });

    // สรุปข้อมูลทั้งหมด
    const summary = salaries.reduce((acc, salary) => {
      acc.total_ot_amount += salary.ot_amount;
      acc.total_ot_hours += salary.ot_hours;
      acc.total_weekday_ot_amount += salary.weekday_ot_amount;
      acc.total_weekday_ot_hours += salary.weekday_ot_hours;
      acc.total_weekend_ot_amount += salary.weekend_ot_amount;
      acc.total_weekend_ot_hours += salary.weekend_ot_hours;
      acc.months_count++;
      return acc;
    }, {
      total_ot_amount: 0,
      total_ot_hours: 0,
      total_weekday_ot_amount: 0,
      total_weekday_ot_hours: 0,
      total_weekend_ot_amount: 0,
      total_weekend_ot_hours: 0,
      months_count: 0
    });

    res.status(200).json({
      message: "OT by type retrieved successfully",
      data: {
        salaries,
        summary,
        count: salaries.length
      }
    });
  } catch (error: any) {
    console.error("Error getting OT by type:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      data: null
    });
  }
};