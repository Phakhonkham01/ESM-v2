import { FC, useContext, useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import {
  createResponseContext,
  initialQueryResponse,
  QUERIES,
  stringifyRequestQuery,
  WithChildren,
} from '../../../../../../_metronic/helpers'
import { getRequestsBySupervisor } from './_requests'
import { RequestData } from './_models'
import { useQueryRequest } from './QueryRequestProvider'

// ต้องใช้ RequestData[][] ตามที่ Metronic กำหนด
const QueryResponseContext = createResponseContext<RequestData[]>(initialQueryResponse)

const QueryResponseProvider: FC<WithChildren> = ({ children }) => {
  const { state } = useQueryRequest()
  const [query, setQuery] = useState<string>(stringifyRequestQuery(state))
  const updatedQuery = useMemo(() => stringifyRequestQuery(state), [state])

  // Get supervisor ID from localStorage - แก้ไขตามโครงสร้างที่เห็น
  const getSupervisorId = (): string => {
    console.log('🔍 DEBUG - Getting supervisor ID...')
    
    // ลองหาในหลายๆ key
    const possibleKeys = [
      'auth', // อาจเก็บแบบเดิม
      'user', // อาจเก็บใน key user
      'userData', // หรือ key อื่น
      'currentUser', // หรือ key อื่น
    ]
    
    // ตรวจสอบทุก key
    for (const key of possibleKeys) {
      const data = localStorage.getItem(key)
      if (data) {
        console.log(`🔍 Found data in key "${key}":`, data.substring(0, 100) + '...')
        try {
          const parsed = JSON.parse(data)
          console.log(`🔍 Parsed data from "${key}":`, parsed)
          
          // ลองหาด้วยหลาย path
          const possibleIdPaths = [
            parsed._id, // ตรงจาก object
            parsed.id, // หรือเป็น id
            parsed.user?._id, // หรือ nested ใน user
            parsed.user?.id,
            parsed.data?._id, // หรือ nested ใน data
            parsed.data?.id,
          ]
          
          const foundId = possibleIdPaths.find(id => id && typeof id === 'string')
          if (foundId) {
            console.log(`✅ Found supervisor ID in key "${key}": ${foundId}`)
            return foundId
          }
        } catch (error) {
          console.error(`🔍 Error parsing data from "${key}":`, error)
        }
      }
    }
    
    // ถ้าไม่พบใน key ที่กำหนด ลองดูว่า localStorage มี key อะไรบ้าง
    console.log('🔍 All localStorage keys:', Object.keys(localStorage))
    
    // ลองดึงจาก key ที่มี token หรือมีข้อมูล user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('user') || key.includes('auth') || key.includes('token'))) {
        const data = localStorage.getItem(key)
        if (data && data.includes('_id')) {
          console.log(`🔍 Checking key "${key}"...`)
          try {
            const parsed = JSON.parse(data)
            if (parsed._id) {
              console.log(`✅ Found supervisor ID in unexpected key "${key}": ${parsed._id}`)
              return parsed._id
            }
          } catch (error) {
            // ไม่ต้องทำอะไร
          }
        }
      }
    }
    
    console.warn('⚠️ No supervisor ID found in localStorage')
    return ''
  }

  const supervisorId = getSupervisorId()
  console.log('🔍 DEBUG - Final supervisorId:', supervisorId)

  useEffect(() => {
    if (query !== updatedQuery) {
      setQuery(updatedQuery)
    }
  }, [updatedQuery])

  const {
    isFetching,
    refetch,
    data: apiResponse,
    error,
    status
  } = useQuery(
    `${QUERIES.USERS_LIST}-supervisor-requests-${supervisorId}`,
    () => {
      console.log('🔍 DEBUG - Fetching requests for supervisor:', supervisorId)
      return getRequestsBySupervisor(supervisorId)
    },
    {
      cacheTime: 0,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      enabled: !!supervisorId,
      onSuccess: (data) => {
        console.log('✅ DEBUG - Fetch successful:', {
          dataLength: data?.data?.length || 0,
          data: data?.data
        })
      },
      onError: (err: any) => {
        console.error('❌ DEBUG - Fetch error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        })
      }
    }
  )

  console.log('🔍 DEBUG - useQuery state:', {
    isFetching,
    status,
    error: error?.message,
    apiResponse,
    hasSupervisorId: !!supervisorId,
    enabled: !!supervisorId
  })

  // แปลง response ให้มีโครงสร้างเดียวกับ user-management
  const response = useMemo(() => {
    console.log('🔍 DEBUG - Transforming response...', {
      hasApiResponse: !!apiResponse,
      apiResponse
    })
    
    if (!apiResponse) {
      console.log('🔍 DEBUG - No apiResponse, using initial')
      return initialQueryResponse
    }
    
    const transformed = {
      ...apiResponse,
      data: apiResponse.data ? [apiResponse.data] : []
    }
    
    console.log('🔍 DEBUG - Transformed response:', {
      originalDataLength: apiResponse.data?.length || 0,
      transformedDataLength: transformed.data[0]?.length || 0,
      transformed
    })
    
    return transformed
  }, [apiResponse])

  return (
    <QueryResponseContext.Provider
      value={{
        isLoading: isFetching,
        refetch,
        response,
        query,
      }}
    >
      {children}
    </QueryResponseContext.Provider>
  )
}
const useQueryResponse = () => useContext(QueryResponseContext)

const useQueryResponseData = (): RequestData[] => {
  const { response } = useQueryResponse()
  if (!response || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
    return []
  }
  // response.data เป็น RequestData[][] ดังนั้นต้องดึงออกมาเป็น RequestData[]
  return response.data[0] || []
}

const useQueryResponseLoading = (): boolean => {
  const { isLoading } = useQueryResponse()
  return isLoading
}

export {
  QueryResponseProvider,
  useQueryResponse,
  useQueryResponseData,
  useQueryResponseLoading,
}