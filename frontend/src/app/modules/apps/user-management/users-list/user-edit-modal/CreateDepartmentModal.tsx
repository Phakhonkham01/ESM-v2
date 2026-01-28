import { useState } from 'react'
import { Modal } from 'react-bootstrap'
import { useMutation, useQueryClient } from 'react-query'
import { createDepartment } from '../core/_requests'
import { toast } from 'react-toastify' // ✅ เพิ่มบรรทัดนี้
import Swal from 'sweetalert2' // ✅ เพิ่มบรรทัดนี้

type Department = {
    _id?: string
    id?: string
    department_name: string
    createdAt?: Date
    updatedAt?: Date
}

type Props = {
    show: boolean
    onClose: () => void
    onCreated: (department: Department) => void
}

const CreateDepartmentModal: React.FC<Props> = ({
    show,
    onClose,
    onCreated,
}) => {
    const [departmentName, setDepartmentName] = useState('')
    const queryClient = useQueryClient()

    const createMutation = useMutation({
        mutationFn: createDepartment,

        onSuccess: (newDepartment: Department) => {
            console.log('✅ Department created successfully:', newDepartment)
            
            queryClient.invalidateQueries({ queryKey: ['departments'] })
            
            // ✅ แสดง success notification
            Swal.fire({
                icon: 'success',
                title: '<span style="color: #10b981; font-weight: bold;">Success!</span>',
                text: `Department "${departmentName}" has been created successfully.`,
                timer: 2000,
                showConfirmButton: false,
            })
            
            // ✅ ส่ง department กลับไป
            onCreated(newDepartment)
            
            // ✅ Reset input
            setDepartmentName('')
            
            // ✅ ปิด Modal (สำคัญมาก!)
            onClose()
        },
        onError: (error: any) => {
            console.error('❌ Create department failed:', error)
            
            // ✅ แสดง error notification
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create department'
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonText: 'OK',
            })
        },
    })

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        
        if (!departmentName.trim()) {
            toast.error('Please enter department name!')
            return
        }
        
        console.log('📤 Submitting department:', departmentName)
        createMutation.mutate({ department_name: departmentName.trim() })
    }

    // ✅ Handle Enter key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !createMutation.isLoading && departmentName.trim()) {
            handleSubmit()
        }
    }

    return (
        <Modal 
            show={show} 
            onHide={onClose} 
            centered
            backdrop={createMutation.isLoading ? 'static' : true} // ✅ ป้องกันปิด modal ขณะ loading
            keyboard={!createMutation.isLoading} // ✅ ป้องกัน ESC ขณะ loading
        >
            <Modal.Header closeButton={!createMutation.isLoading}>
                <Modal.Title>
                    <i className='bi bi-building me-2'></i>
                    Create New Department
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="fv-row">
                    <label className="required fw-bold fs-6 mb-2">
                        Department Name
                    </label>

                    <input
                        type="text"
                        className="form-control form-control-solid"
                        placeholder="e.g., Engineering, Marketing, Sales"
                        value={departmentName}
                        onChange={(e) => setDepartmentName(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={createMutation.isLoading}
                        autoFocus
                    />
                </div>
            </Modal.Body>

            <Modal.Footer>
                <button
                    type="button"
                    className="btn btn-light"
                    onClick={onClose}
                    disabled={createMutation.isLoading}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={!departmentName.trim() || createMutation.isLoading}
                >
                    {createMutation.isLoading ? (
                        <>
                            <span className='spinner-border spinner-border-sm me-2'></span>
                            Creating...
                        </>
                    ) : (
                        <>
                            <i className='bi bi-check-circle me-2'></i>
                            Create Department
                        </>
                    )}
                </button>
            </Modal.Footer>
        </Modal>
    )
}

export default CreateDepartmentModal