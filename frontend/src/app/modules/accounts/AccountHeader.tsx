import React, { useState, useEffect } from 'react'
import { KTIcon, toAbsoluteUrl } from '../../../_metronic/helpers'
import { Link } from 'react-router-dom'
import { Dropdown1 } from '../../../_metronic/partials'
import { useLocation } from 'react-router'
import { useAuth } from '../../modules/auth'
import { getUserById } from '../apps/user-management/users-list/core/_requests'
import type { User } from '../apps/user-management/users-list/core/_models'
const AccountHeader: React.FC = () => {
  const location = useLocation()
  const { currentUser } = useAuth()
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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
      } catch (err) {
        console.error('Error fetching user profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [currentUser?._id])

  // ✅ Helper functions
  const getFullName = () => {
    if (!userProfile) return 'User'
    return `${userProfile.first_name_en || ''} ${userProfile.last_name_en || ''}`.trim() || 'User'
  }

  const getPosition = () => {
    if (!userProfile?.position_id) return 'Employee'
    if (typeof userProfile.position_id === 'object' && 
        userProfile.position_id !== null && 
        'position_name' in userProfile.position_id) {
      return userProfile.position_id.position_name
    }
    return 'Employee'
  }

  const getLocation = () => {
    if (!userProfile?.department_id) return 'Vientiane, Laos'
    
    if (Array.isArray(userProfile.department_id) && userProfile.department_id.length > 0) {
      const dept = userProfile.department_id[0]
      if (typeof dept === 'object' && dept !== null && 'department_name' in dept) {
        return dept.department_name
      }
    }
    
    if (typeof userProfile.department_id === 'object' && 
        userProfile.department_id !== null && 
        !Array.isArray(userProfile.department_id) && 
        'department_name' in userProfile.department_id) {
      return userProfile.department_id.department_name
    }
    
    return 'Vientiane, Laos'
  }

  const getEmail = () => {
    return userProfile?.user_email || currentUser?.user_email || 'user@example.com'
  }

  const getProfileCompletion = () => {
    if (!userProfile) return 0
    
    const fields = [
      userProfile.first_name_en,
      userProfile.last_name_en,
      userProfile.user_email,
      userProfile.date_of_birth,
      userProfile.gender,
      userProfile.department_id,
      userProfile.position_id,
      userProfile.start_work,
    ]
    
    const completedFields = fields.filter(field => field !== null && field !== undefined && field !== '').length
    return Math.round((completedFields / fields.length) * 100)
  }

  // ✅ Loading state
  if (loading) {
    return (
      <div className='card mb-5 mb-xl-10'>
        <div className='card-body pt-9 pb-0'>
          <div className='text-center py-10'>
            <div className='spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='card mb-5 mb-xl-10'>
        <div className='card-body pt-9 pb-0'>
          <div className='d-flex flex-wrap flex-sm-nowrap mb-3'>
            <div className='me-7 mb-4'>
              <div className='symbol symbol-100px symbol-lg-160px symbol-fixed position-relative'>
                <div 
                  className='symbol-label fs-3x fw-bold text-white'
                  style={{
                    backgroundColor: '#17c653',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%'
                  }}
                >
                  {userProfile?.first_name_en?.charAt(0).toUpperCase() || 'U'}
                  {userProfile?.last_name_en?.charAt(0).toUpperCase() || ''}
                </div>
                {/* <div className='position-absolute translate-middle bottom-0 start-100 mb-6 bg-success rounded-circle border border-4 border-white h-20px w-20px'></div> */}
              </div>
            </div>

            <div className='flex-grow-1'>
              <div className='d-flex justify-content-between align-items-start flex-wrap mb-2'>
                <div className='d-flex flex-column'>
                  <div className='d-flex align-items-center mb-2'>
                    <a href='#' className='text-gray-800 text-hover-primary fs-2 fw-bolder me-1'>
                      {getFullName()}
                    </a>
                    <a href='#'>
                      <KTIcon iconName='verify' className='fs-1 text-primary' />
                    </a>
                    {userProfile?.role === 'employee' && (
                      <a
                        href='#'
                        className='btn btn-sm btn-light-success fw-bolder ms-2 fs-8 py-1 px-3'
                        data-bs-toggle='modal'
                        data-bs-target='#kt_modal_upgrade_plan'
                      >
                        Upgrade to Pro
                      </a>
                    )}
                  </div>

                  <div className='d-flex flex-wrap fw-bold fs-6 mb-4 pe-2'>
                    <a
                      href='#'
                      className='d-flex align-items-center text-gray-500 text-hover-primary me-5 mb-2'
                    >
                      <KTIcon iconName='profile-circle' className='fs-4 me-1' />
                      {getPosition()}
                    </a>
                    <a
                      href='#'
                      className='d-flex align-items-center text-gray-500 text-hover-primary me-5 mb-2'
                    >
                      <KTIcon iconName='geolocation' className='fs-4 me-1' />
                      {getLocation()}
                    </a>
                    <a
                      href='#'
                      className='d-flex align-items-center text-gray-500 text-hover-primary mb-2'
                    >
                      <KTIcon iconName='sms' className='fs-4 me-1' />
                      {getEmail()}
                    </a>
                  </div>
                </div>

                {/* <div className='d-flex my-4'>
                  <a href='#' className='btn btn-sm btn-light me-2' id='kt_user_follow_button'>
                    <KTIcon iconName='check' className='fs-3 d-none' />
                    <span className='indicator-label'>Follow</span>
                    <span className='indicator-progress'>
                      Please wait...
                      <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
                    </span>
                  </a>
                  <a
                    href='#'
                    className='btn btn-sm btn-primary me-3'
                    data-bs-toggle='modal'
                    data-bs-target='#kt_modal_offer_a_deal'
                  >
                    Hire Me
                  </a>
                  <div className='me-0'>
                    <button
                      className='btn btn-sm btn-icon btn-bg-light btn-active-color-primary'
                      data-kt-menu-trigger='click'
                      data-kt-menu-placement='bottom-end'
                      data-kt-menu-flip='top-end'
                    >
                      <i className='bi bi-three-dots fs-3'></i>
                    </button>
                    <Dropdown1 />
                  </div>
                </div> */}
              </div>

              <div className='d-flex flex-wrap flex-stack'>
                <div className='d-flex flex-column flex-grow-1 pe-8'>
                  <div className='d-flex flex-wrap'>
                    {/* Earnings - สามารถเพิ่มข้อมูลจริงได้ในอนาคต */}
                    <div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3'>
                      <div className='d-flex align-items-center'>
                        <KTIcon iconName='arrow-up' className='fs-3 text-success me-2' />
                        <div className='fs-2 fw-bolder'>
                          {userProfile?.base_salary 
                            ? `${(userProfile.base_salary / 1000).toFixed(0)}K` 
                            : '-'}
                        </div>
                      </div>
                      <div className='fw-bold fs-6 text-gray-500'>Base Salary</div>
                    </div>

                    {/* Leave Days */}
                    <div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3'>
                      <div className='d-flex align-items-center'>
                        <KTIcon iconName='calendar' className='fs-3 text-primary me-2' />
                        <div className='fs-2 fw-bolder'>{userProfile?.leave_days ?? 0}</div>
                      </div>
                      <div className='fw-bold fs-6 text-gray-500'>Leave Days</div>
                    </div>

                    {/* Status */}
                    <div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3'>
                      <div className='d-flex align-items-center'>
                        <KTIcon 
                          iconName={userProfile?.status === 'Active' ? 'check-circle' : 'information'} 
                          className={`fs-3 me-2 ${userProfile?.status === 'Active' ? 'text-success' : 'text-warning'}`} 
                        />
                        <div className='fs-2 fw-bolder'>{userProfile?.status || 'Active'}</div>
                      </div>
                      <div className='fw-bold fs-6 text-gray-500'>Status</div>
                    </div>
                  </div>
                </div>

                <div className='d-flex align-items-center w-200px w-sm-300px flex-column mt-3'>
                  <div className='d-flex justify-content-between w-100 mt-auto mb-2'>
                    <span className='fw-bold fs-6 text-gray-500'>Profile Completion</span>
                    <span className='fw-bolder fs-6'>{getProfileCompletion()}%</span>
                  </div>
                  <div className='h-5px mx-3 w-100 bg-light mb-3'>
                    <div
                      className='bg-success rounded h-5px'
                      role='progressbar'
                      style={{ width: `${getProfileCompletion()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='d-flex overflow-auto h-55px'>
            <ul className='nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-5 fw-bolder flex-nowrap'>
              <li className='nav-item'>
                <Link
                  className={
                    `nav-link text-active-primary me-6 ` +
                    (location.pathname === '/crafted/account/overview' && 'active')
                  }
                  to='/crafted/account/overview'
                  style={{
                    borderBottom: location.pathname === '/crafted/account/overview'
                      ? '5px solid #17c653'
                      : '5px solid transparent',
                    paddingBottom: '1.25rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Overview
                </Link>
              </li>
              <li className='nav-item'>
                <Link
                  className={
                    `nav-link text-active-primary me-6 ` +
                    (location.pathname === '/crafted/account/profile' && 'active')
                  }
                  to='/crafted/account/profile'
                  style={{
                    borderBottom: location.pathname === '/crafted/account/profile'
                      ? '5px solid #17c653'
                      : '5px solid transparent',
                    paddingBottom: '1.25rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Profile
                </Link>
              </li>
              <li className='nav-item'>
                <Link
                  className={
                    `nav-link text-active-primary me-6 ` +
                    (location.pathname === '/crafted/account/viewpayslip' && 'active')
                  }
                  to='/crafted/account/viewpayslip'
                  style={{
                    borderBottom: location.pathname === '/crafted/account/viewpayslip'
                      ? '5px solid #17c653'
                      : '5px solid transparent',
                    paddingBottom: '1.25rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Viewpayslip
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

export { AccountHeader }