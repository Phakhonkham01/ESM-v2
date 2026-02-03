const API_URL = import.meta.env.VITE_APP_API_URL

export interface DepartmentData {
    _id: string;
    department_name: string;
    created_at?: string;
    updated_at?: string;
}

export interface PositionData {
    _id: string;
    department_id: string;
    position_name: string;
    created_at?: string;
    updated_at?: string;
    department_name?: string; // สำหรับ populate
}

// ==================== Departments API ====================

export const getAllDepartments = async (): Promise<{ departments: DepartmentData[] }> => {
    try {
        const response = await fetch(`${API_URL}/departments`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const departments = await response.json();
        return { departments };
    } catch (error) {
        console.error('Error fetching departments:', error);
        throw error;
    }
};

export const createDepartment = async (data: { department_name: string }): Promise<DepartmentData> => {
    try {
        const response = await fetch(`${API_URL}/departments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create department');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error creating department:', error);
        throw error;
    }
};

export const updateDepartment = async (id: string, data: { department_name: string }): Promise<DepartmentData> => {
    try {
        const response = await fetch(`${API_URL}/departments/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update department');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating department:', error);
        throw error;
    }
};

export const deleteDepartment = async (id: string): Promise<{ message: string }> => {
    try {
        const response = await fetch(`${API_URL}/departments/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete department');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error deleting department:', error);
        throw error;
    }
};

// ==================== Positions API ====================

export const getAllPositions = async (): Promise<{ positions: PositionData[] }> => {
    try {
        const response = await fetch(`${API_URL}/positions`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const positions = await response.json();
        return { positions };
    } catch (error) {
        console.error('Error fetching positions:', error);
        throw error;
    }
};

export const createPosition = async (data: { department_id: string; position_name: string }): Promise<PositionData> => {
    try {
        const response = await fetch(`${API_URL}/positions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create position');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error creating position:', error);
        throw error;
    }
};

export const updatePosition = async (id: string, data: { department_id?: string; position_name: string }): Promise<PositionData> => {
    try {
        const response = await fetch(`${API_URL}/positions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update position');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating position:', error);
        throw error;
    }
};

export const deletePosition = async (id: string): Promise<{ message: string }> => {
    try {
        const response = await fetch(`${API_URL}/positions/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete position');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error deleting position:', error);
        throw error;
    }
};

export const getPositionsByDepartment = async (departmentId: string): Promise<{ positions: PositionData[] }> => {
    try {
        const response = await fetch(`${API_URL}/positions/department/${departmentId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const positions = await response.json();
        return { positions };
    } catch (error) {
        console.error('Error fetching positions by department:', error);
        throw error;
    }
};

// ==================== Utility Functions ====================

// Get department by ID
export const getDepartmentById = async (id: string): Promise<DepartmentData> => {
    try {
        const response = await fetch(`${API_URL}/departments/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching department by ID:', error);
        throw error;
    }
};

// Get position by ID
export const getPositionById = async (id: string): Promise<PositionData> => {
    try {
        const response = await fetch(`${API_URL}/positions/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching position by ID:', error);
        throw error;
    }
};