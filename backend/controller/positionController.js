import Position from '../models/Position.js';
import mongoose from 'mongoose';

// @desc    Get all positions (with optional department filter)
// @route   GET /api/positions
// @access  Public/Private
export const getPositions = async (req, res) => {
  try {
    const { department_id } = req.query;
    
    // Build query
    const query = {};
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
  } catch (error) {
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
export const getPosition = async (req, res) => {
  try {
    const position = await Position.findById(req.params.id)
      .populate('department_id', 'department_name');

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    res.status(200).json({
      success: true,
      data: position
    });
  } catch (error) {
    console.error('Error fetching position:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
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
export const createPosition = async (req, res) => {
  try {
    const { position_name, department_id } = req.body;

    // Validation
    if (!position_name || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide position name and department'
      });
    }

    // Check if position already exists in this department
    const existingPosition = await Position.findOne({
      position_name: { $regex: new RegExp(`^${position_name}$`, 'i') },
      department_id
    });

    if (existingPosition) {
      return res.status(400).json({
        success: false,
        message: 'Position already exists in this department'
      });
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
  } catch (error) {
    console.error('Error creating position:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Position already exists in this department'
      });
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
export const updatePosition = async (req, res) => {
  try {
    const { position_name, department_id } = req.body;

    if (!position_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide position name'
      });
    }

    let position = await Position.findById(req.params.id);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    // Check for duplicate within same department
    const existingPosition = await Position.findOne({
      position_name: { $regex: new RegExp(`^${position_name}$`, 'i') },
      department_id: department_id || position.department_id,
      _id: { $ne: req.params.id }
    });

    if (existingPosition) {
      return res.status(400).json({
        success: false,
        message: 'Position name already exists in this department'
      });
    }

    // Update
    const updateData = { position_name };
    if (department_id) {
      updateData.department_id = department_id;
    }

    position = await Position.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('department_id', 'department_name');

    res.status(200).json({
      success: true,
      message: 'Position updated successfully',
      data: position
    });
  } catch (error) {
    console.error('Error updating position:', error);
    if (error.kind === 'ObjectId' || error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data or position name already exists'
      });
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
export const deletePosition = async (req, res) => {
  try {
    const position = await Position.findById(req.params.id);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    // Optional: Check if any users have this position
    // const User = mongoose.model('User');
    // const usersWithPosition = await User.countDocuments({ position_id: req.params.id });
    // if (usersWithPosition > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot delete position. ${usersWithPosition} user(s) are assigned to this position.`
    //   });
    // }

    await position.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Position deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting position:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
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
export const getPositionsByDepartment = async (req, res) => {
  try {
    const positions = await Position.find({ 
      department_id: req.params.departmentId 
    }).sort({ position_name: 1 });
    
    res.status(200).json({
      success: true,
      count: positions.length,
      data: positions
    });
  } catch (error) {
    console.error('Error fetching positions by department:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};