import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing Google OAuth URL generation...\n');

console.log('Environment Variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'EXISTS' : 'MISSING');
console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
console.log('\n---\n');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ],
    prompt: 'consent'
});

console.log('Generated URL:', authUrl);
console.log('\nURL Analysis:');
console.log('Contains client_id?', authUrl.includes('client_id='));
console.log('Contains redirect_uri?', authUrl.includes('redirect_uri='));
console.log('Contains scope?', authUrl.includes('scope='));

// Extract client_id from URL
const clientIdMatch = authUrl.match(/client_id=([^&]*)/);
if (clientIdMatch) {
    console.log('\nExtracted client_id from URL:', clientIdMatch[1]);
}