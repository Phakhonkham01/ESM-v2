import { FC, useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useListView } from '../core/ListViewProvider'
import { getUserById } from '../core/_requests'
import { User } from '../core/_models'
import { KTIcon } from '../../../../../../_metronic/helpers'

const UserDetailModalContent: FC = () => {
    const { itemIdForDetail } = useListView()
    const [user, setUser] = useState<User | null>(null)

    const { data: userData, isLoading } = useQuery(
        ['user-detail', itemIdForDetail],
        () => getUserById(itemIdForDetail!),
        {
            enabled: !!itemIdForDetail,
            onSuccess: (data) => {
                console.log('✅ User detail data:', data)
                setUser(data)
            },
        }
    )

    useEffect(() => {
        if (userData) {
            setUser(userData)
        }
    }, [userData])

    if (isLoading) {
        return (
            <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '300px' }}>
                <span className='spinner-border spinner-border-lg text-primary'></span>
            </div>
        )
    }

    if (!user) {
        return (
            <div className='alert alert-danger'>
                <div className='alert-text'>User not found</div>
            </div>
        )
    }

    // ✅ Helper functions with correct field names
    const getFullNameEN = () => {
        if (user.first_name_en && user.last_name_en) {
            return `${user.first_name_en} ${user.last_name_en}`
        }
        return user.user_name || 'N/A'
    }

    const getFullNameLA = () => {
        if (user.first_name_la && user.last_name_la) {
            return `${user.first_name_la} ${user.last_name_la}`
        }
        return 'N/A'
    }

    const getDepartmentName = () => {
        if (!user.department_id) return 'N/A'

        if (Array.isArray(user.department_id)) {
            return user.department_id
                .map((d: any) => d.department_name || 'Unknown')
                .join(', ')
        }

        if (typeof user.department_id === 'object' && user.department_id !== null) {
            return (user.department_id as any).department_name || 'N/A'
        }

        return 'N/A'
    }

    const getPositionName = () => {
        if (!user.position_id) return 'N/A'

        if (typeof user.position_id === 'object' && user.position_id !== null) {
            return (user.position_id as any).position_name || 'N/A'
        }

        return 'N/A'
    }

    const getGenderLabel = () => {
        const gender = user.gender?.toLowerCase()
        if (gender === 'male') return 'Male'
        if (gender === 'female') return 'Female'
        if (gender === 'other') return 'Other'
        return 'N/A'
    }

    const getStatusBadge = () => {
        const status = user.status?.toLowerCase()
        if (status === 'active') {
            return <span className='badge badge-light-success fw-bold'>Active</span>
        }
        if (status === 'inactive') {
            return <span className='badge badge-light-danger fw-bold'>Inactive</span>
        }
        if (status === 'on leave') {
            return <span className='badge badge-light-warning fw-bold'>On Leave</span>
        }
        return <span className='badge badge-light-secondary fw-bold'>Unknown</span>
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } catch {
            return 'N/A'
        }
    }

    const formatCurrency = (amount?: number) => {
        if (amount === undefined || amount === null) return 'N/A'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'LAK'
        }).format(amount)
    }

    return (
        <div className='scroll-y me-n7 pe-7'>
            {/* Profile Header */}
            <div className='d-flex flex-wrap flex-sm-nowrap mb-10'>
                <div className='flex-grow-1'>
                    <div className='d-flex justify-content-between align-items-start flex-wrap'>
                        <div className='d-flex flex-column'>
                            <div className='d-flex align-items-center mb-2'>
                                <span className='text-gray-900 fs-2 fw-bold me-3'>
                                    {getFullNameEN()}
                                </span>
                                {getStatusBadge()}
                            </div>

                            <div className='d-flex flex-wrap fw-semibold fs-6 mb-4 pe-2'>
                                <span className='d-flex align-items-center text-gray-400 me-5 mb-2'>
                                    <KTIcon iconName='profile-circle' className='fs-4 me-1' />
                                    {user.role?.toUpperCase() || 'N/A'}
                                </span>
                                <span className='d-flex align-items-center text-gray-400 me-5 mb-2'>
                                    <KTIcon iconName='sms' className='fs-4 me-1' />
                                    {user.user_email || 'N/A'}
                                </span>
                                <span className='d-flex align-items-center text-gray-400 mb-2'>
                                    <KTIcon iconName='phone' className='fs-4 me-1' />
                                    {user.phone_number || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Information */}
            <div className='mb-10'>
                <h3 className='fw-bold mb-5'>
                    <KTIcon iconName='profile-user' className='fs-2 me-2' />
                    Personal Information
                </h3>
                <div className='separator separator-dashed mb-7'></div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Employee ID</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{user.employee_id || 'N/A'}</span>
                    </div>
                </div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Full Name (English)</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{getFullNameEN()}</span>
                        {user.nickname_en && (
                            <span className='text-muted ms-2'>({user.nickname_en})</span>
                        )}
                    </div>
                </div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Full Name (ພາສາລາວ)</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{getFullNameLA()}</span>
                        {user.nickname_la && (
                            <span className='text-muted ms-2'>({user.nickname_la})</span>
                        )}
                    </div>
                </div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Username</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{user.user_name || 'N/A'}</span>
                    </div>
                </div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Email</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{user.user_email || 'N/A'}</span>
                    </div>
                </div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Gender</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{getGenderLabel()}</span>
                    </div>
                </div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Date of Birth</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{formatDate(user.date_of_birth)}</span>
                    </div>
                </div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Phone Number</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{user.phone_number || 'N/A'}</span>
                    </div>
                </div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Address</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{user.address || 'N/A'}</span>
                    </div>
                </div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Emergency Contact</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{user.emergency_contact || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Work Information */}
            <div className='mb-10'>
                <h3 className='fw-bold mb-5'>
                    <KTIcon iconName='office-bag' className='fs-2 me-2' />
                    Work Information
                </h3>
                <div className='separator separator-dashed mb-7'></div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Role</label>
                    <div className='col-lg-8'>
                        <span className='badge badge-light-primary fw-bold fs-7'>
                            {user.role?.toUpperCase() || 'N/A'}
                        </span>
                    </div>
                </div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Department</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{getDepartmentName()}</span>
                    </div>
                </div>

                {user.role === 'employee' && (
                    <div className='row mb-5'>
                        <label className='col-lg-4 fw-semibold text-muted'>Position</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6 text-gray-900'>{getPositionName()}</span>
                        </div>
                    </div>
                )}

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Start Work Date</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{formatDate(user.start_work)}</span>
                    </div>
                </div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Status</label>
                    <div className='col-lg-8'>
                        {getStatusBadge()}
                    </div>
                </div>
            </div>

            {/* Salary Information */}
            {user.role === 'employee' && (
                <div className='mb-10'>
                    <h3 className='fw-bold mb-5'>
                        <KTIcon iconName='dollar' className='fs-2 me-2' />
                        Salary Information
                    </h3>
                    <div className='separator separator-dashed mb-7'></div>

                    <div className='row mb-5'>
                        <label className='col-lg-4 fw-semibold text-muted'>Base Salary</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6 text-gray-900'>{formatCurrency(user.base_salary)}</span>
                        </div>
                    </div>

                    <div className='row mb-5'>
                        <label className='col-lg-4 fw-semibold text-muted'>Hourly Rate</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6 text-gray-900'>{formatCurrency(user.hourly_rate)}</span>
                        </div>
                    </div>

                    <div className='row mb-5'>
                        <label className='col-lg-4 fw-semibold text-muted'>Overtime Rate</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6 text-gray-900'>{formatCurrency(user.overtime_rate)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Information */}
            {user.role === 'employee' && (
                <div className='mb-10'>
                    <h3 className='fw-bold mb-5'>
                        <KTIcon iconName='calendar' className='fs-2 me-2' />
                        Leave Information
                    </h3>
                    <div className='separator separator-dashed mb-7'></div>

                    <div className='row mb-5'>
                        <label className='col-lg-4 fw-semibold text-muted'>Total Leave Days</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6 text-gray-900'>{user.leave_days || 0} days</span>
                        </div>
                    </div>

                    <div className='row mb-5'>
                        <label className='col-lg-4 fw-semibold text-muted'>Used Leave Days</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6 text-danger'>{user.used_leave_days || 0} days</span>
                        </div>
                    </div>

                    <div className='row mb-5'>
                        <label className='col-lg-4 fw-semibold text-muted'>Remaining Leave Days</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6 text-success'>{user.remaining_leave_days || 0} days</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Statistics */}
            {user.role === 'employee' && (
                <div className='mb-10'>
                    <h3 className='fw-bold mb-5'>
                        <KTIcon iconName='chart-simple' className='fs-2 me-2' />
                        Attendance Statistics
                    </h3>
                    <div className='separator separator-dashed mb-7'></div>

                    <div className='row mb-5'>
                        <label className='col-lg-4 fw-semibold text-muted'>Total Working Days</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6 text-gray-900'>{user.total_working_days || 0} days</span>
                        </div>
                    </div>

                    <div className='row mb-5'>
                        <label className='col-lg-4 fw-semibold text-muted'>Total Absent Days</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6 text-danger'>{user.total_absent_days || 0} days</span>
                        </div>
                    </div>

                    <div className='row mb-5'>
                        <label className='col-lg-4 fw-semibold text-muted'>Total Late Days</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6 text-warning'>{user.total_late_days || 0} days</span>
                        </div>
                    </div>

                    <div className='row mb-5'>
                        <label className='col-lg-4 fw-semibold text-muted'>Average Working Hours</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6 text-gray-900'>
                                {user.average_working_hours?.toFixed(2) || 0} hours/day
                            </span>
                        </div>
                    </div>

                    <div className='row mb-5'>
                        <label className='col-lg-4 fw-semibold text-muted'>Last Attendance Date</label>
                        <div className='col-lg-8'>
                            <span className='fw-bold fs-6 text-gray-900'>
                                {formatDate(user.last_attendance_date)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* System Information */}
            <div className='mb-10'>
                <h3 className='fw-bold mb-5'>
                    <KTIcon iconName='information' className='fs-2 me-2' />
                    System Information
                </h3>
                <div className='separator separator-dashed mb-7'></div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Created At</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{formatDate(user.created_at?.toString())}</span>
                    </div>
                </div>

                <div className='row mb-5'>
                    <label className='col-lg-4 fw-semibold text-muted'>Last Updated</label>
                    <div className='col-lg-8'>
                        <span className='fw-bold fs-6 text-gray-900'>{formatDate(user.updated_at?.toString())}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export { UserDetailModalContent }