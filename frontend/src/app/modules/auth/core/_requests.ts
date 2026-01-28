import axios from "axios";
import { AuthModel, UserModel } from "./_models";

// ตรวจสอบและตั้งค่า API_URL
const API_URL = import.meta.env.VITE_APP_API_URL || "http://localhost:8000/api";

// เช็คว่า API_URL ถูกตั้งค่าหรือไม่
if (!import.meta.env.VITE_APP_API_URL) {
  console.warn("⚠️ VITE_APP_API_URL is not defined, using default:", API_URL);
}

// API Endpoints - ตรงกับ backend routes
const ENDPOINTS = {
  LOGIN: `${API_URL}/auth/login`,                    // POST
  REGISTER: `${API_URL}/auth/register`,              // POST
  GET_USER_PROFILE: `${API_URL}/auth/profile`,       // GET
  UPDATE_USER_PROFILE: `${API_URL}/auth/profile`,    // PUT
  REQUEST_PASSWORD: `${API_URL}/auth/forgot_password`, // POST
};

// Login - POST /auth/login
export function login(user_email: string, password: string) {
  return axios.post<AuthModel>(ENDPOINTS.LOGIN, {
    user_email,
    password,
  });
}

// Register - POST /auth/register
export function register(
  user_name: string,
  user_email: string,
  password: string,
  department_id?: string,
  adminInviteToken?: string,
  ceoInviteToken?: string
) {
  return axios.post<AuthModel>(ENDPOINTS.REGISTER, {
    user_name,
    user_email,
    password,
    department_id,
    adminInviteToken,
    ceoInviteToken,
  });
}

// Request password reset - POST /auth/forgot_password
export function requestPassword(user_email: string) {
  return axios.post<{ result: boolean }>(ENDPOINTS.REQUEST_PASSWORD, {
    user_email,
  });
}

// Get user by token - GET /auth/profile
// หรือถ้า backend ไม่มี route GET /auth/profile จะใช้ข้อมูลจาก AuthModel แทน
export async function getUserByToken(token: string): Promise<{ data: UserModel }> {
  try {
    // พยายามเรียก API ก่อน
    const response = await axios.get<UserModel>(ENDPOINTS.GET_USER_PROFILE, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error: any) {
    // ถ้า backend ไม่มี route นี้ (401 หรือ 404)
    if (error.response?.status === 401 || error.response?.status === 404) {
      console.warn('⚠️ GET /auth/profile not available, using auth data from localStorage');
      
      // ดึงข้อมูลจาก localStorage แทน
      const authData = localStorage.getItem('auth');
      if (authData) {
        const auth = JSON.parse(authData) as AuthModel;
        
        // แปลง AuthModel เป็น UserModel
        const user: UserModel = {
          _id: auth._id,
          user_name: auth.user_name,
          user_email: auth.user_email,
          role: auth.role,
          department_id: auth.department_id,
          leave_days: auth.leave_days,
        };
        
        return { data: user } as any;
      }
    }
    
    // ถ้าเป็น error อื่นๆ ให้ throw ต่อไป
    throw error;
  }
}

// Update user profile - PUT /auth/profile
export function updateUserProfile(
  token: string,
  data: {
    user_name?: string;
    user_email?: string;
    department_id?: string;
    password?: string;
  }
) {
  return axios.put<UserModel>(ENDPOINTS.UPDATE_USER_PROFILE, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Export endpoints for use in other files if needed
export { ENDPOINTS };