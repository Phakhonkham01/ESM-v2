import axios from 'axios';
import { Holiday } from './_models';

const API_URL = import.meta.env.VITE_API_API_URL || 'http://localhost:8000/api';

// ✅ Helper function to get auth token
const getAuthToken = () => {
  const authData = localStorage.getItem('authData');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      return parsed.token || parsed.accessToken;
    } catch (e) {
      console.error('Error parsing authData:', e);
    }
  }
  return null;
};

// ✅ Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface HolidaysQueryResponse {
  success: boolean
  data: Holiday[]
  total: number
  totalPages: number
  currentPage: number
}

/**
 * Fetch holidays with query string params
 * @param query stringified query e.g. "holiday_type=public&user_id=123"
 */
export const getHolidays = async (query: string): Promise<HolidaysQueryResponse> => {
  try {
    const { data } = await axios.get(`${API_URL}/holidays?${query}`, {
      headers: getAuthHeaders()
    });
    return data;
  } catch (error) {
    console.error('❌ getHolidays error:', error);
    throw error;
  }
};

/**
 * ดึงข้อมูล holiday ตาม user_id
 * @param query รหัสของวันหยุด
 * @returns Holiday object
 */
export const getHolidayById = async (query: string): Promise<Holiday> => {
  const res = await axios.get(`${API_URL}/holidays/user/${query}`, {
    headers: getAuthHeaders()
  })
  return res.data.data
}

/**
 * ดึงข้อมูล holiday ตาม ID
 * @param query รหัสของวันหยุด
 * @returns Holiday object
 */
export const getHolidayByIds = async (query: string): Promise<Holiday> => {
  const res = await axios.get(`${API_URL}/holidays/${query}`, {
    headers: getAuthHeaders()
  })
  return res.data.data
}

/**
 * Create holiday
 */
export const createHoliday = async (
  payload: Partial<Holiday>
): Promise<Holiday> => {
  const { data } = await axios.post(`${API_URL}/holidays`, payload, {
    headers: getAuthHeaders()
  });
  return data;
};

/**
 * Update holiday
 */
export const updateHoliday = async (
  holidayId: string,
  payload: Partial<Holiday>
): Promise<Holiday> => {
  const { data } = await axios.put(`${API_URL}/holidays/${holidayId}`, payload, {
    headers: getAuthHeaders()
  });
  return data;
};

/**
 * Delete holiday
 * ส่ง user_id ไปให้ backend ตรวจ permission
 */
export const deleteHoliday = async (
  holidayId: string,
  userId: string
): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/holidays/${holidayId}`, {
      params: { user_id: userId },
      headers: getAuthHeaders()
    })
    console.log('🗑 deleteHoliday success:', holidayId)
  } catch (error) {
    console.error('❌ deleteHoliday error:', error)
    throw error
  }
}

/**
 * Approve holiday
 * ✅ เพิ่ม auth headers และ log request details
 */
export const approveHoliday = async (
  holidayId: string,
  payload?: any
): Promise<Holiday> => {
  try {
    console.log('🔄 Approve request:', {
      url: `${API_URL}/holidays/${holidayId}/approve`,
      payload,
      headers: getAuthHeaders()
    });

    const { data } = await axios.put(
      `${API_URL}/holidays/${holidayId}/approve`,
      payload,
      {
        headers: getAuthHeaders()
      }
    );
    
    console.log('✅ Approve response:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Approve error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

/**
 * Reject holiday
 * ✅ เพิ่ม auth headers และ log request details
 */
export const rejectHoliday = async (
  holidayId: string,
  payload?: any
): Promise<Holiday> => {
  try {
    console.log('🔄 Reject request:', {
      url: `${API_URL}/holidays/${holidayId}/reject`,
      payload,
      headers: getAuthHeaders()
    });

    const { data } = await axios.put(
      `${API_URL}/holidays/${holidayId}/reject`,
      payload,
      {
        headers: getAuthHeaders()
      }
    );
    
    console.log('✅ Reject response:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Reject error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}