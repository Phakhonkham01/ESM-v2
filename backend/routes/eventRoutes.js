import express from 'express';
const router = express.Router();
// Use namespace import to keep your controller organization intact
import * as eventController from '../controller/eventController.js'; 

// ========================================
// EVENT ROUTES
// ========================================

// Create event
router.post('/', eventController.createEvent);

// Get all events
router.get('/', eventController.getAllEvents);

// Get events by date range
router.get('/date-range', eventController.getEventsByDateRange);

// Get user's events
router.get('/my-events', eventController.getUserEvents);

// Get events statistics
router.get('/stats', eventController.getEventsStats);

// Get event by ID
router.get('/:id', eventController.getEventById);

// Update event
router.put('/:id', eventController.updateEvent);

// Delete event
router.delete('/:id', eventController.deleteEvent);

// Approve/Reject event
router.patch('/:id/approve', eventController.approveEvent);
router.patch('/:id/reject', eventController.rejectEvent);

// PARTICIPATION STATUS
router.put('/:id/participation-status', eventController.updateParticipationStatus);
router.get('/:id/participation-status', eventController.getParticipationStatus);
router.get('/pending-participation/requests', eventController.getPendingParticipationRequests);

// Participants management
router.post('/:id/participants', eventController.addParticipant);
router.delete('/:id/participants', eventController.removeParticipant);

// ========================================
// USER ROUTES (สำหรับ Event)
// ========================================

router.get('/users/by-role', eventController.getUsersByRole);
router.get('/users', eventController.getAllUsers);

export default router;