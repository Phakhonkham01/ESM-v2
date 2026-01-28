import emailjs from '@emailjs/browser';

// กำหนดค่าจาก .env
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * ส่งอีเมลแจ้งเตือนเมื่อสร้าง Event
 * @param {Object} eventData - ข้อมูล Event
 * @param {Array} recipients - อาร์เรย์ของ users ที่จะส่งเมล
 */
export const sendEventNotification = async (eventData, recipients) => {
    try {
        // ส่งเมลให้แต่ละคน
        const emailPromises = recipients.map(async (recipient) => {
            const templateParams = {
                to_email: recipient.email,
                to_name: recipient.name,
                event_name: eventData.event_name,
                event_type: eventData.event_type,
                start_date: new Date(eventData.start_date).toLocaleDateString('th-TH'),
                end_date: new Date(eventData.end_date).toLocaleDateString('th-TH'),
                description: eventData.description || 'ไม่มีรายละเอียด',
                created_by: eventData.created_by_name || 'System'
            };

            return emailjs.send(
                SERVICE_ID,
                TEMPLATE_ID,
                templateParams,
                PUBLIC_KEY
            );
        });

        const results = await Promise.allSettled(emailPromises);
        
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        console.log(`✅ ส่งเมลสำเร็จ: ${successCount}, ❌ ไม่สำเร็จ: ${failCount}`);

        return {
            success: true,
            total: recipients.length,
            successCount,
            failCount
        };
    } catch (error) {
        console.error('Error sending emails:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * ส่งเมลหา CEO หรือ Admin เท่านั้น
 * @param {Object} eventData - ข้อมูล Event
 * @param {Array} allUsers - ผู้ใช้ทั้งหมด
 */
export const sendEventNotificationToCEO = async (eventData, allUsers) => {
    // กรองเฉพาะ CEO หรือ Admin
    const ceoUsers = allUsers.filter(user => 
        user.role === 'CEO' || user.role === 'admin'
    );

    if (ceoUsers.length === 0) {
        console.warn('⚠️ ไม่พบ CEO หรือ Admin ในระบบ');
        return { success: false, message: 'No CEO/Admin found' };
    }

    return await sendEventNotification(eventData, ceoUsers);
};