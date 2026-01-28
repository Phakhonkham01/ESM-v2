import express from 'express';
const router = express.Router();
import googleCalendarService from '../services/googleCalendar.js';
import User from '../models/User.js';

router.get('/auth', (req, res) => {
    try {
        const { user_id } = req.query;
        
        console.log('🔐 Auth request received for user:', user_id);
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        // ✅ ตรวจสอบ env variables
        console.log('🔍 Environment check in /auth:', {
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
            GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI
        });

        const authUrl = googleCalendarService.getAuthUrl();
        const fullAuthUrl = `${authUrl}&state=${user_id}`;
        
        console.log('✅ Sending auth URL to client');
        
        res.json({
            success: true,
            authUrl: fullAuthUrl
        });
    } catch (error) {
        console.error('❌ Error in /auth:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/callback', async (req, res) => {
    try {
        const { code, state: userId } = req.query;

        if (!code || !userId) {
            // ✅ ใช้ full URL
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <script>
                        window.location.href = 'http://localhost:5173/metronic8/react/demo7/dashboard?google_connected=false&error=missing_params';
                    </script>
                </head>
                <body>
                    <p>Redirecting...</p>
                </body>
                </html>
            `);
        }

        console.log('🔐 Exchanging code for tokens...');
        const tokens = await googleCalendarService.getTokenFromCode(code);

        console.log('🔑 Received tokens from Google:', {
            has_access_token: !!tokens.access_token,
            has_refresh_token: !!tokens.refresh_token,
            access_token_length: tokens.access_token?.length || 0,
            refresh_token_length: tokens.refresh_token?.length || 0,
            expiry_date: tokens.expiry_date
        });

        if (!tokens.access_token || !tokens.refresh_token) {
            console.error('❌ Invalid tokens received from Google!');
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <script>
                        window.location.href = 'http://localhost:5173/metronic8/react/demo7/dashboard?google_connected=false&error=invalid_tokens';
                    </script>
                </head>
                <body>
                    <p>Redirecting...</p>
                </body>
                </html>
            `);
        }

        console.log('💾 Saving tokens to database...');
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                google_tokens: tokens,
                google_connected_at: new Date()
            },
            { new: true }
        );

        console.log('✅ Tokens saved. Verification:', {
            has_access_token: !!updatedUser.google_tokens?.access_token,
            has_refresh_token: !!updatedUser.google_tokens?.refresh_token
        });

        console.log(`✅ User ${userId} connected to Google Calendar`);

        // ✅ ใช้ full URL พร้อม meta refresh เป็น backup
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="refresh" content="0;url=http://localhost:5173/metronic8/react/demo7/dashboard?google_connected=true">
                <title>Google Calendar Connected</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: #f5f5f5;
                    }
                    .container {
                        text-align: center;
                        background: white;
                        padding: 40px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .spinner {
                        border: 3px solid #f3f3f3;
                        border-top: 3px solid #4285f4;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 20px auto;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    h1 { color: #4285f4; margin-bottom: 10px; }
                    p { color: #666; }
                </style>
                <script>
                    // Redirect ทันที
                    window.location.href = 'http://localhost:5173/metronic8/react/demo7/dashboard?google_connected=true';
                </script>
            </head>
            <body>
                <div class="container">
                    <h1>✅ Connected Successfully!</h1>
                    <div class="spinner"></div>
                    <p>Redirecting to dashboard...</p>
                    <p style="margin-top: 20px; font-size: 12px;">
                        If not redirected, <a href="http://localhost:5173/metronic8/react/demo7/dashboard?google_connected=true">click here</a>
                    </p>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('❌ OAuth callback error:', error);
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="refresh" content="0;url=http://localhost:5173/metronic8/react/demo7/dashboard?google_connected=false&error=token_exchange_failed">
                <script>
                    window.location.href = 'http://localhost:5173/metronic8/react/demo7/dashboard?google_connected=false&error=token_exchange_failed';
                </script>
            </head>
            <body>
                <p>Redirecting...</p>
            </body>
            </html>
        `);
    }
});

// ✅ Check Connection Status
router.get('/status', async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        const user = await User.findById(user_id).select('google_tokens google_connected_at');

        res.json({
            success: true,
            connected: !!user?.google_tokens,
            connected_at: user?.google_connected_at || null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ✅ Disconnect Google Calendar
router.post('/disconnect', async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        await User.findByIdAndUpdate(user_id, {
            $unset: { google_tokens: 1, google_connected_at: 1 }
        });

        res.json({
            success: true,
            message: 'Google Calendar disconnected successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ✅ ⭐ NEW: Manual Sync Event to Google Calendar
// ✅ Manual Sync Event to Google Calendar
router.post('/sync-event/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { user_id } = req.body;

        console.log('📥 Sync event request:', { eventId, user_id });

        // ✅ เพิ่ม logging ตรงนี้
        console.log('🔍 Environment Variables Check:');
        console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
        console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
        console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        // ✅ ตรวจสอบว่า user เชื่อม Google Calendar แล้วหรือยัง
        const user = await User.findById(user_id).select('google_tokens');
        
        console.log('👤 User found:', user ? '✅ Yes' : '❌ No');
        console.log('🔑 Google tokens:', user?.google_tokens ? '✅ Exist' : '❌ Missing');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.google_tokens) {
            return res.status(400).json({
                success: false,
                message: 'Please connect your Google Calendar first',
                code: 'GOOGLE_NOT_CONNECTED'
            });
        }

        // ดึง Event Model - ✅ เปลี่ยนเป็น import ตรงๆ
        const Event = (await import('../models/event.js')).default;
        const event = await Event.findById(eventId)
            .populate('user_id', 'user_name user_email')
            .populate('person_in_charge.user_id', 'user_name user_email');

        console.log('📋 Event found:', event ? '✅ Yes' : '❌ No');
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        console.log('📋 Event details:', {
            name: event.event_name,
            start: event.start_date,
            end: event.end_date,
            already_synced: !!event.google_calendar_event_id
        });

        // ตรวจสอบว่า event นี้ sync แล้วหรือยัง
        if (event.google_calendar_event_id) {
            return res.status(400).json({
                success: false,
                message: 'This event is already synced to Google Calendar',
                data: {
                    google_event_id: event.google_calendar_event_id
                }
            });
        }

        // Sync ไป Google Calendar
        console.log('🔄 Calling googleCalendarService.createEvent...');
        
        try {
            const googleEvent = await googleCalendarService.createEvent(user_id, event);

            console.log('✅ Google event created:', googleEvent.id);

            // บันทึก Google Calendar Event ID
            event.google_calendar_event_id = googleEvent.id;
            event.google_synced_at = new Date();
            event.google_synced_by = user_id;
            await event.save();

            console.log('✅ Event synced successfully');

            res.json({
                success: true,
                message: 'Event synced to Google Calendar successfully',
                data: {
                    event_id: event._id,
                    google_event_id: googleEvent.id,
                    google_event_link: googleEvent.htmlLink
                }
            });
        } catch (googleError) {
            console.error('❌ Google Calendar API Error:', googleError.message);
            console.error('❌ Full error:', googleError);
            
            // ✅ แยก error ตาม type
            if (googleError.message.includes('not connected')) {
                return res.status(400).json({
                    success: false,
                    message: 'Your Google Calendar connection has expired. Please reconnect.',
                    code: 'GOOGLE_TOKEN_EXPIRED'
                });
            }
            
            return res.status(500).json({
                success: false,
                message: `Failed to sync to Google Calendar: ${googleError.message}`,
                code: 'GOOGLE_API_ERROR',
                details: googleError.toString()
            });
        }
    } catch (error) {
        console.error('❌ Sync error:', error.message);
        console.error('❌ Full error:', error);
        console.error('❌ Stack trace:', error.stack);
        
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to sync event to Google Calendar',
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
});

// ✅ ⭐ NEW: Remove Event from Google Calendar
router.delete('/unsync-event/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { user_id } = req.query;

        console.log('🗑️ Unsync event request:', { eventId, user_id });

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        const { default: Event } = await import('../models/event.js');
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (!event.google_calendar_event_id) {
            return res.status(400).json({
                success: false,
                message: 'This event is not synced with Google Calendar'
            });
        }

        console.log('🗑️ Removing from Google Calendar:', event.google_calendar_event_id);

        // ลบจาก Google Calendar
        await googleCalendarService.deleteEvent(user_id, event.google_calendar_event_id);

        // ลบ Google Calendar ID จาก Event
        event.google_calendar_event_id = undefined;
        event.google_synced_at = undefined;
        event.google_synced_by = undefined;
        await event.save();

        console.log('✅ Event removed from Google Calendar');

        res.json({
            success: true,
            message: 'Event removed from Google Calendar successfully'
        });
    } catch (error) {
        console.error('❌ Unsync error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to remove event from Google Calendar'
        });
    }
});
// ✅ Sync Holiday to Google Calendar
router.post('/sync-holiday/:holidayId', async (req, res) => {
    try {
        const { holidayId } = req.params;
        const { user_id } = req.body;

        console.log('📥 Sync holiday request:', { holidayId, user_id });

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        const user = await User.findById(user_id).select('google_tokens');
        
        if (!user || !user.google_tokens) {
            return res.status(400).json({
                success: false,
                message: 'Please connect your Google Calendar first',
                code: 'GOOGLE_NOT_CONNECTED'
            });
        }

        // Import Holiday model
        const { default: Holiday } = await import('../models/holiday.js');
        const holiday = await Holiday.findById(holidayId)
            .populate('user_id', 'user_name user_email');

        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found'
            });
        }

        if (holiday.google_calendar_event_id) {
            return res.status(400).json({
                success: false,
                message: 'This holiday is already synced to Google Calendar'
            });
        }

        // Create event in Google Calendar
        const googleEvent = await googleCalendarService.createHoliday(user_id, holiday);

        // Save Google Calendar Event ID
        holiday.google_calendar_event_id = googleEvent.id;
        holiday.google_synced_at = new Date();
        holiday.google_synced_by = user_id;
        await holiday.save();

        console.log('✅ Holiday synced successfully:', googleEvent.id);

        res.json({
            success: true,
            message: 'Holiday synced to Google Calendar successfully',
            data: {
                holiday_id: holiday._id,
                google_event_id: googleEvent.id,
                google_event_link: googleEvent.htmlLink
            }
        });
    } catch (error) {
        console.error('❌ Sync holiday error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to sync holiday to Google Calendar'
        });
    }
});

// ✅ Remove Holiday from Google Calendar
router.delete('/unsync-holiday/:holidayId', async (req, res) => {
    try {
        const { holidayId } = req.params;
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id is required'
            });
        }

        const { default: Holiday } = await import('../models/holiday.js');
        const holiday = await Holiday.findById(holidayId);

        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found'
            });
        }

        if (!holiday.google_calendar_event_id) {
            return res.status(400).json({
                success: false,
                message: 'This holiday is not synced with Google Calendar'
            });
        }

        // Delete from Google Calendar
        await googleCalendarService.deleteEvent(user_id, holiday.google_calendar_event_id);

        // Remove Google Calendar ID
        holiday.google_calendar_event_id = undefined;
        holiday.google_synced_at = undefined;
        holiday.google_synced_by = undefined;
        await holiday.save();

        res.json({
            success: true,
            message: 'Holiday removed from Google Calendar successfully'
        });
    } catch (error) {
        console.error('❌ Unsync holiday error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to remove holiday from Google Calendar'
        });
    }
});


export default router;