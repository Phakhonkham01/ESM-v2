/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useContext, useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import {
  createResponseContext,
  initialQueryResponse,
  initialQueryState,
  PaginationState,
  QUERIES,
  stringifyRequestQuery,
  WithChildren,
} from '../../../../../../_metronic/helpers'
import { getRequests } from './_requests'
import { RequestOTFieldWork, formatRequestOTFieldWorkArray, FormattedRequestOTFieldWork } from './_models'
import { useQueryRequest } from './QueryRequestProvider'

const REQUEST_OT_QUERY_KEY = QUERIES.REQUEST_OT_FIELD_WORK_LIST || 'REQUEST_OT_FIELD_WORK_LIST'

// ✅ Changed to use FormattedRequestOTFieldWork instead of RequestOTFieldWork
const QueryResponseContext = createResponseContext<FormattedRequestOTFieldWork>(initialQueryResponse)

const QueryResponseProvider: FC<WithChildren> = ({ children }) => {
  const { state } = useQueryRequest()
  const [query, setQuery] = useState<string>(stringifyRequestQuery(state))
  const updatedQuery = useMemo(() => stringifyRequestQuery(state), [state])

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
    `${REQUEST_OT_QUERY_KEY}-${query}`,
    async () => {
      // Extract filter values from state
      const filter = state.filter as Record<string, string> | undefined

      const result = await getRequests({
        search: state.search,
        year: filter?.year,
        month: filter?.month,
        department: filter?.department,
        status: filter?.status,
        page: state.page,
        limit: state.items_per_page,
      })

      // ✅ Format the data before returning
      const formattedData = formatRequestOTFieldWorkArray(result.data || [])

      return {
        ...result,
        data: formattedData
      }
    },
    { 
      cacheTime: 0, 
      keepPreviousData: true, 
      refetchOnWindowFocus: false 
    }
  )

  return (
    <QueryResponseContext.Provider value={{ isLoading: isFetching, refetch, response, query }}>
      {children}
    </QueryResponseContext.Provider>
  )
}

const useQueryResponse = () => useContext(QueryResponseContext)

const useQueryResponseData = () => {
  const { response } = useQueryResponse()
  if (!response) {
    return []
  }

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