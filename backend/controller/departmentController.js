import Department from '../models/Department.js'; // Added .js extension

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public/Private
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
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
export const getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
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
export const createDepartment = async (req, res) => {
  try {
    const { department_name } = req.body;

    if (!department_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide department name'
      });
    }

    const existingDepartment = await Department.findOne({ 
      department_name: { $regex: new RegExp(`^${department_name}$`, 'i') } 
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department already exists'
      });
    }

    const department = await Department.create({ department_name });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    console.error('Error creating department:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Department already exists'
      });
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
export const updateDepartment = async (req, res) => {
  try {
    const { department_name } = req.body;

    if (!department_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide department name'
      });
    }

    let department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const existingDepartment = await Department.findOne({
      department_name: { $regex: new RegExp(`^${department_name}$`, 'i') },
      _id: { $ne: req.params.id }
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department name already exists'
      });
    }

    department = await Department.findByIdAndUpdate(
      req.params.id,
      { department_name },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    console.error('Error updating department:', error);
    if (error.kind === 'ObjectId' || error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data or department name already exists'
      });
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
export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    await department.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};