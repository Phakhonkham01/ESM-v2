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

const QueryResponseContext = createResponseContext<RequestData>(initialQueryResponse)

const QueryResponseProvider: FC<WithChildren> = ({ children }) => {
  const { state } = useQueryRequest()
  const [query, setQuery] = useState<string>(stringifyRequestQuery(state))
  const updatedQuery = useMemo(() => stringifyRequestQuery(state), [state])

  const getSupervisorId = () => {
    const authData = localStorage.getItem('user')
    console.log('🔍 Raw authData:', authData)
    
    if (authData) {
      try {
        const auth = JSON.parse(authData)
        console.log('🔍 Parsed auth:', auth)
        
        // ✅ แก้ตรงนี้ - รองรับทั้ง 2 รูปแบบ
        const supervisorId = auth.user?._id || auth._id || ''
        
        console.log('🎯 supervisorId:', supervisorId)
        return supervisorId
      } catch (error) {
        console.error('❌ Error parsing auth:', error)
        return ''
      }
    }
    
    console.warn('⚠️ No auth in localStorage')
    return ''
  }

  const supervisorId = getSupervisorId()
  console.log('🎯 Final supervisorId:', supervisorId)

  useEffect(() => {
    if (query !== updatedQuery) {
      setQuery(updatedQuery)
    }
  }, [updatedQuery])

  const {
    isFetching,
    refetch,
    data: response,
    error,
  } = useQuery(
    `${QUERIES.USERS_LIST}-supervisor-requests-${supervisorId}`,
    () => {
      console.log('🚀 Calling API with supervisorId:', supervisorId)
      return getRequestsBySupervisor(supervisorId)
    },
    {
      cacheTime: 0,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      enabled: !!supervisorId, // ✅ ต้องมี supervisorId ถึงจะ fetch
      onSuccess: (data) => {
        console.log('✅ Data fetched successfully:', data)
      },
      onError: (err: any) => {
        console.error('❌ Error fetching data:', err)
        console.error('❌ Error details:', err.response?.data)
      },
    }
  )

  console.log('📊 Current response:', response)
  console.log('📊 Is loading:', isFetching)
  console.log('📊 Error:', error)

  return (
    <QueryResponseContext.Provider value={{ isLoading: isFetching, refetch, response, query }}>
      {children}
    </QueryResponseContext.Provider>
  )
}

const useQueryResponse = () => useContext(QueryResponseContext)

const useQueryResponseData = () => {
  const { response } = useQueryResponse()
  console.log('🔍 useQueryResponseData - response:', response)
  
  if (!response) {
    console.log('⚠️ No response')
    return []
  }
  
  const data = response?.data || []
  console.log('🔍 useQueryResponseData - data:', data)
  return data
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