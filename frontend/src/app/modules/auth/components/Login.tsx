import { useState } from 'react'
import * as Yup from 'yup'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { useFormik } from 'formik'
import { login } from '../core/_requests' // ✅ ลบ getUserByToken ออก
import { toAbsoluteUrl } from '../../../../_metronic/helpers'
import { useAuth } from '../core/Auth'
import { UserModel } from '../core/_models' // ✅ เพิ่ม import

const loginSchema = Yup.object().shape({
  user_email: Yup.string()
    .email('Wrong email format')
    .min(3, 'Minimum 3 symbols')
    .max(50, 'Maximum 50 symbols')
    .required('Email is required'),
  password: Yup.string()
    .min(3, 'Minimum 3 symbols')
    // .max(50, 'Maximum 50 symbols')
    .required('Password is required'),
})

const initialValues = {
  user_email: '',
  password: '',
}

export function Login() {
  const [loading, setLoading] = useState(false)
  const { saveAuth, setCurrentUser } = useAuth()

  const formik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true)
      // console.log('🔄 Login attempt:', values.user_email)

      try {
        console.log('📤 Calling login API...')
        const { data: auth } = await login(values.user_email, values.password)
        // console.log('✅ Login response:', auth)

        // ✅ บันทึก auth (มี token) ลง localStorage
        saveAuth(auth)
        console.log('💾 Auth saved to localStorage')

        // ✅ ตรวจสอบว่า auth มี token
        if (!auth.token) {
          throw new Error('No token received from server')
        }

        // ✅ แปลง AuthModel เป็น UserModel (ใช้ข้อมูลจาก login response)
        const user: UserModel = {
          _id: auth._id,
          user_name: auth.user_name,
          user_email: auth.user_email,
          role: auth.role,
          department_id: auth.department_id,
          leave_days: auth.leave_days,
        }

        console.log('✅ User data:', user)

        // ✅ บันทึก user ลง localStorage
        localStorage.setItem('user', JSON.stringify(user))
        console.log('💾 User saved to localStorage')

        // ✅ Set current user ใน context/state
        setCurrentUser(user)
        console.log('✅ Login complete!')

        // ✅ Login สำเร็จ - ไม่มี error ก็จะ redirect อัตโนมัติ

      } catch (error: any) {
        console.error('❌ Login error:', error)
        console.error('❌ Error response:', error.response?.data)

        saveAuth(undefined)
        localStorage.removeItem('user') // ✅ ลบ user ออกด้วยถ้า login ไม่สำเร็จ
        setStatus(error.response?.data?.message || 'The login details are incorrect')
        setSubmitting(false)
        setLoading(false)
      }
    }
  })

  return (
    <form
      className='form w-100'
      onSubmit={formik.handleSubmit}
      noValidate
      id='kt_login_signin_form'
    >

      {/* begin::Heading */}
      {/* <div className='text-center mb-11'> */}
      {/* <h1 className='text-gray-900 fw-bolder mb-3'>Sign In</h1>
        <div className='text-gray-500 fw-semibold fs-6'>Employee Leave Management System</div> */}
      {/* </div> */}
      {/* begin::Heading */}

      {/* begin::Login options */}
      <div className='row g-3 mb-9'>
        <img src="media/logos/sys.png" alt="Systory logo" className='h-100%' />

        {/* begin::Col */}
        <div className='col-md-6'>
          {/* begin::Google link */}

          {/* <a href='#'
            className='btn btn-flex btn-outline btn-text-gray-700 btn-active-color-primary bg-state-light flex-center text-nowrap w-100'
          >
            <img
              alt='Logo'
              src={toAbsoluteUrl('media/svg/brand-logos/google-icon.svg')}
              className='h-15px me-3'
            />
            Sign in with Google
          </a> */}
          {/* end::Google link */}
        </div>
        {/* end::Col */}

        {/* begin::Col */}
        <div className='col-md-6'>
          {/* begin::Google link */}

          {/* <a href='#'
            className='btn btn-flex btn-outline btn-text-gray-700 btn-active-color-primary bg-state-light flex-center text-nowrap w-100'
          >
            <img
              alt='Logo'
              src={toAbsoluteUrl('media/svg/brand-logos/apple-black.svg')}
              className='theme-light-show h-15px me-3'
            />
            <img
              alt='Logo'
              src={toAbsoluteUrl('media/svg/brand-logos/apple-black-dark.svg')}
              className='theme-dark-show h-15px me-3'
            />
            Sign in with Apple
          </a> */}
          {/* end::Google link */}
        </div>
        {/* end::Col */}
      </div>
      {/* end::Login options */}

      {/* begin::Separator */}
      {/* <div className='separator separator-content my-14'> */}
      {/* <span className='w-125px text-gray-500 fw-semibold fs-7'>Or with email</span> */}
      {/* </div> */}
      {/* end::Separator */}

      {/* {formik.status ? (
        <div className='mb-lg-15 alert alert-danger'>
          <div className='alert-text font-weight-bold'>{formik.status}</div>
        </div>
      ) : (
        <div className='mb-10 bg-light-info p-8 rounded'>
          <div className='text-info'>
            Use account <strong>admin@demo.com</strong> and password <strong>demo</strong> to
            continue.
          </div>
        </div>
      )} */}


      {/* begin::Form group */}
      <div className='fv-row mb-8'>
        <label className='form-label fs-6 fw-bolder text-gray-900'>Email</label>
        <input
          placeholder='Email'
          {...formik.getFieldProps('user_email')}
          className={clsx(
            'form-control bg-transparent',
            { 'is-invalid': formik.touched.user_email && formik.errors.user_email },
            {
              'is-valid': formik.touched.user_email && !formik.errors.user_email,
            }
          )}
          type='email'
          name='user_email'
          autoComplete='off'
        />
        {formik.touched.user_email && formik.errors.user_email && (
          <div className='fv-plugins-message-container'>
            <div className='fv-help-block'>
              <span role='alert'>{formik.errors.user_email}</span>
            </div>
          </div>
        )}
      </div>
      {/* end::Form group */}

      {/* begin::Form group */}
      <div className='fv-row mb-3'>
        <label className='form-label fw-bolder text-gray-900 fs-6 mb-0'>Password</label>
        <input
          placeholder='Password'
          type='password'
          autoComplete='off'
          {...formik.getFieldProps('password')}
          className={clsx(
            'form-control',
            {
              // กรอบแดงเมื่อ validation client ผิด
              'is-invalid': (formik.touched.password && formik.errors.password) || formik.status,
              'is-valid': formik.touched.password && !formik.errors.password && !formik.status,
            }
          )}
        />
        {/* ข้อความ error จาก validation client */}
        {formik.touched.password && formik.errors.password && (
          <div className='invalid-feedback'>{formik.errors.password}</div>
        )}
        {/* ข้อความ error จาก login fail */}
        {formik.status && (
          <div className='invalid-feedback'>{formik.status}</div>
        )}
      </div>

      {/* end::Form group */}

      {/* begin::Wrapper */}
      <div className='d-flex flex-stack flex-wrap gap-3 fs-base fw-semibold mb-8'>
        <div />

        {/* begin::Link */}
        {/* <Link to='/auth/forgot-password' className='link-primary'>
          Forgot Password ?
        </Link> */}
        {/* end::Link */}
      </div>
      {/* end::Wrapper */}

      {/* begin::Action */}
      <div className='d-grid mb-10'>
        <button
          type='submit'
          id='kt_sign_in_submit'
          className='btn btn-primary'
          disabled={formik.isSubmitting || !formik.isValid}
        >
          {!loading && <span className='indicator-label'>Login</span>}
          {loading && (
            <span className='indicator-progress' style={{ display: 'block' }}>
              Please wait...
              <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
            </span>
          )}
        </button>
      </div>
      {/* end::Action */}

      {/* <div className='text-gray-500 text-center fw-semibold fs-6'>
        Not a Member yet?{' '}
        <Link to='/auth/registration' className='link-primary'>
          Sign up
        </Link>
      </div> */}
    </form>
  )
}