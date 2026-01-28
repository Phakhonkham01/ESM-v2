/* eslint-disable @typescript-eslint/no-explicit-any */
import {AuthModel} from './_models'

const AUTH_LOCAL_STORAGE_KEY = 'kt-auth-react-v'

const getAuth = (): AuthModel | undefined => {
  if (!localStorage) {
    console.log('❌ localStorage not available')
    return
  }

  const lsValue: string | null = localStorage.getItem(AUTH_LOCAL_STORAGE_KEY)
  console.log('🔍 Raw auth from localStorage:', lsValue) // ✅ เพิ่ม debug
  
  if (!lsValue) {
    console.log('⚠️ No auth found in localStorage')
    return
  }

  try {
    const auth: AuthModel = JSON.parse(lsValue) as AuthModel
    console.log('✅ Parsed auth:', auth) // ✅ เพิ่ม debug
    console.log('🔑 Token exists?', !!auth.token) // ✅ เพิ่ม debug
    
    if (auth) {
      return auth
    }
  } catch (error) {
    console.error('❌ AUTH LOCAL STORAGE PARSE ERROR', error)
  }
}

const setAuth = (auth: AuthModel) => {
  if (!localStorage) {
    console.log('❌ localStorage not available for setAuth')
    return
  }

  try {
    const lsValue = JSON.stringify(auth)
    console.log('💾 Saving auth to localStorage:', {
      key: AUTH_LOCAL_STORAGE_KEY,
      hasToken: !!auth.token,
      auth: auth
    }) // ✅ เพิ่ม debug
    
    localStorage.setItem(AUTH_LOCAL_STORAGE_KEY, lsValue)
    
    // ✅ ตรวจสอบว่าบันทึกสำเร็จหรือไม่
    const saved = localStorage.getItem(AUTH_LOCAL_STORAGE_KEY)
    console.log('✅ Verify saved auth:', saved ? 'Success' : 'Failed')
  } catch (error) {
    console.error('❌ AUTH LOCAL STORAGE SAVE ERROR', error)
  }
}

const removeAuth = () => {
  if (!localStorage) {
    console.log('❌ localStorage not available for removeAuth')
    return
  }

  try {
    console.log('🗑️ Removing auth from localStorage:', AUTH_LOCAL_STORAGE_KEY) // ✅ เพิ่ม debug
    localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY)
    
    // ✅ ตรวจสอบว่าลบสำเร็จหรือไม่
    const stillExists = localStorage.getItem(AUTH_LOCAL_STORAGE_KEY)
    console.log('✅ Verify removed auth:', stillExists ? 'Still exists!' : 'Removed successfully')
  } catch (error) {
    console.error('❌ AUTH LOCAL STORAGE REMOVE ERROR', error)
  }
}

export function setupAxios(axios: any) {
  axios.defaults.headers.Accept = 'application/json'
  axios.interceptors.request.use(
    (config: any) => {
      const auth = getAuth()
      console.log('🔍 Axios Interceptor - Auth:', auth) // Debug
      
      if (auth && auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`
        console.log('✅ Axios - Added token to request') // Debug
      } else {
        console.log('⚠️ Axios - No token found') // Debug
      }

      return config
    },
    (err: any) => Promise.reject(err)
  )
}

export {getAuth, setAuth, removeAuth, AUTH_LOCAL_STORAGE_KEY}