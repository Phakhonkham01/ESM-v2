import mongoose from "mongoose";

// Holiday Model
const HolidaySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    holiday_name: {
      type: String,
      required: [true, "Holiday name is required"],
      trim: true,
    },
    holiday_type: {
      type: String,
      enum: ["public", "private"],
      required: [true, "Holiday type is required"],
      default: "private",
    },
    start_date: {
      type: Date,
      required: [true, "Start date is required"],
    },
    end_date: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value) {
          return value >= this.start_date;
        },
        message: "End date must be greater than or equal to start date",
      },
    },
    total_days: {
      type: Number,
      min: [1, "Total days must be at least 1"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    applied_to_leave_days: { type: Boolean, default: false },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    comment: {
      type: String,
      trim: true,
    },
    google_calendar_event_id: String,
    google_synced_at: Date,
    google_synced_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
HolidaySchema.virtual("duration_days").get(function () {
  if (this.start_date && this.end_date) {
    const diffTime = Math.abs(this.end_date - this.start_date);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  return 0;
});

// Middleware และ Methods
HolidaySchema.pre("save", function (next) {
  if (this.start_date && this.end_date) {
    const diffTime = Math.abs(this.end_date - this.start_date);
    this.total_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  if (this.start_date > this.end_date) {
    return next(new Error("Start date must be before or equal to end date"));
  }
  next();
});

HolidaySchema.methods.approve = function (approvedById, comment = "") {
  this.status = "approved";
  this.approvedBy = approvedById;
  if (comment) this.comment = comment;
  return this.save();
};

HolidaySchema.methods.reject = function (approvedById, comment) {
  this.status = "rejected";
  this.approvedBy = approvedById;
  this.comment = comment;
  return this.save();
};

HolidaySchema.methods.checkOverlap = async function () {
  const Holiday = this.constructor;
  const overlapping = await Holiday.find({
    _id: { $ne: this._id },
    user_id: this.user_id,
    status: { $ne: "rejected" },
    $or: [
      {
        start_date: { $lte: this.end_date },
        end_date: { $gte: this.start_date },
      },
    ],
  });
  return overlapping.length > 0 ? overlapping : null;
};

// Statics
HolidaySchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    $or: [
      { start_date: { $gte: startDate, $lte: endDate } },
      { end_date: { $gte: startDate, $lte: endDate } },
      { start_date: { $lte: startDate }, end_date: { $gte: endDate } },
    ],
  })
    .populate("user_id", "user_name user_email status")
    .populate("approvedBy", "user_name user_email")
    .sort({ start_date: 1 });
};

HolidaySchema.statics.findByUser = function (userId, options = {}) {
  const query = { user_id: userId };
  if (options.status) query.status = options.status;
  if (options.holiday_type) query.holiday_type = options.holiday_type;

  return this.find(query)
    .populate("user_id", "user_name user_email status")
    .populate("approvedBy", "user_name user_email")
    .sort({ start_date: -1 });
};

const Holiday =
  mongoose.models.Holiday || mongoose.model("Holiday", HolidaySchema);

export default Holiday;
