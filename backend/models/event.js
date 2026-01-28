import mongoose from 'mongoose';

// ✅ Updated Event Model with Participation Status in person_in_charge
const EventSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    event_name: {
        type: String,
        required: [true, 'Event name is required'],
        trim: true,
        maxlength: [200, 'Event name cannot exceed 200 characters']
    },
    event_type_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EventType',
        required: [true, 'Event type is required']
    },
    // ✅ อัปเดต person_in_charge ให้รองรับ participation status
    person_in_charge: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        participation_status: {
            type: String,
            enum: ['not_required', 'pending', 'accepted', 'declined'],
            default: 'not_required'
        },
        responded_at: {
            type: Date,
            default: null
        },
        response_note: {
            type: String,
            trim: true,
            maxlength: [200, 'Response note cannot exceed 200 characters']
        }
    }],
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    start_date: {
        type: Date,
        required: [true, 'Start date is required']
    },
    end_date: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
            validator: function (value) {
                return value >= this.start_date;
            },
            message: 'End date must be greater than or equal to start date'
        }
    },
    google_calendar_event_id: {
        type: String,
        trim: true
    },
    google_synced_at: {
        type: Date
    },
    google_synced_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'approved', 'rejected'],
            message: '{VALUE} is not a valid status'
        },
        default: 'pending'
    },
    approved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    require_participation_response: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
EventSchema.index({ user_id: 1, start_date: 1 });
EventSchema.index({ start_date: 1, end_date: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ 'person_in_charge.user_id': 1 });

// ✅ Virtuals
EventSchema.virtual('duration_days').get(function () {
    if (this.start_date && this.end_date) {
        const diffTime = Math.abs(this.end_date - this.start_date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }
    return 0;
});

EventSchema.virtual('participants_count').get(function () {
    return this.person_in_charge ? this.person_in_charge.length : 0;
});

EventSchema.virtual('participation_stats').get(function () {
    if (!this.require_participation_response || !this.person_in_charge) {
        return null;
    }
    const stats = { total: this.person_in_charge.length, accepted: 0, declined: 0, pending: 0 };
    this.person_in_charge.forEach(participant => {
        if (participant.participation_status === 'accepted') stats.accepted++;
        else if (participant.participation_status === 'declined') stats.declined++;
        else if (participant.participation_status === 'pending') stats.pending++;
    });
    return stats;
});

// ✅ Pre-save middleware
EventSchema.pre('save', function (next) {
    if (this.start_date > this.end_date) {
        next(new Error('Start date must be before or equal to end date'));
    }
    if (this.require_participation_response) {
        this.person_in_charge.forEach(participant => {
            if (participant.participation_status === 'not_required') {
                participant.participation_status = 'pending';
            }
        });
    }
    next();
});

// ✅ Statics
EventSchema.statics.findByDateRange = function (startDate, endDate, populate = true) {
    const query = this.find({
        $or: [
            { start_date: { $gte: startDate, $lte: endDate } },
            { end_date: { $gte: startDate, $lte: endDate } },
            { start_date: { $lte: startDate }, end_date: { $gte: endDate } }
        ]
    });
    if (populate) {
        query.populate('user_id', 'user_name user_email')
            .populate('person_in_charge.user_id', 'user_name user_email')
            .populate('approved_by', 'user_name user_email')
            .populate('event_type_id', 'event_type_name event_type_color');
    }
    return query.sort({ start_date: 1 });
};

EventSchema.statics.findByUser = function (userId, options = {}) {
    const { status = null, includeParticipant = true } = options;
    const query = { $or: [{ user_id: userId }] };
    if (includeParticipant) {
        query.$or.push({ 'person_in_charge.user_id': userId });
    }
    if (status) { query.status = status; }
    return this.find(query)
        .populate('user_id', 'user_name user_email')
        .populate('person_in_charge.user_id', 'user_name user_email')
        .populate('approved_by', 'user_name user_email')
        .populate('event_type_id', 'event_type_name event_type_color')
        .sort({ start_date: -1 });
};

EventSchema.statics.findPendingResponseByUser = function (userId) {
    return this.find({
        'person_in_charge': { $elemMatch: { user_id: userId, participation_status: 'pending' } },
        require_participation_response: true,
        status: 'approved' 
    })
        .populate('user_id', 'user_name user_email')
        .populate('event_type_id', 'event_type_name event_type_color')
        .sort({ start_date: 1 });
};

// ✅ Methods
EventSchema.methods.addParticipant = function (userId, requireResponse = false) {
    const exists = this.person_in_charge.some(p => p.user_id.toString() === userId.toString());
    if (!exists) {
        this.person_in_charge.push({
            user_id: userId,
            participation_status: requireResponse ? 'pending' : 'not_required'
        });
        return this.save();
    }
    return Promise.resolve(this);
};

EventSchema.methods.removeParticipant = function (userId) {
    this.person_in_charge = this.person_in_charge.filter(p => p.user_id.toString() !== userId.toString());
    return this.save();
};

EventSchema.methods.updateParticipationStatus = function (userId, status, note = '') {
    const participant = this.person_in_charge.find(p => p.user_id.toString() === userId.toString());
    if (!participant) throw new Error('User is not a participant of this event');
    if (!this.require_participation_response) throw new Error('This event does not require participation response');
    if (!['accepted', 'declined'].includes(status)) throw new Error('Invalid status');
    
    participant.participation_status = status;
    participant.responded_at = new Date();
    if (note) participant.response_note = note;
    return this.save();
};

EventSchema.methods.approve = function (approvedById, comment = '') {
    this.status = 'approved';
    this.approved_by = approvedById;
    if (comment) this.comment = comment;
    return this.save();
};

EventSchema.methods.reject = function (approvedById, comment) {
    this.status = 'rejected';
    this.approved_by = approvedById;
    this.comment = comment;
    return this.save();
};

// Final Export
const Event = mongoose.model('Event', EventSchema);
export default Event;