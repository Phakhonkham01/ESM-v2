import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRequest extends Document {
  user_id: Types.ObjectId;
  supervisor_id: Types.ObjectId;
  date: Date;
  title: "OT" | "FIELD_WORK";
  start_hour: string; // ✅ "08:00"
  end_hour: string; // ✅ "17:30"
  fuel?: number;   // ✅ fuel price (money)
  date_off?: Date;        // ✅ เพิ่ม
  description?: string;  // ✅ เพิ่ม
  reason: string;
  
  status: "Pending" | "Accept" | "Reject";
  created_at: Date;
}

const requestSchema = new Schema<IRequest>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  supervisor_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  date: {
    type: Date,
    required: true,
  },

  title: {
    type: String,
    enum: ["OT", "FIELD_WORK"],
    required: true,
  },

  // ✅ Store as HH:mm
  start_hour: {
    type: String,
    required: true,
  },

  // ✅ Store as HH:mm
  end_hour: {
    type: String,
    required: true,
  },
  fuel: {
    type: Number,
    min: [0, "Fuel price must be >= 0"],
    default: 0,
  },
  reason: {
    type: String,
    required: [true, "Reason is required"],
    trim: true,
    minlength: [3, "Reason must be at least 3 characters"],
  },

  status: {
    type: String,
    enum: ["Pending", "Accept", "Reject"],
    default: "Pending",
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IRequest>("requestOTandFieldWork", requestSchema);
