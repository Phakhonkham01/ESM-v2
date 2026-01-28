import express from 'express';
// Always include the .js extension in the file path
import * as eventTypeController from '../controller/eventTypeController.js';

const router = express.Router();

// @route   POST /api/event-types
// @desc    สร้าง Event Type ใหม่
router.post('/', eventTypeController.createEventType);

// @route   GET /api/event-types
// @desc    ดึงข้อมูล Event Types ทั้งหมด
router.get('/', eventTypeController.getAllEventTypes);

// @route   GET /api/event-types/:id
// @desc    ดึงข้อมูล Event Type ตาม ID
router.get('/:id', eventTypeController.getEventTypeById);

// @route   PUT /api/event-types/:id
// @desc    อัปเดต Event Type
router.put('/:id', eventTypeController.updateEventType);

// @route   DELETE /api/event-types/:id
// @desc    ลบ Event Type
router.delete('/:id', eventTypeController.deleteEventType);

// Change module.exports to export default
export default router;a