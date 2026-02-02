import React, { useState, useEffect, useMemo } from 'react'
import { KTIcon } from '../../../../../../_metronic/helpers'
import { createDayOffRequest } from '../../_core/_requests'
import { useAuth } from '../../../../auth'
import { getUsers } from '../../../../apps/user-management/users-list/core/_requests'
import type { User } from '../../../../apps/user-management/users-list/core/_models'

interface LeaveDayFormProps {
    onClose: () => void
    onSuccess?: () => void
}

const LeaveDayForm: React.FC<LeaveDayFormProps> = ({ onClose, onSuccess }) => {
    const { currentUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [supervisors, setSupervisors] = useState<User[]>([])

    const [formData, setFormData] = useState({
        day_off_type: 'FULL_DAY' as 'FULL_DAY' | 'HALF_DAY',
        start_date: '',
        end_date: '',
        half_day_period: 'MORNING' as 'MORNING' | 'AFTERNOON',
        title: '',
    })


    // Load supervisors
    useEffect(() => {
        const loadSupervisors = async () => {
            try {
                console.log('🔄 Loading users...')
                const response = await getUsers('')
                console.log('📦 Full API response:', response)
                console.log('📊 Response.data type:', typeof response.data, Array.isArray(response.data))
                console.log('📊 Response.data length:', response.data?.length)
                console.log('📊 Response.data content:', response.data)

                if (!response.data || response.data.length === 0) {
                    console.log('❌ No users found in response')
                    setSupervisors([])
                    return
                }

                // ดูทุก user ก่อน filter
                console.log('👥 All users before filter:', response.data.map((u: User) => ({
                    name: u.first_name_en,
                    role: u.role,
                    status: u.status
                })))

                const supervisorUsers = (response.data || []).filter(
                    (user: User) => {
                        const isSupervisor = user.role === 'supervisor'
                        const isActive = user.status === 'Active'
                        console.log(`Checking user ${user.first_name_en}: role=${user.role} (is supervisor? ${isSupervisor}), status=${user.status} (is Active? ${isActive})`)
                        return isSupervisor && isActive
                    }
                )

                console.log('✅ Filtered supervisors count:', supervisorUsers.length)
                console.log('✅ Filtered supervisors:', supervisorUsers)
                setSupervisors(supervisorUsers)
            } catch (error) {
                console.error('❌ Error loading supervisors:', error)
                setSupervisors([])
            }
        }
        loadSupervisors()
    }, [])

    // Find user's supervisor automatically
    // Find user's supervisor automatically
    // Find ALL supervisors with matching departments (not just one)
    const matchingSupervisors = useMemo(() => {
        console.log('=== Finding Supervisors ===')
        console.log('Current user department_id:', currentUser?.department_id)

        if (!currentUser?.department_id || supervisors.length === 0) {
            console.log('❌ No department_id or no supervisors')
            return []
        }

        // Helper function to extract ID from object or string
        const extractId = (id: any): string => {
            if (typeof id === 'object' && id !== null) {
                return String(id._id || id.id || id)
            }
            return String(id)
        }

        // Get user's department IDs as strings
        const userDeptIds = Array.isArray(currentUser.department_id)
            ? currentUser.department_id.map(extractId)
            : [extractId(currentUser.department_id)]

        console.log('User department IDs:', userDeptIds)

        // Find ALL supervisors with matching department
        const matched = supervisors.filter(s => {
            const supervisorDeptIds = Array.isArray(s.department_id)
                ? s.department_id.map(extractId)
                : [extractId(s.department_id)]

            // Check if any user department matches any supervisor department
            const hasMatch = userDeptIds.some(userDept =>
                supervisorDeptIds.includes(userDept)
            )

            return hasMatch
        })

        console.log('🎯 Matched supervisors:', matched)
        return matched
    }, [supervisors, currentUser?.department_id])
    // Calculate total days
    const calculateTotalDays = () => {
        if (formData.day_off_type === 'FULL_DAY') {
            if (!formData.start_date || !formData.end_date) return 0
            const start = new Date(formData.start_date)
            const end = new Date(formData.end_date)
            const diffTime = Math.abs(end.getTime() - start.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays + 1
        } else {
            return 0.5
        }
    }

    const totalDays = calculateTotalDays()

    // Get datetime strings
    const getDateTimeForFullDay = (date: string, isStart: boolean) => {
        const d = new Date(date)
        if (isStart) {
            d.setHours(0, 0, 0, 0)
        } else {
            d.setHours(23, 59, 59, 999)
        }
        return d.toISOString()
    }

    const getDateTimeForHalfDay = (date: string, period: 'MORNING' | 'AFTERNOON') => {
        if (period === 'MORNING') {
            const startDate = new Date(date)
            startDate.setHours(8, 30, 0, 0)

            const endDate = new Date(date)
            endDate.setHours(12, 0, 0, 0)

            return {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            }
        } else {
            const startDate = new Date(date)
            startDate.setHours(13, 30, 0, 0)

            const endDate = new Date(date)
            endDate.setHours(17, 0, 0, 0)

            return {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!currentUser?._id) {
            alert('User not found')
            return
        }

        if (matchingSupervisors.length === 0) {
            alert('No supervisor found in your department')
            return
        }

        if (!formData.start_date || !formData.title) {
            alert('Please fill in all required fields')
            return
        }

        if (formData.day_off_type === 'FULL_DAY' && !formData.end_date) {
            alert('Please select end date')
            return
        }

        try {
            setLoading(true)

            let startDateTime: string
            let endDateTime: string

            if (formData.day_off_type === 'FULL_DAY') {
                startDateTime = getDateTimeForFullDay(formData.start_date, true)
                endDateTime = getDateTimeForFullDay(formData.end_date, false)
            } else {
                const halfDayTimes = getDateTimeForHalfDay(formData.start_date, formData.half_day_period)
                startDateTime = halfDayTimes.start
                endDateTime = halfDayTimes.end
            }

            // ส่ง array ของ supervisor IDs
            const supervisorIds = matchingSupervisors.map(s => s.id || s.id)

            await createDayOffRequest({
                user_id: currentUser._id,
                supervisor_id: supervisorIds, // TypeScript จะไม่บ่นอีกแล้ว
                employee_id: currentUser._id,
                day_off_type: formData.day_off_type,
                start_date_time: startDateTime,
                end_date_time: endDateTime,
                title: formData.title,
            })

            // alert(`Leave request submitted to ${matchingSupervisors.length} supervisor(s) successfully!`)
            onSuccess?.()
            onClose()
        } catch (error: any) {
            alert(error.message || 'Failed to submit leave request')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='card'>
            {/* Header */}
            <div className='card-header'>
                <h3 className='card-title'>
                    <KTIcon iconName='calendar' className='fs-2 text-primary me-2' />
                    Leave Day Request
                </h3>
                <div className='card-toolbar'>
                    <button
                        type='button'
                        className='btn btn-sm btn-icon btn-light'
                        onClick={onClose}
                    >
                        <KTIcon iconName='cross' className='fs-2' />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className='card-body' style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>

                    {/* Auto-Selected Supervisor Info */}
                    {/* Auto-Selected Supervisors Info */}
                    <div className={`alert ${matchingSupervisors.length > 0 ? 'alert-success' : 'alert-warning'} d-flex align-items-start mb-7`}>
                        <KTIcon iconName='user' className='fs-2 me-3 mt-1 text-primary' />
                        <div className='flex-grow-1'>
                            <h5 className='mb-3'>Supervisors in Your Department</h5>
                            {matchingSupervisors.length > 0 ? (
                                <div className='d-flex flex-column gap-2'>
                                    {matchingSupervisors.map((supervisor, index) => (
                                        <div key={supervisor.id || supervisor.id || index} className='d-flex align-items-center p-3 bg-light rounded'>
                                            <div className='flex-grow-1'>
                                                <div className='fw-bold'>
                                                    {supervisor.first_name_en} {supervisor.last_name_en}
                                                </div>

                                            </div>
                                            <div className='badge badge-light-success'>Supervisor</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className='d-flex align-items-center'>
                                    <KTIcon iconName='information' className='fs-5 me-2' />
                                    <span>No supervisor found in the system</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Leave Type Selection */}
                    <div className='mb-7'>
                        <label className='form-label fw-bold d-flex align-items-center required'>
                            <KTIcon iconName='time' className='fs-3 text-primary me-2' />
                            Leave Type
                        </label>
                        <div className='row g-4'>
                            <div className='col-md-6'>
                                <div
                                    className={`card cursor-pointer border-2 ${formData.day_off_type === 'FULL_DAY'
                                        ? 'border-primary bg-light-primary'
                                        : 'border-gray-300'
                                        }`}
                                    onClick={() => setFormData({ ...formData, day_off_type: 'FULL_DAY', end_date: '' })}
                                    style={{ transition: 'all 0.3s ease' }}
                                >
                                    <div className='card-body text-center py-5'>
                                        <KTIcon
                                            iconName='calendar'
                                            className={`fs-2x mb-3 ${formData.day_off_type === 'FULL_DAY' ? 'text-primary' : 'text-gray-600'}`}
                                        />
                                        <h4 className='fw-bold mb-2'>Full Day</h4>
                                        <p className='text-muted mb-0 fs-7'>Take entire day off</p>
                                    </div>
                                </div>
                            </div>
                            <div className='col-md-6'>
                                <div
                                    className={`card cursor-pointer border-2 ${formData.day_off_type === 'HALF_DAY'
                                        ? 'border-primary bg-light-primary'
                                        : 'border-gray-300'
                                        }`}
                                    onClick={() => setFormData({ ...formData, day_off_type: 'HALF_DAY', end_date: '' })}
                                    style={{ transition: 'all 0.3s ease' }}
                                >
                                    <div className='card-body text-center py-5'>
                                        <KTIcon
                                            iconName='time'
                                            className={`fs-2x mb-3 ${formData.day_off_type === 'HALF_DAY' ? 'text-primary' : 'text-gray-600'}`}
                                        />
                                        <h4 className='fw-bold mb-2'>Half Day</h4>
                                        <p className='text-muted mb-0 fs-7'>Take specific period</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Date Selection */}
                    {formData.day_off_type === 'FULL_DAY' ? (
                        <div className='row mb-7'>
                            {/* Start Date */}
                            <div className='col-md-6 mb-7 mb-md-0'>
                                <label className='form-label fw-bold required d-flex align-items-center'>
                                    <KTIcon iconName='calendar' className='fs-3 text-primary me-2' />
                                    Start Date
                                </label>
                                <input
                                    type='date'
                                    className='form-control form-control-lg'
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                                <div className='form-text'>
                                    <KTIcon iconName='information-5' className='fs-7 me-1' />
                                    Select start date for leave
                                </div>
                            </div>

                            {/* End Date */}
                            <div className='col-md-6'>
                                <label className='form-label fw-bold required d-flex align-items-center'>
                                    <KTIcon iconName='calendar' className='fs-3 text-primary me-2' />
                                    End Date
                                </label>
                                <input
                                    type='date'
                                    className='form-control form-control-lg'
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    min={formData.start_date}
                                    required
                                />
                                <div className='form-text'>
                                    <KTIcon iconName='information-5' className='fs-7 me-1' />
                                    End date must not be before start date
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Date for Half Day */}
                            <div className='mb-7'>
                                <label className='form-label fw-bold required d-flex align-items-center'>
                                    <KTIcon iconName='calendar' className='fs-3 text-primary me-2' />
                                    Leave Date
                                </label>
                                <input
                                    type='date'
                                    className='form-control form-control-lg'
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Half Day Period Selection */}
                            <div className='mb-7'>
                                <label className='form-label fw-bold required d-flex align-items-center'>
                                    <KTIcon iconName='time' className='fs-3 text-primary me-2' />
                                    Time Period
                                </label>
                                <div className='row g-4'>
                                    <div className='col-md-6'>
                                        <div
                                            className={`card cursor-pointer border-2 ${formData.half_day_period === 'MORNING'
                                                ? 'border-warning bg-light-warning'
                                                : 'border-gray-300'
                                                }`}
                                            onClick={() => setFormData({ ...formData, half_day_period: 'MORNING' })}
                                            style={{ transition: 'all 0.3s ease' }}
                                        >
                                            <div className='card-body d-flex align-items-center py-4'>
                                                <KTIcon
                                                    iconName='sun'
                                                    className={`fs-2x me-4 ${formData.half_day_period === 'MORNING' ? 'text-warning' : 'text-gray-600'}`}
                                                />
                                                <div>
                                                    <h5 className='fw-bold mb-1'>Morning</h5>
                                                    <p className='text-muted mb-0 fs-7'>8:30 AM - 12:00 PM</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='col-md-6'>
                                        <div
                                            className={`card cursor-pointer border-2 ${formData.half_day_period === 'AFTERNOON'
                                                ? 'border-info bg-light-info'
                                                : 'border-gray-300'
                                                }`}
                                            onClick={() => setFormData({ ...formData, half_day_period: 'AFTERNOON' })}
                                            style={{ transition: 'all 0.3s ease' }}
                                        >
                                            <div className='card-body d-flex align-items-center py-4'>
                                                <KTIcon
                                                    iconName='moon'
                                                    className={`fs-2x me-4 ${formData.half_day_period === 'AFTERNOON' ? 'text-info' : 'text-gray-600'}`}
                                                />
                                                <div>
                                                    <h5 className='fw-bold mb-1'>Afternoon</h5>
                                                    <p className='text-muted mb-0 fs-7'>1:30 PM - 5:00 PM</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Reason */}
                    <div className='mb-7'>
                        <label className='form-label fw-bold required d-flex align-items-center'>
                            <KTIcon iconName='note-2' className='fs-3 text-primary me-2' />
                            Reason & Details
                        </label>
                        <textarea
                            className='form-control form-control-lg'
                            rows={4}
                            placeholder='Explain your reason for leave clearly...'
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    {/* Total Days Display */}
                    <div className='alert alert-primary d-flex align-items-center p-5 mb-0'>
                        <div className='d-flex flex-column flex-grow-1'>
                            <h4 className='mb-1 fw-bold'>Total Leave Days</h4>
                            <div className='text-gray-700'>
                                {formData.day_off_type === 'FULL_DAY' && formData.start_date && formData.end_date
                                    ? `${new Date(formData.start_date).toLocaleDateString()} to ${new Date(formData.end_date).toLocaleDateString()}`
                                    : formData.day_off_type === 'HALF_DAY' && formData.start_date
                                        ? `${new Date(formData.start_date).toLocaleDateString()} (${formData.half_day_period === 'MORNING' ? 'Morning' : 'Afternoon'})`
                                        : 'Please select date'
                                }
                            </div>
                        </div>
                        <div className='text-end'>
                            <h1 className='fw-bold text-primary mb-0'>
                                {totalDays > 0 ? totalDays.toFixed(1) : '0.0'}
                            </h1>
                            <div className='text-gray-700 fs-7'>
                                {formData.day_off_type === 'FULL_DAY' ? 'Days' : 'Days (Half)'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className='card-footer d-flex justify-content-end py-6'>
                    <button
                        type='button'
                        className='btn btn-light me-3'
                        onClick={onClose}
                        disabled={loading}
                    >
                        <KTIcon iconName='cross' className='fs-3 me-2' />
                        Cancel
                    </button>
                    <button
                        type='submit'
                        className='btn btn-success'
                        disabled={loading || matchingSupervisors.length === 0}
                    >
                        {loading ? (
                            <>
                                <span className='spinner-border spinner-border-sm me-2'></span>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <KTIcon iconName='check' className='fs-3 me-2' />
                                Submit Request
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default LeaveDayForm