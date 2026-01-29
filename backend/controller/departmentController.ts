import { Request, Response } from 'express';
import Department from '../models/department';

// ================= Interfaces =================

interface CreateDepartmentBody {
  department_name: string;
}

interface UpdateDepartmentBody {
  department_name: string;
}

// ================= Controllers =================

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public/Private
export const getDepartments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Public/Private
export const getDepartment = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      res.status(404).json({
        success: false,
        message: 'Department not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error: any) {
    console.error('Error fetching department:', error);
    if (error.kind === 'ObjectId') {
      res.status(404).json({
        success: false,
        message: 'Department not found'
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private (Admin only)
export const createDepartment = async (
  req: Request<{}, {}, CreateDepartmentBody>,
  res: Response
): Promise<void> => {
  try {
    const { department_name } = req.body;

    if (!department_name) {
      res.status(400).json({
        success: false,
        message: 'Please provide department name'
      });
      return;
    }

    const existingDepartment = await Department.findOne({ 
      department_name: { $regex: new RegExp(`^${department_name}$`, 'i') } 
    });

    if (existingDepartment) {
      res.status(400).json({
        success: false,
        message: 'Department already exists'
      });
      return;
    }

    const department = await Department.create({ department_name });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error: any) {
    console.error('Error creating department:', error);
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Department already exists'
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin only)
export const updateDepartment = async (
  req: Request<{ id: string }, {}, UpdateDepartmentBody>,
  res: Response
): Promise<void> => {
  try {
    const { department_name } = req.body;

    if (!department_name) {
      res.status(400).json({
        success: false,
        message: 'Please provide department name'
      });
      return;
    }

    let department = await Department.findById(req.params.id);

    if (!department) {
      res.status(404).json({
        success: false,
        message: 'Department not found'
      });
      return;
    }

    const existingDepartment = await Department.findOne({
      department_name: { $regex: new RegExp(`^${department_name}$`, 'i') },
      _id: { $ne: req.params.id }
    });

    if (existingDepartment) {
      res.status(400).json({
        success: false,
        message: 'Department name already exists'
      });
      return;
    }

    department = await Department.findByIdAndUpdate(
      req.params.id,
      { department_name },
      { new: true, runValidators: true }
    ) as any;

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error: any) {
    console.error('Error updating department:', error);
    if (error.kind === 'ObjectId' || error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Invalid data or department name already exists'
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin only)
export const deleteDepartment = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      res.status(404).json({
        success: false,
        message: 'Department not found'
      });
      return;
    }

    await department.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
      data: {}
    });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    if (error.kind === 'ObjectId') {
      res.status(404).json({
        success: false,
        message: 'Department not found'
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};