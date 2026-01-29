import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ================= Interface =================

export interface IPosition extends Document {
  _id: Types.ObjectId;
  position_name: string;
  department_id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ================= Schema =================

const PositionSchema = new Schema<IPosition>(
  {
    position_name: {
      type: String,
      required: [true, 'Please provide position name'],
      trim: true
    },
    department_id: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Please provide department']
    }
  },
  { 
    timestamps: true 
  }
);

// Index for better query performance
PositionSchema.index({ department_id: 1 });

// Prevent duplicate position names within the same department
PositionSchema.index({ position_name: 1, department_id: 1 }, { unique: true });

// ================= Export =================

const Position = (mongoose.models.Position as Model<IPosition>) || 
  mongoose.model<IPosition>('Position', PositionSchema);

export default Position;