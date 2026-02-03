import axios, { AxiosResponse } from 'axios'
import { ID } from '../../../../../../_metronic/helpers'
// import { User, UsersQueryResponse, Department, Position } from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL
// const USER_URL = `${API_URL}/users`
// const DEPARTMENT_URL = `${API_URL}/departments`

export interface Department {
    _id: string;
    department_name: string;
}

export interface Position {
    _id: string;
    position_name: string;
}

export interface UserData {
    _id: string;
    email: string;
    role: 'Supervisor' | 'Admin' | 'Employee';
    first_name_en: string;
    last_name_en: string;
    nickname_en: string;
    first_name_la: string;
    last_name_la: string;
    nickname_la: string;
    date_of_birth: string;
    start_work: string;
    vacation_days: number;
    gender: 'Male' | 'Female' | 'Other';
    position_id?: Position;
    department_id?: Department[];
    status: 'Active' | 'Inactive' | 'On Leave';
    base_salary: string | number;
    created_at?: string;
}

export interface CreateUserData {
    email: string;
    password?: string;
    role: 'Supervisor' | 'Admin' | 'Employee';
    first_name_en: string;
    last_name_en: string;
    nickname_en: string;
    first_name_la: string;
    last_name_la: string;
    nickname_la: string;
    date_of_birth: string;
    start_work: string;
    vacation_days?: number;
    gender: 'Male' | 'Female' | 'Other';
    position_id?: string;
    department_id?: string | string[]; // ✅ เปลี่ยนตรงนี้
    status: 'Active' | 'Inactive' | 'On Leave';
    base_salary?: number;
}

// ... rest of your API code remains the same

export interface CreateUserResponse {
    message: string;
    user: UserData;
}

export interface GetUsersResponse {
    users: UserData[];
    count: number;
}

// Create new user
export const createUser = async (
    userData: CreateUserData
): Promise<CreateUserResponse> => {
    try {
        const response = await axios.post(`${API_URL}/users`, userData);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to create user."
        );
    }
};

// Get all users
export const getAllUsers = async (): Promise<GetUsersResponse> => {
    try {
        const response = await axios.get(`${API_URL}/users`);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to fetch users."
        );
    }
};

// Get user by ID
export const getUserById = async (id: string): Promise<{ user: UserData }> => {
    try {
        const response = await axios.get(`${API_URL}/users/${id}`);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to fetch user."
        );
    }
};

// Update user
export const updateUser = async (
    id: string,
    userData: Partial<CreateUserData>
): Promise<CreateUserResponse> => {
    try {
        const response = await axios.put(`${API_URL}/users/${id}`, userData);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to update user."
        );
    }
};

// Delete user
export const deleteUser = async (id: string): Promise<{ message: string }> => {
    try {
        const response = await axios.delete(`${API_URL}/users/${id}`);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to delete user."
        );
    }
};

// Get users by role
export const getUsersByRole = async (
    role: "Supervisor" | "Admin" | "Employee"
): Promise<GetUsersResponse> => {
    try {
        const response = await axios.get(`${API_URL}/users/role/${role}`);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error.response?.data?.message || "Failed to fetch users by role."
        );
    }
};
