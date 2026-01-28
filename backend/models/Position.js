import mongoose from 'mongoose';

const PositionSchema = new mongoose.Schema({
    position_name: {
        type: String,
        required: [true, 'Please provide position name'],
        trim: true
    },
    department_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Please provide department']
    }
}, { 
    timestamps: true 
});

// Index for better query performance
PositionSchema.index({ department_id: 1 });

// Prevent duplicate position names within the same department
PositionSchema.index({ position_name: 1, department_id: 1 }, { unique: true });

const Position = mongoose.model('Position', PositionSchema);
export default Position;