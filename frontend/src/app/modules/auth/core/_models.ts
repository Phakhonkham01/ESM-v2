// AuthModel - ข้อมูลที่ได้จาก login/register
export interface AuthModel {
  _id: string;
  user_name: string;
  user_email: string;
  role: "CEO" | "admin" | "employee" | "supervisor";
  department_id?: string[] | null;
  leave_days: number;
  token: string;
  
  // เพิ่มฟิลด์ที่ครบตาม backend
  status?: 'Active' | 'On Leave' | 'Inactive';
  
  // Personal Information (English)
  first_name_en?: string;
  last_name_en?: string;
  nickname_en?: string;
  
  // Personal Information (Lao)
  first_name_la?: string;
  last_name_la?: string;
  nickname_la?: string;
  
  // Basic Information
  date_of_birth?: string | Date;
  start_work?: string | Date;
  gender?: 'male' | 'female' | 'other';
  
  // Position & Salary
  position_id?: string | null;
  base_salary?: number;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// DepartmentModel
export interface DepartmentModel {
  _id: string;
  department_name: string;
  createdAt?: string;
  updatedAt?: string;
}

// UserModel - ข้อมูลโปรไฟล์ผู้ใช้
export interface UserModel {
  _id: string;
  user_name: string;
  user_email: string;
  role: "CEO" | "admin" | "employee" | "supervisor";
  department_id?: string[] | null;
  leave_days: number;
  
  status?: 'Active' | 'On Leave' | 'Inactive';
  
  // Personal Information (English)
  first_name_en?: string;
  last_name_en?: string;
  nickname_en?: string;
  
  // Personal Information (Lao)
  first_name_la?: string;
  last_name_la?: string;
  nickname_la?: string;
  
  // Basic Information
  date_of_birth?: string | Date;
  start_work?: string | Date;
  gender?: 'male' | 'female' | 'other';
  
  // Position & Salary
  position_id?: string | null;
  base_salary?: number;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// EventModel
export interface EventModel {
  _id: string;
  user_id: string | UserModel;
  event_name: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
  updatedAt?: string;
}

// HolidayModel
export interface HolidayModel {
  _id: string;
  user_id: string | UserModel;
  holiday_name: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
  updatedAt?: string;
}