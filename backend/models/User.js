import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    user_name: {
      type: String,
      required: true,
    },
    user_email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["CEO", "admin", "employee", "supervisor"], // ✅ เพิ่ม supervisor
      default: "employee",
    },
    department_id: {
      type: [mongoose.Schema.Types.ObjectId], // ✅ เปลี่ยนเป็น array เพื่อรองรับ supervisor
      ref: "Department",
      default: null,
    },
    leave_days: {
      type: Number,
      default: 15,
    },
    status: {
      type: String,
      enum: ["Active", "On Leave", "Inactive"],
      default: "Active",
    },
    // ✅ ฟิลด์ใหม่ - Personal Information (English)
    first_name_en: {
      type: String,
      required: true,
    },
    last_name_en: {
      type: String,
      required: true,
    },
    nickname_en: {
      type: String,
      default: '',
    },
    // ✅ ฟิลด์ใหม่ - Personal Information (Lao)
    first_name_la: {
      type: String,
      required: true,
    },
    last_name_la: {
      type: String,
      required: true,
    },
    nickname_la: {
      type: String,
      default: '',
    },
    // ✅ ฟิลด์ใหม่ - Basic Information
    date_of_birth: {
      type: Date,
      required: true,
    },
    start_work: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },
    // ✅ ฟิลด์ใหม่ - Position & Salary
    position_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      default: null,
    },
    base_salary: {
      type: Number,
      default: 0,
    },
    // Google Integration
    google_tokens: {
      type: Object,
      default: undefined,
      access_token: String,
      refresh_token: String,
      scope: String,
      token_type: String,
      expiry_date: Number
    },
    google_connected_at: {
      type: Date
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Hash password ก่อน save
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
    return require('jsonwebtoken').sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Method สำหรับเช็ค password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual: วันลาทั้งหมดของผู้ใช้
UserSchema.virtual('holidays', {
    ref: 'Holiday',
    localField: '_id',
    foreignField: 'user_id',
    justOne: false
});

// Virtual: วันลาที่ approved
UserSchema.virtual('approvedHolidays', {
    ref: 'Holiday',
    localField: '_id',
    foreignField: 'user_id',
    justOne: false,
    match: { status: 'approved' }
});

// Virtual: วันลาประเภท Inactive
UserSchema.virtual('leaveDays', {
    ref: 'Holiday',
    localField: '_id',
    foreignField: 'user_id',
    justOne: false,
    match: { holiday_type: 'Inactive' }
});

// Cascade delete holidays when user is deleted
UserSchema.pre('remove', async function(next) {
    await this.model('Holiday').deleteMany({ user_id: this._id });
    next();
});

// Method: ตรวจสอบว่าผู้ใช้มีวันลาในวันที่หรือไม่
UserSchema.methods.hasLeaveOnDate = async function(date) {
    const Holiday = mongoose.model('Holiday');
    const targetDate = new Date(date);
    
    const leave = await Holiday.findOne({
        user_id: this._id,
        holiday_type: 'Inactive',
        status: 'approved',
        start_date: { $lte: targetDate },
        end_date: { $gte: targetDate }
    });
    
    return !!leave;
};

// Static: หาผู้ใช้ที่กำลังลาในวันที่
UserSchema.statics.findUsersOnLeave = async function(date = new Date()) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(targetDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const Holiday = mongoose.model('Holiday');
    
    const leaveDays = await Holiday.find({
        holiday_type: 'Inactive',
        status: 'approved',
        start_date: { $lte: tomorrow },
        end_date: { $gte: targetDate }
    }).populate('user_id', 'user_name user_email department_id position_id');
    
    return leaveDays.map(leave => leave.user_id);
};

UserSchema.statics.resetStatusForDate = async function(date = new Date()) {
    const User = this;
    const Holiday = mongoose.model('Holiday');

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const tomorrow = new Date(targetDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const usersOnLeave = await User.find({ status: 'Inactive' }).select('_id');

    if (usersOnLeave.length === 0) return 0;

    const userIds = usersOnLeave.map(u => u._id);

    const leavesToday = await Holiday.find({
        user_id: { $in: userIds },
        holiday_type: 'Inactive',
        status: 'approved',
        start_date: { $lte: tomorrow },
        end_date: { $gte: targetDate }
    }).select('user_id');

    const usersWithLeaveToday = new Set(leavesToday.map(l => l.user_id.toString()));

    const usersToReset = userIds.filter(id => !usersWithLeaveToday.has(id.toString()));

    if (usersToReset.length > 0) {
        await User.updateMany(
            { _id: { $in: usersToReset } },
            { $set: { status: 'Active' } }
        );
    }

    return usersToReset.length;
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;