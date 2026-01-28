const Event = require('../models/event.js');
const User = require('../models/User.js');
const EventType = require('../models/eventType.js');
const googleCalendarService = require('../services/googleCalendar.js');
const emailService = require('../services/emailService.js');
const mongoose = require('mongoose');

// ========================================
// GET ALL EVENTS (✅ เพิ่ม Role-Based Filtering)
// ========================================
const getAllEvents = async (req, res) => {
    try {
        const { 
            status, 
            event_type, 
            start_date, 
            end_date,
            role,
            user_id
        } = req.query;

        console.log('📥 Backend received query parameters:', {
            event_type,
            status,
            role,
            user_id
        });

        const filter = {};
        
        if (role && user_id) {
            if (role === 'Employee') {
                filter['person_in_charge.user_id'] = user_id;
                console.log(`👤 Employee - filtering by person_in_charge: ${user_id}`);
            }
        }
        
        if (status) {
            filter.status = status;
            console.log(`📊 Adding status filter: ${status}`);
        }
        
        if (start_date || end_date) {
            filter.start_date = {};
            if (start_date) {
                filter.start_date.$gte = new Date(start_date);
            }
            if (end_date) {
                filter.start_date.$lte = new Date(end_date);
            }
        }

        let events = await Event.find(filter)
            .populate('user_id', 'user_name user_email role')
            .populate({
                path: 'person_in_charge.user_id',
                select: 'user_name user_email role department_id',
                populate: {
                    path: 'department_id',
                    select: 'department_name department_color'
                }
            })
            .populate('event_type_id', 'event_type_name event_type_color')
            .populate('approved_by', 'user_name user_email role')
            .sort({ start_date: -1 });

        if (event_type) {
            events = events.filter(event => {
                if (event.event_type_id && event.event_type_id.event_type_name) {
                    return event.event_type_id.event_type_name === event_type;
                }
                return false;
            });
        }

        res.status(200).json({
            success: true,
            count: events.length,
            data: events,
            metadata: {
                role: role || 'not_specified',
                user_id: user_id || 'not_specified',
                filter_applied: {
                    ...filter,
                    event_type_name: event_type || 'not_applied'
                },
                events_count: events.length
            }
        });
    } catch (error) {
        console.error('❌ Error in getAllEvents:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// GET EVENTS STATS
// ========================================
const getEventsStats = async (req, res) => {
    try {
        const stats = await Event.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const eventTypeStats = await Event.aggregate([
            {
                $group: {
                    _id: '$event_type_id',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                byStatus: stats,
                byEventType: eventTypeStats
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// GET EVENT BY ID
// ========================================
const getEventById = async (req, res) => {
    try {
        const { role, user_id } = req.query;

        const event = await Event.findById(req.params.id)
            .populate('user_id', 'user_name user_email role')
            .populate({
                path: 'person_in_charge.user_id',
                select: 'user_name user_email role department_id',
                populate: {
                    path: 'department_id',
                    select: 'department_name department_color'
                }
            })
            .populate('approved_by', 'user_name user_email role')
            .populate('event_type_id', 'event_type_name event_type_color');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (role === 'Employee' && user_id) {
            const isParticipant = event.person_in_charge.some(
                p => p.user_id._id.toString() === user_id
            );
            
            if (!isParticipant) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to view this event'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: event
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// CREATE EVENT
// ========================================
const createEvent = async (req, res) => {
    try {
        console.log('📝 Create Event Request:', req.body);

        const eventData = {
            ...req.body
        };

        if (!eventData.user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        if (eventData.person_in_charge && Array.isArray(eventData.person_in_charge)) {
            eventData.person_in_charge = eventData.person_in_charge
                .filter(item => {
                    if (typeof item === 'string') {
                        return item && item.trim() !== '';
                    } else if (typeof item === 'object' && item !== null) {
                        const userId = item.user_id || item._id;
                        return userId && userId.toString().trim() !== '';
                    }
                    return false;
                })
                .map(item => {
                    if (typeof item === 'string') {
                        return {
                            user_id: item,
                            participation_status: eventData.require_participation_response ? 'pending' : 'not_required'
                        };
                    } else if (typeof item === 'object' && item !== null) {
                        return {
                            user_id: item.user_id || item._id,
                            participation_status: item.participation_status || 
                                (eventData.require_participation_response ? 'pending' : 'not_required'),
                            responded_at: item.responded_at || null,
                            response_note: item.response_note || ''
                        };
                    }
                })
                .filter(item => item && item.user_id);
        }

        const event = new Event(eventData);
        await event.save();

        await event.populate([
            { path: 'user_id', select: 'user_name user_email role' },
            { path: 'person_in_charge.user_id', select: 'user_name user_email role department_name' },
            { path: 'approved_by', select: 'user_name user_email role' },
            { path: 'event_type_id', select: 'event_type_name event_type_color' }
        ]);

        console.log('✅ Event created successfully:', event._id);

        // ========================================
        // ✅ 1. ส่ง Email แจ้งเตือน CEO
        // ========================================
        try {
            let UserModel = User;
            
            // ตรวจสอบว่า User model ใช้งานได้
            if (!UserModel || typeof UserModel.find !== 'function') {
                UserModel = mongoose.model('User');
            }
            
            const ceoList = await UserModel.find({ role: 'CEO' })
                .select('user_name user_email role');
            
            console.log(`👔 Found ${ceoList.length} CEO(s) in the system`);

            if (ceoList.length > 0) {
                emailService.notifyEventCreation(
                    event.toObject(),
                    event.user_id,
                    ceoList
                ).then(result => {
                    console.log('📧 CEO notification sent:', {
                        totalSent: result.totalSent,
                        totalFailed: result.totalFailed
                    });
                }).catch(emailError => {
                    console.error('❌ CEO email notification failed:', emailError.message);
                });
            }
        } catch (emailError) {
            console.error('❌ Error in CEO email notification:', emailError);
        }

        // ========================================
        // ✅ 2. ส่ง Email แจ้งเตือน Participants
        // ========================================
        try {
            if (event.person_in_charge && event.person_in_charge.length > 0) {
                const participants = event.person_in_charge
                    .map(p => p.user_id)
                    .filter(user => user && user.user_email);

                console.log(`👥 Found ${participants.length} participant(s) with email`);

                if (participants.length > 0) {
                    emailService.notifyParticipantsEventCreated(
                        event.toObject(),
                        participants
                    ).then(result => {
                        console.log('📧 Participant notifications sent:', {
                            totalSent: result.totalSent,
                            total: participants.length
                        });
                    }).catch(emailError => {
                        console.error('❌ Participant email notification failed:', emailError.message);
                    });
                }
            }
        } catch (emailError) {
            console.error('❌ Error in participant email notification:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Event created successfully. Notifications sent.',
            data: event
        });
    } catch (error) {
        console.error('❌ Create event error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// UPDATE EVENT
// ========================================
const updateEvent = async (req, res) => {
    try {
        const { role, user_id } = req.query;

        console.log('📝 Update Event Request:', {
            eventId: req.params.id,
            role,
            user_id
        });

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (role === 'Employee' && user_id) {
            const isParticipant = event.person_in_charge.some(
                p => p.user_id.toString() === user_id
            );
            
            if (!isParticipant) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to update this event'
                });
            }
        }

        const { requesting_user_id, user_id: _, ...updateData } = req.body;
        
        if (updateData.user_id) {
            delete updateData.user_id;
            console.log('⚠️ Blocked attempt to update user_id');
        }

        if (updateData.person_in_charge && Array.isArray(updateData.person_in_charge)) {
            console.log('🔍 Original person_in_charge:', updateData.person_in_charge);
            
            updateData.person_in_charge = updateData.person_in_charge
                .filter(item => {
                    if (typeof item === 'string') {
                        return item && item.trim() !== '';
                    } else if (typeof item === 'object' && item !== null) {
                        const userId = item.user_id || item._id;
                        return userId && userId.toString().trim() !== '';
                    }
                    return false;
                })
                .map(item => {
                    if (typeof item === 'string') {
                        return {
                            user_id: item,
                            participation_status: updateData.require_participation_response ? 'pending' : 'not_required'
                        };
                    } else if (typeof item === 'object' && item !== null) {
                        return {
                            user_id: item.user_id || item._id,
                            participation_status: item.participation_status || 
                                (updateData.require_participation_response ? 'pending' : 'not_required'),
                            responded_at: item.responded_at || null,
                            response_note: item.response_note || ''
                        };
                    }
                })
                .filter(item => item && item.user_id);
            
            console.log('✅ Processed person_in_charge:', updateData.person_in_charge);
        }

        Object.assign(event, updateData);
        await event.save();

        await event.populate([
            { path: 'user_id', select: 'user_name user_email role' },
            { path: 'person_in_charge.user_id', select: 'user_name user_email role department_id' },
            { path: 'event_type_id', select: 'event_type_name event_type_color' },
            { path: 'approved_by', select: 'user_name user_email role' }
        ]);

        console.log('✅ Event updated successfully');

        res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: event
        });
    } catch (error) {
        console.error('❌ Update event error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// DELETE EVENT
// ========================================
const deleteEvent = async (req, res) => {
    try {
        const { role } = req.query;

        if (role === 'Employee') {
            return res.status(403).json({
                success: false,
                message: 'Only CEO and Admin can delete events'
            });
        }

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        await event.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// APPROVE EVENT
// ========================================
const approveEvent = async (req, res) => {
    try {
        console.log('🟢 Approve Event Request:', {
            eventId: req.params.id,
            body: req.body
        });

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const { approved_by, comment } = req.body;

        if (!approved_by) {
            return res.status(400).json({
                success: false,
                message: 'approved_by (user_id) is required'
            });
        }

        // ใช้ User model โดยตรง
        let UserModel = User;
        
        // ตรวจสอบว่า User model ใช้งานได้
        if (!UserModel || typeof UserModel.findById !== 'function') {
            UserModel = mongoose.model('User');
        }

        const user = await UserModel.findById(approved_by);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('👤 User info:', {
            id: user._id,
            name: user.user_name,
            role: user.role
        });

        const allowedRoles = ['admin', 'Admin', 'CEO'];
        
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: `Only Admin or CEO can approve events. Your role: ${user.role}`
            });
        }

        if (typeof event.approve === 'function') {
            await event.approve(approved_by, comment || '');
        } else {
            event.status = 'approved';
            event.approved_by = approved_by;
            event.comment = comment || '';
            event.updatedAt = new Date();
            await event.save();
        }

        await event.populate([
            { path: 'user_id', select: 'user_name user_email role' },
            { path: 'person_in_charge.user_id', select: 'user_name user_email role' },
            { path: 'approved_by', select: 'user_name user_email role' },
            { path: 'event_type_id', select: 'event_type_name event_type_color' }
        ]);

        console.log('✅ Event approved successfully');

        try {
            if (event.user_id && event.user_id.user_email) {
                emailService.notifyEventStatusChange(
                    event.toObject(),
                    user,
                    'approved',
                    comment || 'Your event has been approved'
                ).then(() => {
                    console.log('📧 Approval email sent to creator:', event.user_id.user_email);
                }).catch(emailError => {
                    console.error('❌ Failed to send approval email to creator:', emailError.message);
                });
            }
        } catch (emailError) {
            console.error('❌ Error in creator email notification:', emailError);
        }

        try {
            if (event.person_in_charge && event.person_in_charge.length > 0) {
                const participants = event.person_in_charge
                    .map(p => p.user_id)
                    .filter(user => user && user.user_email);

                console.log(`👥 Notifying ${participants.length} participant(s) about approval`);

                if (participants.length > 0) {
                    emailService.notifyParticipantsEventApproved(
                        event.toObject(),
                        participants,
                        comment
                    ).then(result => {
                        console.log('📧 Participant approval notifications sent:', {
                            totalSent: result.totalSent
                        });
                    }).catch(emailError => {
                        console.error('❌ Failed to notify participants:', emailError.message);
                    });
                }
            }
        } catch (emailError) {
            console.error('❌ Error in participant email notification:', emailError);
        }

        res.status(200).json({
            success: true,
            message: 'Event approved successfully',
            data: event
        });
    } catch (error) {
        console.error('❌ Error in approveEvent:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to approve event'
        });
    }
};

// ========================================
// REJECT EVENT
// ========================================
const rejectEvent = async (req, res) => {
    try {
        console.log('🔴 Reject Event Request:', {
            eventId: req.params.id,
            body: req.body
        });

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const { approved_by, comment } = req.body;

        if (!approved_by) {
            return res.status(400).json({
                success: false,
                message: 'approved_by (user_id) is required'
            });
        }

        if (!comment || !comment.trim()) {
            return res.status(400).json({
                success: false,
                message: 'comment is required when rejecting an event'
            });
        }

        // ใช้ User model โดยตรง
        let UserModel = User;
        
        // ตรวจสอบว่า User model ใช้งานได้
        if (!UserModel || typeof UserModel.findById !== 'function') {
            UserModel = mongoose.model('User');
        }

        const user = await UserModel.findById(approved_by);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('👤 User info:', {
            id: user._id,
            name: user.user_name,
            role: user.role
        });

        const allowedRoles = ['admin', 'Admin', 'CEO'];
        
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: `Only Admin or CEO can reject events. Your role: ${user.role}`
            });
        }

        if (typeof event.reject === 'function') {
            await event.reject(approved_by, comment.trim());
        } else {
            event.status = 'rejected';
            event.approved_by = approved_by;
            event.updatedAt = new Date();
            await event.save();
        }

        await event.populate([
            { path: 'user_id', select: 'user_name user_email role' },
            { path: 'person_in_charge.user_id', select: 'user_name user_email role' },
            { path: 'approved_by', select: 'user_name user_email role' },
            { path: 'event_type_id', select: 'event_type_name event_type_color' }
        ]);

        console.log('✅ Event rejected successfully');

        try {
            if (event.user_id && event.user_id.user_email) {
                emailService.notifyEventStatusChange(
                    event.toObject(),
                    user,
                    'rejected',
                    comment.trim()
                ).then(() => {
                    console.log('📧 Rejection email sent to creator:', event.user_id.user_email);
                }).catch(emailError => {
                    console.error('❌ Failed to send rejection email to creator:', emailError.message);
                });
            }
        } catch (emailError) {
            console.error('❌ Error in creator email notification:', emailError);
        }

        try {
            if (event.person_in_charge && event.person_in_charge.length > 0) {
                const participants = event.person_in_charge
                    .map(p => p.user_id)
                    .filter(user => user && user.user_email);

                console.log(`👥 Notifying ${participants.length} participant(s) about rejection`);

                if (participants.length > 0) {
                    emailService.notifyParticipantsEventRejected(
                        event.toObject(),
                        participants,
                        comment.trim()
                    ).then(result => {
                        console.log('📧 Participant rejection notifications sent:', {
                            totalSent: result.totalSent
                        });
                    }).catch(emailError => {
                        console.error('❌ Failed to notify participants:', emailError.message);
                    });
                }
            }
        } catch (emailError) {
            console.error('❌ Error in participant email notification:', emailError);
        }

        res.status(200).json({
            success: true,
            message: 'Event rejected successfully',
            data: event
        });
    } catch (error) {
        console.error('❌ Error in rejectEvent:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to reject event'
        });
    }
};

// ========================================
// UPDATE PARTICIPATION STATUS
// ========================================
const updateParticipationStatus = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const { user_id, status, note } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        if (!status || !['accepted', 'declined'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'status must be either "accepted" or "declined"'
            });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (!event.require_participation_response) {
            return res.status(400).json({
                success: false,
                message: 'This event does not require participation response'
            });
        }

        await event.updateParticipationStatus(user_id, status, note);

        await event.populate([
            { path: 'user_id', select: 'user_name user_email' },
            { path: 'person_in_charge.user_id', select: 'user_name user_email role' },
            { path: 'event_type_id', select: 'event_type_name event_type_color' }
        ]);

        res.status(200).json({
            success: true,
            message: `Participation ${status} successfully`,
            data: event
        });
    } catch (error) {
        console.error('❌ Update participation error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// GET PENDING PARTICIPATION REQUESTS
// ========================================
const getPendingParticipationRequests = async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        const events = await Event.findPendingResponseByUser(user_id);

        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        console.error('❌ Get pending requests error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// GET PARTICIPATION STATUS
// ========================================
const getParticipationStatus = async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const participationStatus = event.getUserParticipationStatus(user_id);

        if (!participationStatus) {
            return res.status(404).json({
                success: false,
                message: 'User is not a participant of this event'
            });
        }

        res.status(200).json({
            success: true,
            data: participationStatus
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// GET USER EVENTS
// ========================================
const getUserEvents = async (req, res) => {
    try {
        const { user_id, status, includeParticipant = 'true' } = req.query;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required in query parameter'
            });
        }

        const events = await Event.findByUser(user_id, {
            status: status || null,
            includeParticipant: includeParticipant === 'true'
        });

        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// GET EVENTS BY DATE RANGE
// ========================================
const getEventsByDateRange = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'start_date and end_date are required'
            });
        }

        const events = await Event.findByDateRange(
            new Date(start_date),
            new Date(end_date)
        );

        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// ADD PARTICIPANT
// ========================================
const addParticipant = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        // ใช้ User model โดยตรง
        let UserModel = User;
        
        // ตรวจสอบว่า User model ใช้งานได้
        if (!UserModel || typeof UserModel.findById !== 'function') {
            UserModel = mongoose.model('User');
        }

        const user = await UserModel.findById(user_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await event.addParticipant(user_id, event.require_participation_response);
        
        await event.populate('person_in_charge.user_id', 'user_name user_email role department_id');

        res.status(200).json({
            success: true,
            message: 'Participant added successfully',
            data: event
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// REMOVE PARTICIPANT
// ========================================
const removeParticipant = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        await event.removeParticipant(user_id);
        
        await event.populate('person_in_charge.user_id', 'user_name user_email role department_id');

        res.status(200).json({
            success: true,
            message: 'Participant removed successfully',
            data: event
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// GET USERS BY ROLE
// ========================================
const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.query;

        // ใช้ User model โดยตรง
        let UserModel = User;
        
        // ตรวจสอบว่า User model ใช้งานได้
        if (!UserModel || typeof UserModel.find !== 'function') {
            UserModel = mongoose.model('User');
        }

        const query = role ? { role } : {};
        
        const users = await UserModel.find(query)
            .select('user_name user_email role department_id status')
            .populate('department_id', 'department_name');

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// ========================================
// GET ALL USERS
// ========================================
const getAllUsers = async (req, res) => {
    try {
        // ใช้ User model โดยตรง
        let UserModel = User;
        
        // ตรวจสอบว่า User model ใช้งานได้
        if (!UserModel || typeof UserModel.find !== 'function') {
            UserModel = mongoose.model('User');
        }

        const users = await UserModel.find()
            .select('user_name user_email role department_id status')
            .populate('department_id', 'department_name');

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllEvents,
    getEventsStats,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    approveEvent,
    rejectEvent,
    updateParticipationStatus,
    getPendingParticipationRequests,
    getParticipationStatus,
    getUserEvents,
    getEventsByDateRange,
    addParticipant,
    removeParticipant,
    getUsersByRole,
    getAllUsers
};