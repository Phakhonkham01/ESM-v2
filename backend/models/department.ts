import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ================= Interface =================

export interface IDepartment extends Document {
  _id: Types.ObjectId;
  department_name: string;
  createdAt: Date;
  updatedAt: Date;
}

// ================= Schema =================

const DepartmentSchema = new Schema<IDepartment>(
  {
    department_name: {
      type: String, 
      required: [true, 'Please provide department name'],
      unique: true,
      trim: true
    }
  },
  { 
    timestamps: true 
  }
);

// ================= Export =================

const Department = (mongoose.models.Department as Model<IDepartment>) || 
  mongoose.model<IDepartment>('Department', DepartmentSchema);

export default Department;