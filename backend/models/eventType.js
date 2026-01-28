import mongoose from 'mongoose';

const eventTypeSchema = new mongoose.Schema({
  event_type_name: {
    type: String,
    required: true
  },
  event_type_color: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // จะสร้าง createdAt และ updatedAt อัตโนมัติ
});

// Define the model
const EventType = mongoose.model('EventType', eventTypeSchema);

// Change module.exports to export default
export default EventType;