import { FC, useEffect, useState } from 'react'
import * as Yup from 'yup'
import { useFormik, FormikHelpers } from 'formik'
import clsx from 'clsx'
import { isNotEmpty } from '../../../../../../_metronic/helpers'
import { initialUser, User } from '../core/_models'
import { useListView } from '../core/ListViewProvider'
import { UsersListLoading } from '../components/loading/UsersListLoading'
import { createUser, updateUser } from '../core/_requests'
import { useQueryResponse } from '../core/QueryResponseProvider'
import { QUERIES } from '../../../../../../_metronic/helpers/crud-helper/consts'
import { useMutation, useQueryClient, QueryKey } from 'react-query'
import axios, { AxiosError } from 'axios'
import ChangePasswordModal from './ChangePasswordModal'
import CreateDepartmentModal from './CreateDepartmentModal'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'

type Props = {
  isUserLoading: boolean
  user?: User

}

interface Department {
  _id?: string
  id?: string
  department_name: string
  createdAt?: Date
  updatedAt?: Date
}

interface Position {
  _id?: string
  id?: string
  position_name: string
  department_id: string
  createdAt?: Date
  updatedAt?: Date
}

interface ApiError {
  response?: {
    data?: {
      message?: string
      userCount?: number
      users?: Array<{ id: string; name: string; email: string }>
    }
    status?: number
  }
  message?: string
}


/* -------------------- Validation -------------------- */
const userSchema = Yup.object().shape({
  user_email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().when('id', {
    is: (id: string | undefined) => !id,
    then: (schema) => schema.min(6).required('Password is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  department_id: Yup.mixed()
    .when('role', {
      is: 'employee',
      then: (schema) => schema.required('Department is required for employees'),
      otherwise: (schema) => schema.nullable().notRequired(),
    }),
  leave_days: Yup.number().min(0).when('role', {
    is: (role: string) => role !== 'admin' && role !== 'supervisor',
    then: (schema) => schema.required('Leave days is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  role: Yup.string().required(),
  status: Yup.string().required(),
  first_name_en: Yup.string().required('First name (EN) is required'),
  last_name_en: Yup.string().required('Last name (EN) is required'),
  nickname_en: Yup.string(),
  first_name_la: Yup.string().required('First name (LA) is required'),
  last_name_la: Yup.string().required('Last name (LA) is required'),
  nickname_la: Yup.string(),
  date_of_birth: Yup.string().required('Date of birth is required'),
  start_work: Yup.string().required('Start work date is required'),
  gender: Yup.string().required('Gender is required'),
  position_id: Yup.string().when('role', {
    is: (role: string) => role === 'employee',
    then: (schema) => schema.required('Position is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  base_salary: Yup.number().min(0).when('role', {
    is: (role: string) => role === 'employee',
    then: (schema) => schema.required('Base salary is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
})

const departmentSchema = Yup.object().shape({
  department_name: Yup.string()
    .min(2, 'Minimum 2 characters')
    .max(100, 'Maximum 100 characters')
    .required('Department name is required'),
})

/* -------------------- Component -------------------- */
const UserEditModalForm: FC<Props> = ({ user, isUserLoading }) => {
  const { setItemIdForUpdate } = useListView()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const { query } = useQueryResponse()
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)


  // แก้ไข ExtendedUser interface ด้านบน component
  interface ExtendedUser extends Omit<User, 'position_id' | 'department_id'> {
    // Omit ฟิลด์ที่มีปัญหาก่อน
    position_id: string // เปลี่ยนจาก string | Position เป็น string เฉพาะ
    department_id: string | string[] | null // เปลี่ยนจาก flexible type เป็น specific
  }

  // หรือวิธีที่ดีกว่า: ใช้ User โดยตรง
  const formik = useFormik<User>({ // ✅ เปลี่ยนเป็น User
    initialValues: {
      ...initialUser,
      ...user,
      role: user?.role || initialUser.role || 'employee',
      status: user?.status === 'Active' ? 'Active' :
        user?.status === 'Inactive' ? 'Inactive' :
          user?.status || 'Active',

      // ✅ แก้ไข department_id ด้วย helper function
      department_id: (() => {
        const deptId = user?.department_id
        if (!deptId) return null

        if (Array.isArray(deptId)) {
          return deptId.map(item => {
            if (typeof item === 'string') return item
            if (typeof item === 'object' && item !== null) {
              const deptObj = item as any
              return deptObj._id || deptObj.id || ''
            }
            return ''
          }).filter(Boolean)
        }

        if (typeof deptId === 'string') return deptId

        if (typeof deptId === 'object' && deptId !== null) {
          const deptObj = deptId as any
          return deptObj._id || deptObj.id || null
        }

        return null
      })(),

      // ✅ แก้ไข position_id ด้วย helper function
      position_id: (() => {
        const pid = user?.position_id
        if (!pid) return ''
        if (typeof pid === 'string') return pid

        // Type assertion
        const positionObj = pid as any
        return positionObj._id || positionObj.id || ''
      })(),

      first_name_en: user?.first_name_en || '',
      last_name_en: user?.last_name_en || '',
      nickname_en: user?.nickname_en || '',
      first_name_la: user?.first_name_la || '',
      last_name_la: user?.last_name_la || '',
      nickname_la: user?.nickname_la || '',
      date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
      start_work: user?.start_work ? new Date(user.start_work).toISOString().split('T')[0] : '',
      gender: (user?.gender as 'male' | 'female' | 'other') || 'male', // ✅ type assertion
      base_salary: user?.base_salary || 0,
      leave_days: user?.leave_days || 0,
    },
    validationSchema: userSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }: FormikHelpers<User>) => { // ✅ เปลี่ยนเป็น User
      try {
        const submitData = { ...values }

        // ✅ สร้าง user_name อัตโนมัติ
        submitData.user_name = `${values.first_name_en} ${values.last_name_en}`.trim()

        // ✅ Status mapping - ระบุ type ชัดเจน
        const statusMapping: Record<string, User['status']> = {
          'Active': 'Active',
          'Inactive': 'Inactive',
          'On Leave': 'On Leave'
        }

        if (values.status in statusMapping) {
          submitData.status = statusMapping[values.status] // ✅ TypeScript รู้ type แล้ว
        } else {
          submitData.status = 'Active'
        }

        // ✅ จัดการตาม role
        if (values.role === 'supervisor') {
          submitData.department_id = selectedDepartments
        } else if (values.role === 'employee') {
          submitData.department_id = values.department_id || null
        } else if (values.role === 'admin') {
          submitData.department_id = null
        }

        // ✅ จัดการ position_id และ base_salary
        if (values.role === 'employee') {
          submitData.position_id = values.position_id || null
          submitData.base_salary = values.base_salary || 0
        } else {
          submitData.position_id = null
          submitData.base_salary = 0
        }

        // ✅ Supervisor และ Admin: ส่ง leave_days เป็น 0 ไม่ใช่ empty string
        if (values.role === 'admin' || values.role === 'supervisor') {
          submitData.leave_days = 0 // ✅ เปลี่ยนเป็น number 0
        }

        // ลบ password ถ้าไม่มีค่า
        if (submitData.id && !submitData.password) {
          delete submitData.password
        }

        console.log('📤 Submitting user data:', submitData)

        if (isNotEmpty(values.id)) {
          await updateMutation.mutateAsync(submitData)
        } else {
          await createMutation.mutateAsync(submitData)
        }

        // ✅ Reset form หลังจาก success
        if (!isNotEmpty(values.id)) {
          resetForm({
            values: {
              ...initialUser,
              role: 'employee',
              leave_days: 15,
              status: 'Active',
              gender: 'male',
              base_salary: 0,
              position_id: '',
              department_id: null,
            }
          })
          setSelectedDepartments([])
          setRole('employee')
        }

        setItemIdForUpdate(undefined)
      } catch (err: unknown) {
        console.error('❌ Submit error:', err)
      } finally {
        setSubmitting(false)
      }
    },
  })
  /* -------------------- Department & Position state -------------------- */
  const [departments, setDepartments] = useState<Department[]>([])

  const [filteredPositions, setFilteredPositions] = useState<Position[]>([])
  const [role, setRole] = useState<string>('employee')
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [showManageDepartmentsModal, setShowManageDepartmentsModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [showEditDepartmentModal, setShowEditDepartmentModal] = useState(false)
  const [showDeleteDepartmentConfirm, setShowDeleteDepartmentConfirm] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [departmentNameExists, setDepartmentNameExists] = useState(false)
  const [checkingDepartmentName, setCheckingDepartmentName] = useState(false)
  const [usersInDepartment, setUsersInDepartment] = useState<User[]>([])

  const [showPositionModal, setShowPositionModal] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])

  const getDepartmentIdAsString = (deptId: User['department_id']): string => {
    if (!deptId) return ''
    if (typeof deptId === 'string') return deptId
    if (Array.isArray(deptId)) return '' // สำหรับ supervisor ใช้ checkbox แทน select
    if (typeof deptId === 'object' && deptId !== null) {
      const department = deptId as Department
      return department._id || department.id || ''
    }
    return ''
  }

  useEffect(() => {
    // เมื่อ role เปลี่ยนให้เคลียร์ค่าที่ไม่เกี่ยวข้อง
    if (role === 'supervisor' || role === 'admin') {
      formik.setFieldValue('position_id', '')
      formik.setFieldValue('base_salary', 0)
      formik.setFieldValue('leave_days', '') // ✅ เปลี่ยนเป็น empty string
      formik.setFieldValue('department_id', role === 'admin' ? null : formik.values.department_id)

      // ✅ สำหรับ admin เคลียร์ department ทั้งหมด
      if (role === 'admin') {
        setSelectedDepartments([])
      }
    } else if (role === 'employee') {
      // คืนค่า default สำหรับ employee
      formik.setFieldValue('leave_days', formik.values.leave_days || 15)
    }
  }, [role])
  // ✅ ประกาศฟังก์ชันใหม่
  const fetchPositionsByDepartment = async (departmentId: string) => {
    try {
      const res = await axios.get<{ data: Position[] }>(`${API_URL}/positions?department_id=${departmentId}`)
      setFilteredPositions(res.data.data || [])

      if (res.data.data.length === 0) {
        formik.setFieldValue('position_id', '')
      }
    } catch (error: unknown) {
      console.error('Error fetching positions by department:', error)
      setFilteredPositions([])
    }
  }
  useEffect(() => {
    if (role !== 'supervisor' && formik.values.department_id) {
      fetchPositionsByDepartment(formik.values.department_id as string)
    }
  }, [formik.values.department_id, role])

  const API_URL = import.meta.env.VITE_APP_API_URL

  const fetchDepartments = async () => {
    setLoadingDepartments(true)
    try {
      const res = await axios.get<{ data: Department[] }>(`${API_URL}/departments`)
      setDepartments(res.data.data)
    } catch (err: unknown) {
      console.error('Error fetching departments', err)
      toast.error('Unable to load departments')
    } finally {
      setLoadingDepartments(false)
    }
  }

  const fetchAllPositions = async () => {
    // ❌ ลบหรือประกาศ loadingPositions
    try {
      const res = await axios.get<{ data: Position[] }>(`${API_URL}/positions`)
      // ❌ ลบ setPositions ออก ถ้าไม่ใช้ positions
      // setPositions(res.data.data || []) 

      // หรือเก็บข้อมูลไว้ในตัวแปรอื่นถ้าต้องการ
      const allPositions = res.data.data || []
      console.log('Fetched positions:', allPositions.length)

    } catch (err: unknown) {
      console.error('Error fetching positions', err)
    } finally {
      // ❌ ลบหรือประกาศ loadingPositions
    }
  }

  useEffect(() => {
    fetchDepartments()
    fetchAllPositions()
  }, [])

  useEffect(() => {
    if (user?.role) {
      setRole(user.role)
      if (user.role === 'supervisor' && Array.isArray(user.department_id)) {
        const deptIds = user.department_id.map(dept =>
          typeof dept === 'object' ? dept._id || dept.id || '' : dept
        ).filter(Boolean) as string[]
        setSelectedDepartments(deptIds)
      }
    }
  }, [user])

  const checkDepartmentNameExists = async (name: string, excludeId?: string): Promise<boolean> => {
    if (!name.trim()) {
      setDepartmentNameExists(false)
      return false
    }

    setCheckingDepartmentName(true)
    try {
      const exists = departments.some((dept) => {
        const isSameName = dept.department_name.toLowerCase() === name.toLowerCase().trim()
        const isDifferentId = excludeId ? (dept._id || dept.id) !== excludeId : true
        return isSameName && isDifferentId
      })

      setDepartmentNameExists(exists)
      return exists
    } catch (error: unknown) {
      console.error('Error checking department name:', error)
      return false
    } finally {
      setCheckingDepartmentName(false)
    }
  }

  const departmentFormik = useFormik<{ department_name: string }>({
    initialValues: {
      department_name: editingDepartment?.department_name || '',
    },
    validationSchema: departmentSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const exists = await checkDepartmentNameExists(
        values.department_name,
        editingDepartment?._id || editingDepartment?.id
      )

      if (exists) {
        toast.error('Department name already exists!')
        setSubmitting(false)
        return
      }

      setSubmitting(true)
      try {
        if (editingDepartment) {
          await axios.put(
            `${API_URL}/departments/${editingDepartment._id || editingDepartment.id}`,
            { department_name: values.department_name.trim() }
          )

          await Swal.fire({
            icon: 'success',
            title: '<span style="color: #10b981; font-weight: bold;">Updated</span>',
            text: 'Department updated successfully!',
            confirmButtonText: 'OK',
          })
        }

        resetForm()
        setShowEditDepartmentModal(false)
        setEditingDepartment(null)
        setDepartmentNameExists(false)
        await fetchDepartments()
      } catch (error: unknown) {
        console.error('Save department error:', error)
        const errorMessage = (error as ApiError).response?.data?.message || 'Failed to save department'
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonText: 'OK',
        })
      } finally {
        setSubmitting(false)
      }
    },
  })

  const handleEditDepartment = (dept: Department) => {
    setEditingDepartment(dept)
    setDepartmentNameExists(false)
    setShowManageDepartmentsModal(false)
    setShowEditDepartmentModal(true)
  }

  const handleDeleteDepartment = (dept: Department) => {
    setDepartmentToDelete(dept)
    setShowDeleteDepartmentConfirm(true)
  }

  const confirmDeleteDepartment = async () => {
    if (!departmentToDelete) return

    if (usersInDepartment.length > 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Cannot Delete',
        html: `
          <div>
            <p>Cannot delete <strong>"${departmentToDelete.department_name}"</strong></p>
            <p>This department is currently assigned to <strong>${usersInDepartment.length}</strong> employee${usersInDepartment.length !== 1 ? 's' : ''}.</p>
            <hr class="my-3">
            <small class="text-muted">Please reassign or remove those employees first before deleting this department.</small>
          </div>
        `,
        confirmButtonColor: '#d33',
        confirmButtonText: 'OK, I understand',
        customClass: {
          title: 'text-gray-900 text-lg font-semibold',
          htmlContainer: 'text-gray-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md',
        }
      })

      setShowDeleteDepartmentConfirm(false)
      setDepartmentToDelete(null)
      setUsersInDepartment([])
      return
    }

    try {
      const departmentId = departmentToDelete._id || departmentToDelete.id || ''
      await axios.delete(`${API_URL}/departments/${departmentId}`)

      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Department has been deleted successfully.',
        confirmButtonColor: '#3085d6',
        timer: 2000,
        showConfirmButton: false
      })

      await fetchDepartments()

      if (formik.values.department_id === departmentId) {
        formik.setFieldValue('department_id', null)
      }

      setShowDeleteDepartmentConfirm(false)
      setDepartmentToDelete(null)
      setUsersInDepartment([])
    } catch (error: unknown) {
      console.error('Delete department error:', error)
      const errorData = (error as ApiError).response?.data
      const status = (error as ApiError).response?.status

      if (status === 400 && errorData) {
        const message = errorData.message || ''
        const userCount = errorData.userCount
        const departmentName = departmentToDelete.department_name

        if (message.includes('user(s) assigned') ||
          message.includes('Cannot delete department') ||
          (userCount && userCount > 0)) {

          await Swal.fire({
            icon: 'error',
            title: 'Cannot Delete',
            html: `
              <div>
                <p>Cannot delete <strong>"${departmentName}"</strong></p>
                <p>This department is currently assigned to <strong>${userCount}</strong> employee${userCount !== 1 ? 's' : ''}.</p>
                <hr class="my-3">
                <small class="text-muted">Please reassign or remove those employees first before deleting this department.</small>
              </div>
            `,
            confirmButtonColor: '#d33',
            confirmButtonText: 'OK, I understand',
            customClass: {
              title: 'text-gray-900 text-lg font-semibold',
              htmlContainer: 'text-gray-600',
              confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md',
            }
          })
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message || 'Failed to delete department',
            confirmButtonColor: '#d33'
          })
        }
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete department. Please try again.',
          confirmButtonColor: '#d33'
        })
      }

      setShowDeleteDepartmentConfirm(false)
      setDepartmentToDelete(null)
      setUsersInDepartment([])
    }
  }

  const handleAddPosition = () => {
    setEditingPosition(null)
    setShowPositionModal(true)
  }

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position)
    setShowPositionModal(true)
  }

  const handlePositionSuccess = () => {
    fetchAllPositions()
    if (formik.values.department_id && role !== 'supervisor') {
      fetchPositionsByDepartment(formik.values.department_id as string)
    }
  }

  const invalidateUsers = () =>
    queryClient.invalidateQueries([`${QUERIES.USERS_LIST}-${query}`] as QueryKey)

  const createMutation = useMutation(createUser, {
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: '<span style="color: #10b981; font-weight: bold;">User Created</span>',
        text: 'The user has been successfully created.',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        invalidateUsers()
      })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Something went wrong!'

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonText: 'OK',
      })
    },
  })

  const updateMutation = useMutation(updateUser, {
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: '<span style="color: #10b981;">User Updated</span>',
        text: 'The user has been successfully updated.',
        confirmButtonText: 'OK',
      }).then(() => {
        invalidateUsers()
      })
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update user'
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonText: 'OK',
      })
    },
  })

  const isEditMode = !!createMutation.isLoading || !!updateMutation.isLoading || isNotEmpty(formik.values.id)
  const isSubmitting = formik.isSubmitting || createMutation.isLoading || updateMutation.isLoading

  const fieldClass = (name: keyof ExtendedUser) =>
    clsx('form-control form-control-solid', {
      'is-invalid': formik.touched[name] && formik.errors[name],
    })

  const cancel = () => setItemIdForUpdate(undefined)

  const handleDepartmentSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    formik.setFieldValue('department_id', value || null)
    if (value) {
      fetchPositionsByDepartment(value)
    } else {
      setFilteredPositions([])
      formik.setFieldValue('position_id', '')
    }
  }

  const handleSupervisorDepartmentChange = (departmentId: string, checked: boolean) => {
    let newSelected: string[]
    if (checked) {
      newSelected = [...selectedDepartments, departmentId]
    } else {
      newSelected = selectedDepartments.filter(id => id !== departmentId)
    }
    setSelectedDepartments(newSelected)
  }

  return (
    <>
      <form className="form" onSubmit={formik.handleSubmit} noValidate>
        <div className="col-md-4 mb-7">
          <label className="required fw-bold fs-6 mb-2">Date</label>
          <input
            type="date"
            {...formik.getFieldProps('date_of_birth')}
            className={fieldClass('date_of_birth')}
            disabled={isSubmitting || isUserLoading}
          />
          {formik.touched.date_of_birth && formik.errors.date_of_birth && (
            <div className="fv-plugins-message-container">
              <span role="alert" className="fv-help-block">
                {formik.errors.date_of_birth as string}
              </span>
            </div>
          )}
        </div>
        <div className='pd-7'>
          <div className="col-md-4 mb-7">
            <label className="required fw-bold fs-6 mb-2">Start Date</label>
            <input
              type="time"
              {...formik.getFieldProps('date_of_birth')}
              className={fieldClass('date_of_birth')}
              disabled={isSubmitting || isUserLoading}
            />
            {formik.touched.date_of_birth && formik.errors.date_of_birth && (
              <div className="fv-plugins-message-container">
                <span role="alert" className="fv-help-block">
                  {formik.errors.date_of_birth as string}
                </span>
              </div>
            )}
          </div>
          <div className="col-md-4 mb-7">
            <label className="required fw-bold fs-6 mb-2">End Date</label>
            <input
              type="time"
              {...formik.getFieldProps('date_of_birth')}
              className={fieldClass('date_of_birth')}
              disabled={isSubmitting || isUserLoading}
            />
            {formik.touched.date_of_birth && formik.errors.date_of_birth && (
              <div className="fv-plugins-message-container">
                <span role="alert" className="fv-help-block">
                  {formik.errors.date_of_birth as string}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Base Salary (only for employee) */}
        <div className="fv-row mb-7">
          <label className="required fw-bold fs-6 mb-2">Reason</label>
          <div className="rounded-lgtext-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none">
            <input
              type="text"
              
            />
          </div>
        </div>
        {/* Status */}
        <div className="mb-7">
          <label className="required fw-bold fs-6 mb-5">Status</label>
          {['Active', 'Inactive', 'On Leave'].map((s) => {
            const statusId = `status-${s}`
            return (
              <div key={s} className="form-check form-check-custom form-check-solid mb-3">
                <input
                  id={statusId}
                  className="form-check-input"
                  type="radio"
                  value={s}
                  checked={formik.values.status === s}
                  onChange={() => formik.setFieldValue('status', s)}
                />
                <label htmlFor={statusId} className="form-check-label fw-bold text-gray-800">
                  {s}
                </label>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="text-end pt-3">
          <button
            type="button"
            className="btn btn-light me-3"
            onClick={cancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type='submit'
            className='btn btn-primary'
            disabled={formik.isSubmitting || isUserLoading || !formik.isValid}
          >
            <span className='indicator-label'>
              {isEditMode ? 'Update' : 'Create'}
            </span>
            {(formik.isSubmitting || isUserLoading) && (
              <span className='indicator-progress'>
                Please wait...{' '}
                <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
              </span>
            )}
          </button>
          {formik.values.id && (
            <>
              <button
                type="button"
                className="btn btn-primary ms-2"
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </button>

              <ChangePasswordModal
                show={showPasswordModal}
                handleClose={() => setShowPasswordModal(false)}
                formik={formik}
              />
            </>
          )}
        </div>
      </form>

      {/* Manage Departments Modal */}
      {showManageDepartmentsModal && (
        <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className='modal-dialog modal-dialog-centered modal-lg'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>
                  <i className='bi bi-gear me-2'></i>
                  Manage Departments
                </h5>
                <button
                  type='button'
                  className='btn-close'
                  onClick={() => setShowManageDepartmentsModal(false)}
                ></button>
              </div>
              <div className='modal-body'>
                {loadingDepartments ? (
                  <div className='text-center p-10'>
                    <div className='spinner-border text-primary' role='status'>
                      <span className='visually-hidden'>Loading...</span>
                    </div>
                  </div>
                ) : departments.length === 0 ? (
                  <div className='text-center p-10'>
                    <i className='bi bi-inbox fs-3x text-muted mb-4 d-block'></i>
                    <p className='text-muted'>No departments yet</p>
                  </div>
                ) : (
                  <div className='table-responsive'>
                    <table className='table table-row-bordered table-row-gray-300 align-middle gs-0 gy-3'>
                      <thead>
                        <tr className='fw-bold text-muted'>
                          <th className='w-50px'>#</th>
                          <th>Department Name</th>
                          <th className='text-end'>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map((dept, index) => (
                          <tr key={dept._id || dept.id}>
                            <td>
                              <span className='text-gray-800 fw-bold'>{index + 1}</span>
                            </td>
                            <td>
                              <span className='fw-bold fs-6'>{dept.department_name}</span>
                            </td>
                            <td className='text-end'>
                              <button
                                className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                                onClick={() => handleEditDepartment(dept)}
                                title='Edit'
                              >
                                <i className='bi bi-pencil fs-4'></i>
                              </button>
                              <button
                                className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
                                onClick={() => handleDeleteDepartment(dept)}
                                title='Delete'
                              >
                                <i className='bi bi-trash fs-4'></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className='modal-footer'>
                <button
                  type='button'
                  className='btn btn-light'
                  onClick={() => setShowManageDepartmentsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditDepartmentModal && editingDepartment && (
        <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className='modal-dialog modal-dialog-centered'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>Edit Department</h5>
                <button
                  type='button'
                  className='btn-close'
                  onClick={() => {
                    setShowEditDepartmentModal(false)
                    setEditingDepartment(null)
                  }}
                  disabled={departmentFormik.isSubmitting}
                ></button>
              </div>
              <div className='modal-body'>
                <div>
                  <div className='fv-row mb-7'>
                    <label className='required fw-bold fs-6 mb-2'>Department Name</label>
                    <input
                      placeholder='e.g., Engineering, Marketing'
                      value={departmentFormik.values.department_name}
                      onChange={(e) => {
                        departmentFormik.handleChange(e)
                        checkDepartmentNameExists(
                          e.target.value,
                          editingDepartment?._id || editingDepartment?.id
                        )
                      }}
                      onBlur={departmentFormik.handleBlur}
                      name='department_name'
                      type='text'
                      className={clsx(
                        'form-control form-control-solid',
                        {
                          'is-invalid': (departmentFormik.touched.department_name && departmentFormik.errors.department_name) || departmentNameExists
                        },
                        {
                          'is-valid': departmentFormik.touched.department_name && !departmentFormik.errors.department_name && !departmentNameExists && departmentFormik.values.department_name.trim()
                        }
                      )}
                      disabled={departmentFormik.isSubmitting}
                    />

                    {departmentFormik.touched.department_name && departmentFormik.errors.department_name && (
                      <div className='fv-help-block text-danger mt-2'>
                        <i className='bi bi-exclamation-circle me-1'></i>
                        {departmentFormik.errors.department_name}
                      </div>
                    )}

                    {departmentNameExists && !departmentFormik.errors.department_name && (
                      <div className='fv-help-block text-danger mt-2'>
                        <i className='bi bi-exclamation-triangle-fill me-1'></i>
                        <strong>Department name already exists!</strong> Please use a different name.
                      </div>
                    )}

                    {checkingDepartmentName && (
                      <div className='text-muted mt-2'>
                        <span className='spinner-border spinner-border-sm me-2'></span>
                        Checking availability...
                      </div>
                    )}

                    {!departmentNameExists &&
                      !departmentFormik.errors.department_name &&
                      !checkingDepartmentName &&
                      departmentFormik.values.department_name.trim() &&
                      departmentFormik.touched.department_name && (
                        <div className='fv-help-block text-success mt-2'>
                          <i className='bi bi-check-circle-fill me-1'></i>
                          Department name is available
                        </div>
                      )}
                  </div>

                  <div className='text-center pt-3'>
                    <button
                      type='button'
                      onClick={() => {
                        setShowEditDepartmentModal(false)
                        setEditingDepartment(null)
                        setDepartmentNameExists(false)
                      }}
                      className='btn btn-light me-3'
                      disabled={departmentFormik.isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      onClick={() => departmentFormik.handleSubmit()}
                      className='btn btn-primary'
                      disabled={
                        departmentFormik.isSubmitting ||
                        !departmentFormik.isValid ||
                        departmentNameExists ||
                        checkingDepartmentName ||
                        !departmentFormik.values.department_name.trim()
                      }
                    >
                      {departmentFormik.isSubmitting ? (
                        <>
                          <span className='spinner-border spinner-border-sm me-2'></span>
                          Updating...
                        </>
                      ) : (
                        'Update Department'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Department Confirmation Modal */}
      {showDeleteDepartmentConfirm && departmentToDelete && (
        <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1070 }}>
          <div className='modal-dialog modal-dialog-centered'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>
                  <i className='bi bi-exclamation-triangle text-danger me-2'></i>
                  Confirm Delete
                </h5>
                <button
                  type='button'
                  className='btn-close'
                  onClick={() => setShowDeleteDepartmentConfirm(false)}
                ></button>
              </div>
              <div className='modal-body'>
                <div className='text-center py-4'>
                  <div className='symbol symbol-100px symbol-circle mb-5'>
                    <div className='symbol-label bg-light-danger'>
                      <i className='bi bi-trash fs-2x text-danger'></i>
                    </div>
                  </div>
                  <h4 className='fw-bold text-gray-900 mb-3'>
                    Delete Department?
                  </h4>
                  <p className='text-muted mb-3'>
                    Are you sure you want to delete:
                  </p>
                  <div className='badge badge-light-primary px-4 py-3 fs-5 mb-4'>
                    {departmentToDelete.department_name}
                  </div>
                  <div className='alert alert-warning'>
                    <i className='bi bi-exclamation-triangle me-2'></i>
                    This action cannot be undone. Users in this department may be affected.
                  </div>
                </div>
              </div>
              <div className='modal-footer'>
                <button
                  type='button'
                  className='btn btn-light'
                  onClick={() => setShowDeleteDepartmentConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className='btn btn-danger'
                  onClick={confirmDeleteDepartment}
                >
                  <i className='bi bi-trash me-2'></i>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Position Modal */}
      {showPositionModal && (
        <PositionModal
          show={showPositionModal}
          onClose={() => setShowPositionModal(false)}
          onSuccess={handlePositionSuccess}
          editingPosition={editingPosition}
          selectedDepartmentId={formik.values.department_id as string}
        />
      )}

      {isSubmitting && <UsersListLoading />}
    </>
  )
}

interface PositionModalProps {
  show: boolean
  onClose: () => void
  onSuccess: () => void
  editingPosition: Position | null
  selectedDepartmentId: string
}

const PositionModal: FC<PositionModalProps> = ({
  show,
  onClose,
  onSuccess,
  editingPosition,
  selectedDepartmentId
}) => {
  const [positionName, setPositionName] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])

  const API_URL = import.meta.env.VITE_APP_API_URL

  useEffect(() => {
    if (show) {
      fetchDepartments()
      if (editingPosition) {
        setPositionName(editingPosition.position_name)
        setSelectedDepartment(editingPosition.department_id)
      } else {
        setPositionName('')
        setSelectedDepartment(selectedDepartmentId || '')
      }
    }
  }, [show, editingPosition, selectedDepartmentId])

  const fetchDepartments = async () => {
    try {
      const res = await axios.get<{ data: Department[] }>(`${API_URL}/departments`)
      setDepartments(res.data.data)
    } catch (err: unknown) {
      console.error('Error fetching departments', err)
      toast.error('Unable to load departments')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!selectedDepartment) {
      toast.error('Please select a department first!')
      return
    }

    if (!positionName.trim()) {
      toast.error('Please enter position name!')
      return
    }

    setLoading(true)

    try {
      if (editingPosition) {
        await axios.put(
          `${API_URL}/positions/${editingPosition._id || editingPosition.id}`,
          {
            position_name: positionName.trim(),
            department_id: selectedDepartment
          }
        )
        toast.success('Position updated successfully!')
      } else {
        await axios.post(`${API_URL}/positions`, {
          position_name: positionName.trim(),
          department_id: selectedDepartment
        })
        toast.success('Position created successfully!')
      }

      onSuccess()
      onClose()
    } catch (error: unknown) {
      console.error('Position operation error:', error)
      const errorMessage = (error as ApiError).response?.data?.message || 'Failed to save position'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1080 }}>
      <div className='modal-dialog modal-dialog-centered'>
        <div className='modal-content'>
          <div className='modal-header'>
            <h5 className='modal-title'>
              <i className='bi bi-briefcase me-2'></i>
              {editingPosition ? 'Edit Position' : 'Create New Position'}
            </h5>
            <button
              type='button'
              className='btn-close'
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className='modal-body'>
              <div className='fv-row mb-7'>
                <label className='required fw-bold fs-6 mb-2'>Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  disabled={!!editingPosition || loading}
                  className='form-control form-control-solid'
                >
                  <option value=''>Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id || dept.id} value={dept._id || dept.id || ''}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='fv-row mb-7'>
                <label className='required fw-bold fs-6 mb-2'>Position Name</label>
                <input
                  type='text'
                  value={positionName}
                  onChange={(e) => setPositionName(e.target.value)}
                  placeholder='e.g., Senior Developer, Marketing Manager'
                  className='form-control form-control-solid'
                  disabled={loading}
                />
              </div>
            </div>
            <div className='modal-footer'>
              <button
                type='button'
                className='btn btn-light'
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type='submit'
                className='btn btn-primary'
                disabled={loading || !positionName.trim() || !selectedDepartment}
              >
                {loading ? (
                  <>
                    <span className='spinner-border spinner-border-sm me-2'></span>
                    Processing...
                  </>
                ) : editingPosition ? (
                  'Update Position'
                ) : (
                  'Create Position'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  )
}


export { UserEditModalForm }