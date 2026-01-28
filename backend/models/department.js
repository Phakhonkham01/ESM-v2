import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
    department_name: {
        type: String, 
        required: true,
        unique: true
    }
}, 
{ timestamps: true });

// Change from module.exports to export default
const Department = mongoose.model("Department", DepartmentSchema);
export default Department;