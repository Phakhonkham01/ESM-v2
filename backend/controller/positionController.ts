import { Request, Response } from 'express';
import Position from '../models/Position';
import mongoose from 'mongoose';

// ================= Interfaces =================

interface GetPositionsQuery {
  department_id?: string;
}

interface CreatePositionBody {
  position_name: string;
  department_id: string;
}

interface UpdatePositionBody {
  position_name?: string;
  department_id?: string;
}

// ================= Controllers =================

// @desc    Get all positions (with optional department filter)
// @route   GET /api/positions
// @access  Public/Private
export const getPositions = async (
  req: Request<{}, {}, {}, GetPositionsQuery>,
  res: Response
): Promise<void> => {
  try {
    const { department_id } = req.query;
    
    // Build query
    const query: any = {};
    if (department_id) {
      query.department_id = department_id;
    }
    
    const positions = await Position.find(query)
      .populate('department_id', 'department_name')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: positions.length,
      data: positions
    });
  } catch (error: any) {
    console.error('Error fetching positions:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single position
// @route   GET /api/positions/:id
// @access  Public/Private
export const getPosition = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const position = await Position.findById(req.params.id)
      .populate('department_id', 'department_name');

    if (!position) {
      res.status(404).json({
        success: false,
        message: 'Position not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: position
    });
  } catch (error: any) {
    console.error('Error fetching position:', error);
    if (error.kind === 'ObjectId') {
      res.status(404).json({
        success: false,
        message: 'Position not found'
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

// @desc    Create new position
// @route   POST /api/positions
// @access  Private (Admin only)
export const createPosition = async (
  req: Request<{}, {}, CreatePositionBody>,
  res: Response
): Promise<void> => {
  try {
    const { position_name, department_id } = req.body;

    // Validation
    if (!position_name || !department_id) {
      res.status(400).json({
        success: false,
        message: 'Please provide position name and department'
      });
      return;
    }

    // Check if position already exists in this department
    const existingPosition = await Position.findOne({
      position_name: { $regex: new RegExp(`^${position_name}$`, 'i') },
      department_id
    });

    if (existingPosition) {
      res.status(400).json({
        success: false,
        message: 'Position already exists in this department'
      });
      return;
    }

    const position = await Position.create({
      position_name,
      department_id
    });

    // Populate department info
    await position.populate('department_id', 'department_name');

    res.status(201).json({
      success: true,
      message: 'Position created successfully',
      data: position
    });
  } catch (error: any) {
    console.error('Error creating position:', error);
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Position already exists in this department'
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

// @desc    Update position
// @route   PUT /api/positions/:id
// @access  Private (Admin only)
export const updatePosition = async (
  req: Request<{ id: string }, {}, UpdatePositionBody>,
  res: Response
): Promise<void> => {
  try {
    const { position_name, department_id } = req.body;

    if (!position_name) {
      res.status(400).json({
        success: false,
        message: 'Please provide position name'
      });
      return;
    }

    let position = await Position.findById(req.params.id);

    if (!position) {
      res.status(404).json({
        success: false,
        message: 'Position not found'
      });
      return;
    }

    // Check for duplicate within same department
    const existingPosition = await Position.findOne({
      position_name: { $regex: new RegExp(`^${position_name}$`, 'i') },
      department_id: department_id || position.department_id,
      _id: { $ne: req.params.id }
    });

    if (existingPosition) {
      res.status(400).json({
        success: false,
        message: 'Position name already exists in this department'
      });
      return;
    }

    // Update
    const updateData: any = { position_name };
    if (department_id) {
      updateData.department_id = department_id;
    }

    position = await Position.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('department_id', 'department_name') as any;

    res.status(200).json({
      success: true,
      message: 'Position updated successfully',
      data: position
    });
  } catch (error: any) {
    console.error('Error updating position:', error);
    if (error.kind === 'ObjectId' || error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Invalid data or position name already exists'
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

// @desc    Delete position
// @route   DELETE /api/positions/:id
// @access  Private (Admin only)
export const deletePosition = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const position = await Position.findById(req.params.id);

    if (!position) {
      res.status(404).json({
        success: false,
        message: 'Position not found'
      });
      return;
    }

    // Optional: Check if any users have this position
    // const User = mongoose.model('User');
    // const usersWithPosition = await User.countDocuments({ position_id: req.params.id });
    // if (usersWithPosition > 0) {
    //   res.status(400).json({
    //     success: false,
    //     message: `Cannot delete position. ${usersWithPosition} user(s) are assigned to this position.`
    //   });
    //   return;
    // }

    await position.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Position deleted successfully',
      data: {}
    });
  } catch (error: any) {
    console.error('Error deleting position:', error);
    if (error.kind === 'ObjectId') {
      res.status(404).json({
        success: false,
        message: 'Position not found'
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

// @desc    Get positions by department
// @route   GET /api/positions/department/:departmentId
// @access  Public/Private
export const getPositionsByDepartment = async (
  req: Request<{ departmentId: string }>,
  res: Response
): Promise<void> => {
  try {
    const positions = await Position.find({ 
      department_id: req.params.departmentId 
    }).sort({ position_name: 1 });
    
    res.status(200).json({
      success: true,
      count: positions.length,
      data: positions
    });
  } catch (error: any) {
    console.error('Error fetching positions by department:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};