// controllers/eventTypeController.js
import EventType from '../models/eventType.js';

// สร้าง Event Type ใหม่
export const createEventType = async (req, res) => {
  try {
    const { event_type_name, event_type_color } = req.body;

    const eventType = new EventType({
      event_type_name,
      event_type_color
    });

    await eventType.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'สร้าง Event Type สำเร็จ',
      data: eventType 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการสร้าง Event Type', 
      error: error.message 
    });
  }
};

// ดึงข้อมูล Event Type ทั้งหมด
export const getAllEventTypes = async (req, res) => {
  try {
    const eventTypes = await EventType.find().sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      count: eventTypes.length,
      data: eventTypes 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Event Types', 
      error: error.message 
    });
  }
};

// ดึงข้อมูล Event Type ตาม ID
export const getEventTypeById = async (req, res) => {
  try {
    const eventType = await EventType.findOne({ 
      event_type_id: req.params.id 
    });

    if (!eventType) {
      return res.status(404).json({ 
        success: false, 
        message: 'ไม่พบ Event Type ที่ค้นหา' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: eventType 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Event Type', 
      error: error.message 
    });
  }
};

// อัปเดต Event Type
export const updateEventType = async (req, res) => {
  try {
    const { event_type_name, event_type_color } = req.body;

    const eventType = await EventType.findOneAndUpdate(
      { event_type_id: req.params.id },
      { 
        event_type_name, 
        event_type_color 
      },
      { new: true, runValidators: true }
    );

    if (!eventType) {
      return res.status(404).json({ 
        success: false, 
        message: 'ไม่พบ Event Type ที่ต้องการอัปเดต' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'อัปเดต Event Type สำเร็จ',
      data: eventType 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการอัปเดต Event Type', 
      error: error.message 
    });
  }
};

// ลบ Event Type
export const deleteEventType = async (req, res) => {
  try {
    const eventType = await EventType.findOneAndDelete({ 
      event_type_id: req.params.id 
    });

    if (!eventType) {
      return res.status(404).json({ 
        success: false, 
        message: 'ไม่พบ Event Type ที่ต้องการลบ' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'ลบ Event Type สำเร็จ',
      data: eventType 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการลบ Event Type', 
      error: error.message 
    });
  }
};