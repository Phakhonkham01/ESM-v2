// models/SatSunRequest.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

// ✅ Interface สำหรับ TypeScript
export interface ISatSunRequest extends Document {
  user_id: Types.ObjectId;
  supervisor_id: Types.ObjectId[]; // ✅ array ของ supervisor
  employee_id: Types.ObjectId;
  day_choice: "Saturday" | "Sunday";
  day_off_type: "Full day" | "Half day";
  start_date_time: Date;
  end_date_time: Date;
  date_off_number: number;
  description: string;
  status: "Pending" | "Accepted" | "Rejected";
  created_at: Date;
}

const satSunRequestSchema = new Schema<ISatSunRequest>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  
  supervisor_id: [{
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }],

  employee_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  day_choice: {
    type: String,
    enum: ["Saturday", "Sunday"],
    required: true,
  },

  day_off_type: {
    type: String,
    enum: ["Full day", "Half day"],
    required: true,
  },

  start_date_time: {
    type: Date,
    required: true,
  },

  end_date_time: {
    type: Date,
    required: true,
  },

  date_off_number: {
    type: Number,
    required: true,
    min: 0.5,
  },

  description: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500,
    default: "",
  },

  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"],
    default: "Pending",
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
});

// ✅ เพิ่ม index สำหรับ query ที่ใช้บ่อย
satSunRequestSchema.index({ employee_id: 1, status: 1 });
satSunRequestSchema.index({ supervisor_id: 1, status: 1 });
satSunRequestSchema.index({ user_id: 1, status: 1 });
satSunRequestSchema.index({ created_at: -1 });
satSunRequestSchema.index({ start_date_time: 1, end_date_time: 1 });
satSunRequestSchema.index({ day_choice: 1, status: 1 });

// ✅ เพิ่ม virtual fields สำหรับแสดงเวลาท้องถิ่น (Bangkok/Vientiane +07:00)
satSunRequestSchema.virtual('created_at_local').get(function() {
  return new Date(this.created_at.getTime() + (7 * 60 * 60 * 1000));
});

satSunRequestSchema.virtual('start_date_time_local').get(function() {
  return new Date(this.start_date_time.getTime() + (7 * 60 * 60 * 1000));
});

satSunRequestSchema.virtual('end_date_time_local').get(function() {
  return new Date(this.end_date_time.getTime() + (7 * 60 * 60 * 1000));
});

// ✅ เพิ่ม method สำหรับ format เวลาเป็น string
satSunRequestSchema.methods.getFormattedTimes = function() {
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Bangkok',
    hour12: false
  };

  return {
    created_at: this.created_at.toLocaleString('en-GB', formatOptions),
    start_date_time: this.start_date_time.toLocaleString('en-GB', formatOptions),
    end_date_time: this.end_date_time.toLocaleString('en-GB', formatOptions),
  };
};

// ✅ ทำให้ virtual fields ปรากฏใน JSON
satSunRequestSchema.set('toJSON', { virtuals: true });
satSunRequestSchema.set('toObject', { virtuals: true });

export default mongoose.model<ISatSunRequest>(
  "SatSunRequest",
  satSunRequestSchema
);