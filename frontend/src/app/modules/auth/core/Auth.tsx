/* eslint-disable react-refresh/only-export-components */
import {FC, useState, useEffect, createContext, useContext, Dispatch, SetStateAction} from 'react'
import {LayoutSplashScreen} from '../../../../_metronic/layout/core'
import {AuthModel, UserModel} from './_models'
import * as authHelper from './AuthHelpers'
import {WithChildren} from '../../../../_metronic/helpers'

type AuthContextProps = {
  auth: AuthModel | undefined
  saveAuth: (auth: AuthModel | undefined) => void
  currentUser: UserModel | undefined
  setCurrentUser: Dispatch<SetStateAction<UserModel | undefined>>
  logout: () => void
}

const initAuthContextPropsState = {
  auth: authHelper.getAuth(),
  currentUser: undefined,
  saveAuth: () => {},
  setCurrentUser: () => {},
  logout: () => {},
}

const AuthContext = createContext<AuthContextProps>(initAuthContextPropsState)

const useAuth = () => {
  return useContext(AuthContext)
}

// ✅ เก็บแค่ตัวนี้ตัวเดียว (ลบตัวแรกออก)
const AuthProvider: FC<WithChildren> = ({children}) => {
  const [auth, setAuth] = useState<AuthModel | undefined>(authHelper.getAuth())
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>(() => {
    // ✅ สำคัญ: ต้อง restore user ตั้งแต่ initial state
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        console.log('✅ [AuthProvider] User restored from localStorage:', user)
        return user
      } catch (error) {
        console.error('❌ [AuthProvider] Error parsing stored user:', error)
        localStorage.removeItem('user')
      }
    }
    return undefined
  })
  
  const saveAuth = (auth: AuthModel | undefined) => {
    setAuth(auth)
    if (auth) {
      authHelper.setAuth(auth)
      console.log('💾 [AuthProvider] Auth saved')
    } else {
      authHelper.removeAuth()
      console.log('🗑️ [AuthProvider] Auth removed')
    }
  }

  const logout = () => {
    console.log('🚪 [AuthProvider] Logging out...')
    saveAuth(undefined)
    setCurrentUser(undefined)
    localStorage.removeItem('user')
    console.log('✅ [AuthProvider] Logout complete')
  }

  return (
    <AuthContext.Provider value={{auth, saveAuth, currentUser, setCurrentUser, logout}}>
      {children}
    </AuthContext.Provider>
  )
}

const AuthInit: FC<WithChildren> = ({children}) => {
  const {auth, currentUser, logout} = useAuth()
  const [showSplashScreen, setShowSplashScreen] = useState(true)

  useEffect(() => {
    console.log('🔍 [AuthInit] Starting...')
    console.log('🔍 [AuthInit] Auth:', auth)
    console.log('🔍 [AuthInit] CurrentUser:', currentUser)

    // ✅ เช็คว่ามีทั้ง auth และ currentUser หรือไม่
    if (!auth || !auth.token) {
      console.log('⚠️ [AuthInit] No auth token found')
      logout()
      setShowSplashScreen(false)
      return
    }

    if (!currentUser) {
      console.log('⚠️ [AuthInit] No user found')
      logout()
      setShowSplashScreen(false)
      return
    }

    console.log('✅ [AuthInit] User authenticated successfully')
    setShowSplashScreen(false)
    // eslint-disable-next-line
  }, [])

  return showSplashScreen ? <LayoutSplashScreen /> : <>{children}</>
}

export {AuthProvider, AuthInit, useAuth}