/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useContext, useState, useEffect, useMemo, createContext } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import {
  createResponseContext,
  initialQueryResponse,
  initialQueryState,
  PaginationState,
  QUERIES,
  stringifyRequestQuery,
  WithChildren,
} from '../../../../../../_metronic/helpers'
import { getAllDayOffRequests } from './_requests'
import { DayOffRequest } from './_models'
import { useQueryRequest } from './QueryRequestProvider'

// Key สำหรับ query
const DAY_OFF_QUERY_KEY = QUERIES.DAY_OFF_REQUESTS_LIST || 'DAY_OFF_REQUESTS_LIST'

// สร้าง context สำหรับ response
const QueryResponseContext = createResponseContext<DayOffRequest>(initialQueryResponse)

const QueryResponseProvider: FC<WithChildren> = ({ children }) => {
  const { state } = useQueryRequest()
  const [query, setQuery] = useState<string>(stringifyRequestQuery(state))
  const updatedQuery = useMemo(() => stringifyRequestQuery(state), [state])
  const queryClient = useQueryClient() // ✅ สำหรับ refresh data

  useEffect(() => {
    if (query !== updatedQuery) {
      setQuery(updatedQuery)
    }
  }, [updatedQuery])

  const { isFetching, refetch, data: response } = useQuery(
    `${DAY_OFF_QUERY_KEY}-${query}`,
    () => getAllDayOffRequests(state),
    {
      cacheTime: 0,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  )

  // ✅ function สำหรับ refresh data จากภายนอก
  const refresh = async () => {
    await queryClient.invalidateQueries(`${DAY_OFF_QUERY_KEY}-${query}`)
    await refetch()
  }

  return (
    <QueryResponseContext.Provider value={{ isLoading: isFetching, refetch: refresh, response, query }}>
      {children}
    </QueryResponseContext.Provider>
  )
}

const useQueryResponse = () => useContext(QueryResponseContext)

const useQueryResponseData = () => {
  const { response } = useQueryResponse()
  if (!response) return []
  return response?.data || []
}

const useQueryResponsePagination = () => {
  const defaultPaginationState: PaginationState = {
    links: [],
    ...initialQueryState,
  }

  const { response } = useQueryResponse()
  if (!response || !response.payload || !response.payload.pagination) {
    return defaultPaginationState
  }

  return response.payload.pagination
}

const useQueryResponseLoading = (): boolean => {
  const { isLoading } = useQueryResponse()
  return isLoading
}

export {
  QueryResponseProvider,
  useQueryResponse,
  useQueryResponseData,
  useQueryResponsePagination,
  useQueryResponseLoading,
}