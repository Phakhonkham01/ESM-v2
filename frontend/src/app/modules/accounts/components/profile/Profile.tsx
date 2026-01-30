import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../auth'
import { getUserById } from '../../../apps/user-management/users-list/core/_requests'
import type { User } from '../../../apps/user-management/users-list/core/_models'

const ProfileWithContext = () => {
    const { currentUser } = useAuth()
    const [userProfile, setUserProfile] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // ✅ ดึงข้อมูล user จาก database
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!currentUser?._id) {
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                const userData = await getUserById(currentUser._id)
                setUserProfile(userData)
                setError(null)
            } catch (err) {
                console.error('Error fetching user profile:', err)
                setError('Failed to load user profile')
            } finally {
                setLoading(false)
            }
        }

        fetchUserProfile()
    }, [currentUser?._id])

    // ✅ Helper functions
    const formatDate = (date?: string | Date) => {
        if (!date) return '-'
        const d = new Date(date)
        return d.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
    }

    const formatGender = (gender?: string) => {
        if (!gender) return '-'
        return gender.charAt(0).toUpperCase() + gender.slice(1)
    }

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'Active':
                return <span className='badge badge-success'>Active</span>
            case 'On Leave':
                return <span className='badge badge-warning'>On Leave</span>
            case 'Inactive':
                return <span className='badge badge-danger'>Inactive</span>
            default:
                return <span className='badge badge-secondary'>Unknown</span>
        }
    }

    const formatDepartments = (department_id?: any) => {
        if (!department_id) return 'No Department'
        
        // ถ้าเป็น array
        if (Array.isArray(department_id)) {
            if (department_id.length === 0) return 'No Department'
            
            // แสดงชื่อ department
            const departmentNames = department_id
                .map(dept => typeof dept === 'object' ? dept.department_name : dept)
                .filter(Boolean)
                .join(', ')
            
            return departmentNames || `${department_id.length} Department(s)`
        }
        
        // ถ้าเป็น object
        if (typeof department_id === 'object' && department_id.department_name) {
            return department_id.department_name
        }
        
        return 'No Department'
    }

    const formatPosition = (position_id?: any) => {
        if (!position_id) return 'No Position'
        
        // ถ้าเป็น object
        if (typeof position_id === 'object' && position_id.position_name) {
            return position_id.position_name
        }
        
        return 'No Position'
    }

    // ✅ Loading state
    if (loading) {
        return (
            <div className='card mb-5 mb-xl-10'>
                <div className='card-body p-9 text-center'>
                    <div className='spinner-border text-primary' role='status'>
                        <span className='visually-hidden'>Loading...</span>
                    </div>
                    <p className='mt-3 text-muted'>Loading profile...</p>
                </div>
            </div>
        )
    }

    // ✅ Error state
    if (error) {
        return (
            <div className='card mb-5 mb-xl-10'>
                <div className='card-body p-9 text-center'>
                    <div className='alert alert-danger'>
                        {error}
                    </div>
                    <button 
                        className='btn btn-primary'
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    // ✅ No user data
    if (!currentUser || !userProfile) {
        return (
            <div className='card mb-5 mb-xl-10'>
                <div className='card-body p-9 text-center'>
                    <div className='alert alert-warning'>
                        No user data found. Please login again.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className='card mb-5 mb-xl-10' id='kt_profile_details_view'>
                <div className='card-header cursor-pointer'>
                    <div className='card-title m-0'>
                        <h3 className='fw-bolder m-0'>Profile Details</h3>
                    </div>
                </div>

                <div className='card-body p-9'>
                    {/* Full Name (English) */}
                    <div className='row mb-7'>
                        <label className='col-lg-4 fw-bold text-muted'>Full Name (English)</label>
                        <div className='col-lg-8'>
                            <span className='fw-bolder fs-6 text-gray-900'>
                                {userProfile.first_name_en || ''} {userProfile.last_name_en || ''}
                            </span>
                            {userProfile.nickname_en && (
                                <span className='text-muted ms-2'>({userProfile.nickname_en})</span>
                            )}
                        </div>
                    </div>

                    {/* Full Name (Lao) */}
                    <div className='row mb-7'>
                        <label className='col-lg-4 fw-bold text-muted'>Full Name (Lao)</label>
                        <div className='col-lg-8'>
                            <span className='fw-bolder fs-6 text-gray-900'>
                                {userProfile.first_name_la || ''} {userProfile.last_name_la || ''}
                            </span>
                            {userProfile.nickname_la && (
                                <span className='text-muted ms-2'>({userProfile.nickname_la})</span>
                            )}
                        </div>
                    </div>

                    {/* Email */}
                    <div className='row mb-7'>
                        <label className='col-lg-4 fw-bold text-muted'>Email</label>
                        <div className='col-lg-8 fv-row'>
                            <span className='fw-bold fs-6'>{userProfile.user_email}</span>
                        </div>
                    </div>

                    {/* Status */}
                    <div className='row mb-7'>
                        <label className='col-lg-4 fw-bold text-muted'>Status</label>
                        <div className='col-lg-8 d-flex align-items-center'>
                            {getStatusBadge(userProfile.status)}
                        </div>
                    </div>

                    {/* Role */}
                    <div className='row mb-7'>
                        <label className='col-lg-4 fw-bold text-muted'>Role</label>
                        <div className='col-lg-8'>
                            <span className='fw-bolder fs-6 text-gray-900'>
                                {userProfile.role?.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Department */}
                    <div className='row mb-7'>
                        <label className='col-lg-4 fw-bold text-muted'>Department</label>
                        <div className='col-lg-8'>
                            <span className='fw-bolder fs-6 text-gray-900'>
                                {formatDepartments(userProfile.department_id)}
                            </span>
                        </div>
                    </div>

                    {/* Position */}
                    <div className='row mb-7'>
                        <label className='col-lg-4 fw-bold text-muted'>Position</label>
                        <div className='col-lg-8'>
                            <span className='fw-bolder fs-6 text-gray-900'>
                                {formatPosition(userProfile.position_id)}
                            </span>
                        </div>
                    </div>

                    {/* Date of Birth */}
                    <div className='row mb-7'>
                        <label className='col-lg-4 fw-bold text-muted'>
                            Date of Birth
                            <i
                                className='fas fa-exclamation-circle ms-1 fs-7'
                                data-bs-toggle='tooltip'
                                title='Date of birth'
                            ></i>
                        </label>
                        <div className='col-lg-8'>
                            <span className='fw-bolder fs-6 text-gray-900'>
                                {formatDate(userProfile.date_of_birth)}
                            </span>
                        </div>
                    </div>

                    {/* Gender */}
                    <div className='row mb-7'>
                        <label className='col-lg-4 fw-bold text-muted'>Gender</label>
                        <div className='col-lg-8'>
                            <span className='fw-bolder fs-6 text-gray-900'>
                                {formatGender(userProfile.gender)}
                            </span>
                        </div>
                    </div>

                    {/* Start Work Date */}
                    <div className='row mb-7'>
                        <label className='col-lg-4 fw-bold text-muted'>Start Work Date</label>
                        <div className='col-lg-8'>
                            <span className='fw-bolder fs-6 text-gray-900'>
                                {formatDate(userProfile.start_work)}
                            </span>
                        </div>
                    </div>

                    {/* Leave Days */}
                    <div className='row mb-7'>
                        <label className='col-lg-4 fw-bold text-muted'>Leave Days Available</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6 text-primary'>
                                {userProfile.leave_days ?? 0} days
                            </span>
                        </div>
                    </div>

                    {/* Base Salary */}
                    {/* {userProfile.base_salary && userProfile.base_salary > 0 && (
                        <div className='row mb-7'>
                            <label className='col-lg-4 fw-bold text-muted'>Base Salary</label>
                            <div className='col-lg-8'>
                                <span className='fw-bold fs-6 text-success'>
                                    {userProfile.base_salary.toLocaleString()} LAK
                                </span>
                            </div>
                        </div>
                    )} */}

                    {/* Created At */}
                    <div className='row mb-10'>
                        <label className='col-lg-4 fw-bold text-muted'>Member Since</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6'>
                                {formatDate(userProfile.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Last Updated */}
                    {userProfile.updatedAt && (
                        <div className='row mb-7'>
                            <label className='col-lg-4 fw-bold text-muted'>Last Updated</label>
                            <div className='col-lg-8'>
                                <span className='fw-bold fs-6 text-muted'>
                                    {formatDate(userProfile.updatedAt)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default ProfileWithContext