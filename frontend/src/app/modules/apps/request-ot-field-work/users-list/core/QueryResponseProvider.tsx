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
  const [query, setQuery] = useState(stringifyRequestQuery(state))
  const updatedQuery = useMemo(() => stringifyRequestQuery(state), [state])

  // ✅ Get supervisor ID from localStorage
  const getSupervisorId = (): string => {
    const authData = localStorage.getItem('auth')
    if (authData) {
      const auth = JSON.parse(authData)
      return auth.user?._id || ''
    }
    return ''
  }

  const supervisorId = getSupervisorId()

  useEffect(() => {
    if (query !== updatedQuery) {
      setQuery(updatedQuery)
    }
  }, [updatedQuery])

  const {
    isFetching,
    refetch,
    data: response,
  } = useQuery(
    `${QUERIES.USERS_LIST}-supervisor-requests-${supervisorId}`,
    () => getRequestsBySupervisor(supervisorId),
    {
      cacheTime: 0,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      enabled: !!supervisorId, // ✅ Only fetch if supervisorId exists
    }
  )

  return (
    <QueryResponseContext.Provider
      value={{
        isLoading: isFetching,
        refetch,
        response: {
          ...response,
          data: response?.data ? [response.data] : []
        },
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