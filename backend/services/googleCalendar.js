import { google } from 'googleapis';
import User from '../models/User.js';

class GoogleCalendarService {
    constructor() {
        // ✅ เพิ่มการตรวจสอบก่อนสร้าง OAuth client
        console.log('🏗️ Initializing GoogleCalendarService...');
        console.log('📋 Credentials:', {
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'EXISTS' : 'MISSING',
            GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI
        });

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            console.error('❌ Missing Google OAuth credentials!');
            throw new Error('Google OAuth credentials are not configured');
        }

        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        // ✅ ตรวจสอบว่า OAuth2Client ถูกสร้างสำเร็จ
        console.log('✅ OAuth2Client created successfully');
        console.log('🔑 Client has credentials:', {
            _clientId: !!this.oauth2Client._clientId,
            _clientSecret: !!this.oauth2Client._clientSecret,
            redirectUri: this.oauth2Client.redirectUri
        });
        
        this.oauth2Client.on('tokens', (tokens) => {
            console.log('🔄 Tokens refreshed');
        });
        
        this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        console.log('✅ GoogleCalendarService initialized');
    }

  // ✅ สร้าง Authorization URL
  getAuthUrl() {
    console.log('🔗 Generating auth URL with:', {
        client_id: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI
    });

    if (!process.env.GOOGLE_CLIENT_ID) {
        throw new Error('GOOGLE_CLIENT_ID is not set');
    }

    const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ],
        prompt: 'consent'
    });

    // ✅ Log URL เต็มๆ เพื่อ debug
    console.log('✅ Generated FULL auth URL:', authUrl);
    console.log('🔍 URL contains client_id?', authUrl.includes('client_id'));
    
    return authUrl;
}

  // ✅ แลก Code เป็น Token
  async getTokenFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }


  async setCredentialsForUser(userId) {
    const user = await User.findById(userId);
    if (!user || !user.google_tokens) {
        throw new Error('User not connected to Google Calendar');
    }
    
    console.log('🔑 Loaded tokens from database:', {
        has_access_token: !!user.google_tokens.access_token,
        has_refresh_token: !!user.google_tokens.refresh_token,
        has_expiry_date: !!user.google_tokens.expiry_date,
        token_keys: Object.keys(user.google_tokens),
        // ✅ เพิ่มบรรทัดนี้เพื่อดู values จริงๆ
        access_token_length: user.google_tokens.access_token?.length || 0,
        refresh_token_length: user.google_tokens.refresh_token?.length || 0,
        actual_values: {
            access_token: user.google_tokens.access_token ? 'EXISTS' : 'NULL/EMPTY',
            refresh_token: user.google_tokens.refresh_token ? 'EXISTS' : 'NULL/EMPTY'
        }
    });
    
    // ✅ เพิ่มการตรวจสอบก่อน set credentials
    if (!user.google_tokens.access_token || !user.google_tokens.refresh_token) {
        throw new Error('Invalid tokens: access_token or refresh_token is missing');
    }
    
    this.oauth2Client.setCredentials(user.google_tokens);
    return user;
}

  // ✅ สร้าง Event ใน Google Calendar
  async createEvent(userId, eventData) {
    try {
      await this.setCredentialsForUser(userId);

      // เตรียม attendees (ต้องมี email)
      const attendees = [];
      if (eventData.person_in_charge && Array.isArray(eventData.person_in_charge)) {
        for (const person of eventData.person_in_charge) {
          // Handle both populated and non-populated person_in_charge
          let userEmail = null;

          if (person.user_id) {
            // New format with participation_status
            if (typeof person.user_id === 'object' && person.user_id.user_email) {
              userEmail = person.user_id.user_email;
            } else if (typeof person.user_id === 'string') {
              const user = await User.findById(person.user_id).select('user_email');
              if (user && user.user_email) {
                userEmail = user.user_email;
              }
            }
          } else if (typeof person === 'string') {
            // Old format (direct user_id string)
            const user = await User.findById(person).select('user_email');
            if (user && user.user_email) {
              userEmail = user.user_email;
            }
          } else if (person.user_email) {
            // Direct user object
            userEmail = person.user_email;
          }

          if (userEmail) {
            attendees.push({ email: userEmail });
          }
        }
      }

      const event = {
        summary: eventData.event_name,
        description: eventData.description || '',
        start: {
          dateTime: new Date(eventData.start_date).toISOString(),
          timeZone: 'Asia/Bangkok',
        },
        end: {
          dateTime: new Date(eventData.end_date).toISOString(),
          timeZone: 'Asia/Bangkok',
        },
        attendees: attendees,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      console.log('📤 Creating Google Calendar event:', {
        summary: event.summary,
        start: event.start.dateTime,
        end: event.end.dateTime,
        attendees: attendees.length
      });

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all', // ส่ง email notification ให้ attendees
      });

      console.log('✅ Google Calendar Event Created:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating Google Calendar event:', error.message);
      throw error;
    }
  }

  // ✅ อัปเดต Event
  async updateEvent(userId, googleEventId, eventData) {
    try {
      await this.setCredentialsForUser(userId);

      const attendees = [];
      if (eventData.person_in_charge && Array.isArray(eventData.person_in_charge)) {
        for (const person of eventData.person_in_charge) {
          let userEmail = null;

          if (person.user_id) {
            if (typeof person.user_id === 'object' && person.user_id.user_email) {
              userEmail = person.user_id.user_email;
            } else if (typeof person.user_id === 'string') {
              const user = await User.findById(person.user_id).select('user_email');
              if (user && user.user_email) {
                userEmail = user.user_email;
              }
            }
          } else if (typeof person === 'string') {
            const user = await User.findById(person).select('user_email');
            if (user && user.user_email) {
              userEmail = user.user_email;
            }
          } else if (person.user_email) {
            userEmail = person.user_email;
          }

          if (userEmail) {
            attendees.push({ email: userEmail });
          }
        }
      }

      const event = {
        summary: eventData.event_name,
        description: eventData.description || '',
        start: {
          dateTime: new Date(eventData.start_date).toISOString(),
          timeZone: 'Asia/Bangkok',
        },
        end: {
          dateTime: new Date(eventData.end_date).toISOString(),
          timeZone: 'Asia/Bangkok',
        },
        attendees: attendees,
      };

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: googleEventId,
        resource: event,
        sendUpdates: 'all',
      });

      console.log('✅ Google Calendar Event Updated:', googleEventId);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating Google Calendar event:', error.message);
      throw error;
    }
  }

  // ✅ ลบ Event
  async deleteEvent(userId, googleEventId) {
    try {
      await this.setCredentialsForUser(userId);

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId,
        sendUpdates: 'all',
      });

      console.log('✅ Google Calendar Event Deleted:', googleEventId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting Google Calendar event:', error.message);
      throw error;
    }
  }
  // ✅ สร้าง Holiday ใน Google Calendar
async createHoliday(userId, holidayData) {
    try {
        await this.setCredentialsForUser(userId);

        const event = {
            summary: holidayData.holiday_name,
            description: holidayData.description || `${holidayData.holiday_type} - ${holidayData.holiday_name}`,
            start: {
                date: new Date(holidayData.start_date).toISOString().split('T')[0],
                timeZone: 'Asia/Bangkok',
            },
            end: {
                // Google Calendar: end date is exclusive, so add 1 day
                date: new Date(new Date(holidayData.end_date).getTime() + 24*60*60*1000).toISOString().split('T')[0],
                timeZone: 'Asia/Bangkok',
            },
            colorId: holidayData.holiday_type?.toLowerCase() === 'public holiday' ? '9' : '11', // Blue for public, Red for leave
        };

        console.log('📤 Creating Google Calendar holiday:', event);

        const response = await this.calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        console.log('✅ Google Calendar Holiday Created:', response.data.id);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating Google Calendar holiday:', error.message);
        throw error;
    }
}
}

export default new GoogleCalendarService();