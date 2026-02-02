import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRequest extends Document {
  user_id: Types.ObjectId;
  supervisor_id: Types.ObjectId;
  date: Date;
  title: "OT" | "FIELD_WORK";
  start_hour: string;
  end_hour: string;
  fuel: number;
  date_off?: Date;
  description?: string;
  reason: string;
  status: "Pending" | "Accepted" | "Rejected";
  createdAt: Date;
  updatedAt: Date;
}

const requestSchema = new Schema<IRequest>(
  {
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

    date: {
      type: Date,
      required: true,
    },

    title: {
      type: String,
      enum: ["OT", "FIELD_WORK"],
      required: true,
    },

    start_hour: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"],
    },

    end_hour: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"],
    },

    fuel: {
      type: Number,
      min: [0, "Fuel price must be >= 0"],
      default: 0,
    },

    date_off: Date,

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRequest>("RequestOTFieldWork", requestSchema);
