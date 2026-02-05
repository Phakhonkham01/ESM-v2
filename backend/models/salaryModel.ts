import mongoose, { Schema, Document } from 'mongoose';

// salaryModel.ts (ต่อ)
export interface ISalary extends mongoose.Document {
  user_id: mongoose.Types.ObjectId;
  month: number;
  year: number;
  base_salary: number;
  
  // OT รวม
  ot_amount: number;
  ot_hours: number;
  
  // OT แยกตามประเภท
  weekday_ot_hours: number;
  weekend_ot_hours: number;
  weekday_ot_amount: number;
  weekend_ot_amount: number;
  
  // OT Details
  ot_details: any[];
  
  // Other fields
  bonus: number;
  commission: number;
  fuel_costs: number;
  money_not_spent_on_holidays: number;
  other_income: number;
  office_expenses: number;
  social_security: number;
  working_days: number;
    cut_off_pay_days: number;          // ✅ เพิ่ม
  cut_off_pay_amount: number;  
  day_off_days: number;
  remaining_vacation_days: number;
  net_salary: number;
  payment_date: Date;
  status: string;
  notes?: string;
  created_by: mongoose.Types.ObjectId;
  manual_ot_data?: {
    weekday: {
      hours: number;
      rate_per_hour: number;
    };
    weekend: {
      days: number;
      rate_per_day: number;
    };
  };
  created_at: Date;
  updated_at: Date;
}


const salarySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  base_salary: {
    type: Number,
    required: true,
    min: 0
  },
  
  // OT รวม
  ot_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  ot_hours: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // OT แยกตามประเภท
  weekday_ot_hours: {
    type: Number,
    default: 0,
    min: 0
  },
  weekend_ot_hours: {
    type: Number,
    default: 0,
    min: 0
  },
  weekday_ot_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  weekend_ot_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // OT Details
  ot_details: [
    {
      date: Date,
      title: String,
      start_hour: String,
      end_hour: String,
      total_hours: Number,
      ot_type: {
        type: String,
        enum: ['weekday', 'weekend']
      },
      hourly_rate: Number,
      rate_per_day: Number,
      amount: Number,
      description: String,
      request_id: mongoose.Schema.Types.ObjectId,
      is_manual: {
        type: Boolean,
        default: false
      }
    }
  ],
  
  // Other fields
  bonus: {
    type: Number,
    default: 0,
    min: 0
  },
  commission: {
    type: Number,
    default: 0,
    min: 0
  },
  fuel_costs: {
    type: Number,
    default: 0,
    min: 0
  },
  money_not_spent_on_holidays: {
    type: Number,
    default: 0,
    min: 0
  },
  other_income: {
    type: Number,
    default: 0,
    min: 0
  },
  office_expenses: {
    type: Number,
    default: 0,
    min: 0
  },
  social_security: {
    type: Number,
    default: 0,
    min: 0
  },
    cut_off_pay_days: {              // ✅ เพิ่ม
    type: Number,
    default: 0,
    min: 0
  },
  cut_off_pay_amount: {            // ✅ เพิ่ม
    type: Number,
    default: 0,
    min: 0
  },
  working_days: {
    type: Number,
    default: 0,
    min: 0,
    max: 31
  },
  day_off_days: {
    type: Number,
    default: 0,
    min: 0
  },
  remaining_vacation_days: {
    type: Number,
    default: 0,
    min: 0
  },
  net_salary: {
    type: Number,
    required: true,
    min: 0
  },
  payment_date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  manual_ot_data: {
    weekday: {
      hours: Number,
      rate_per_hour: Number
    },
    weekend: {
      days: Number,
      rate_per_day: Number
    }
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// เพิ่ม index สำหรับการค้นหาที่เร็วขึ้น
salarySchema.index({ user_id: 1, month: 1, year: 1 }, { unique: true });
salarySchema.index({ status: 1 });
salarySchema.index({ created_at: -1 });

export default mongoose.model<ISalary>("Salary", salarySchema);