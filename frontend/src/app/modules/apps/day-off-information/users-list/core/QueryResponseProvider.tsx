/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/exhaustive-deps */
import {FC, useContext, useState, useEffect, useMemo} from 'react'
import {useQuery} from 'react-query'
import {
  createResponseContext,
  initialQueryResponse,
  initialQueryState,
  PaginationState,
  QUERIES,
  stringifyRequestQuery,
  WithChildren,
} from '../../../../../../_metronic/helpers'
import {getFilteredDayOffRequests} from './_requests'
import {DayOffRequest} from './_models'
import {useQueryRequest} from './QueryRequestProvider'

const DAY_OFF_QUERY_KEY = QUERIES.DAY_OFF_REQUESTS_LIST || 'DAY_OFF_REQUESTS_LIST'

const QueryResponseContext = createResponseContext<DayOffRequest>(initialQueryResponse)

const QueryResponseProvider: FC<WithChildren> = ({children}) => {
  const {state} = useQueryRequest()
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
    `${DAY_OFF_QUERY_KEY}-${query}`,
    () => {
      // Extract filter values from state
      const filter = state.filter as Record<string, string> | undefined

      console.log('🔍 Fetching with filters:', {
        search: state.search,
        year: filter?.year,
        month: filter?.month,
        department: filter?.department,
        status: filter?.status,
        page: state.page,
        items_per_page: state.items_per_page,
      })

      return getFilteredDayOffRequests({
        search: state.search,
        year: filter?.year,
        month: filter?.month,
        department: filter?.department,
        status: filter?.status,
        page: state.page,
        limit: state.items_per_page,
      })
    },
    {cacheTime: 0, keepPreviousData: true, refetchOnWindowFocus: false}
  )

  return (
    <QueryResponseContext.Provider value={{isLoading: isFetching, refetch, response, query}}>
      {children}
    </QueryResponseContext.Provider>
  )
}

const useQueryResponse = () => useContext(QueryResponseContext)

const useQueryResponseData = () => {
  const {response} = useQueryResponse()
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

  const {response} = useQueryResponse()
  if (!response || !response.payload || !response.payload.pagination) {
    return defaultPaginationState
  }

  return response.payload.pagination
}

const useQueryResponseLoading = (): boolean => {
  const {isLoading} = useQueryResponse()
  return isLoading
}

export {
  QueryResponseProvider,
  useQueryResponse,
  useQueryResponseData,
  useQueryResponsePagination,
  useQueryResponseLoading,
}