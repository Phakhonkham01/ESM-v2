import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ================= Interfaces =================

export interface IGoogleTokens {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  user_name: string;
  user_email: string;
  password: string;
  role: 'CEO' | 'admin' | 'employee' | 'supervisor';
  department_id: Types.ObjectId[] | null;
  leave_days: number;
  status: 'Active' | 'On Leave' | 'Inactive';
  
  // Personal Information (English)
  first_name_en: string;
  last_name_en: string;
  nickname_en?: string;
  
  // Personal Information (Lao)
  first_name_la: string;
  last_name_la: string;
  nickname_la?: string;
  
  // Basic Information
  date_of_birth: Date;
  start_work: Date;
  gender: 'male' | 'female' | 'other';
  
  // Position & Salary
  position_id: Types.ObjectId | null;
  base_salary: number;
  
  // Google Integration
  google_tokens?: IGoogleTokens;
  google_connected_at?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  holidays?: any[];
  approvedHolidays?: any[];
  leaveDays?: any[];
  
  // Methods
  getSignedJwtToken(): string;
  matchPassword(enteredPassword: string): Promise<boolean>;
  hasLeaveOnDate(date: Date): Promise<boolean>;
}

export interface IUserModel extends Model<IUser> {
  findUsersOnLeave(date?: Date): Promise<IUser[]>;
  resetStatusForDate(date?: Date): Promise<number>;
}

// ================= Schema =================

const UserSchema = new Schema<IUser, IUserModel>(
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
      enum: ["CEO", "admin", "employee", "supervisor"],
      default: "employee",
    },
    department_id: {
      type: [Schema.Types.ObjectId],
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
    // Personal Information (English)
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
    // Personal Information (Lao)
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
    // Basic Information
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
    // Position & Salary
    position_id: {
      type: Schema.Types.ObjectId,
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
    },
    google_connected_at: {
      type: Date,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ================= Middleware =================

// Hash password before save
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


// Method to check password
UserSchema.methods.matchPassword = async function(
  this: IUser,
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method: Check if user has leave on date
UserSchema.methods.hasLeaveOnDate = async function(
  this: IUser,
  date: Date
): Promise<boolean> {
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

// ================= Statics =================

// Static: Find users on leave
UserSchema.statics.findUsersOnLeave = async function(
  this: IUserModel,
  date: Date = new Date()
): Promise<IUser[]> {
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
  
  return leaveDays.map((leave: any) => leave.user_id);
};

// Static: Reset status for date
UserSchema.statics.resetStatusForDate = async function(
  this: IUserModel,
  date: Date = new Date()
): Promise<number> {
  const Holiday = mongoose.model('Holiday');

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const tomorrow = new Date(targetDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const usersOnLeave = await this.find({ status: 'Inactive' }).select('_id');

  if (usersOnLeave.length === 0) return 0;

  const userIds = usersOnLeave.map(u => u._id);

  const leavesToday = await Holiday.find({
    user_id: { $in: userIds },
    holiday_type: 'Inactive',
    status: 'approved',
    start_date: { $lte: tomorrow },
    end_date: { $gte: targetDate }
  }).select('user_id');

  const usersWithLeaveToday = new Set(
    leavesToday.map((l: any) => l.user_id.toString())
  );

  const usersToReset = userIds.filter(
    id => !usersWithLeaveToday.has(id.toString())
  );

  if (usersToReset.length > 0) {
    await this.updateMany(
      { _id: { $in: usersToReset } },
      { $set: { status: 'Active' } }
    );
  }

  return usersToReset.length;
};

// ================= Virtuals =================

// Virtual: All holidays for user
UserSchema.virtual('holidays', {
  ref: 'Holiday',
  localField: '_id',
  foreignField: 'user_id',
  justOne: false
});

// Virtual: Approved holidays
UserSchema.virtual('approvedHolidays', {
  ref: 'Holiday',
  localField: '_id',
  foreignField: 'user_id',
  justOne: false,
  match: { status: 'approved' }
});

// Virtual: Leave days (Inactive type)
UserSchema.virtual('leaveDays', {
  ref: 'Holiday',
  localField: '_id',
  foreignField: 'user_id',
  justOne: false,
  match: { holiday_type: 'Inactive' }
});

// ================= Export =================

const User = (mongoose.models.User as IUserModel) || 
  mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;