import {useMemo, useEffect, useState} from 'react'
import {useTable, ColumnInstance, Row} from 'react-table'
import {CustomHeaderColumn} from './columns/CustomHeaderColumn'
import {CustomRow} from './columns/CustomRow'
import {useQueryRequest} from '../core/QueryRequestProvider'
import {EventsListLoading} from '../components/loading/EventsListLoading'
import {KTCardBody} from '../../../../../../_metronic/helpers'
import {useAuth} from '../../../../auth'
import {ViewDetailModal} from '../table/columns/Viewdetail'
import {HolidayViewModal} from '../table/columns/holidayView'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_API_URL || 'http://localhost:8000/api'

// ✅ Combined type for Events and Holidays
type CombinedItem = {
  _id: string
  type: 'event' | 'holiday' // ✅ แยกประเภท
  name: string
  event_type_id?: any
  holiday_type?: string
  start_date: string
  end_date: string
  status: string
  description?: string
  // Original data
  originalData: any
}

const UsersTable = () => {
  const {currentUser} = useAuth()
  const {state} = useQueryRequest()
  const [combinedData, setCombinedData] = useState<CombinedItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // ✅ Modal states
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedHolidayId, setSelectedHolidayId] = useState<string | null>(null)
  
  // ✅ Fetch both events and holidays
  const fetchData = async () => {
    if (!currentUser) return
    
    setIsLoading(true)
    try {
      const localStorageUserId = currentUser._id
      const userRole = currentUser.role?.toLowerCase()
      
      console.log('🔄 Fetching events and holidays...')
      
      // Fetch events
      const eventsResponse = await axios.get(`${API_URL}/events`, {
        params: {
          role: currentUser.role,
          user_id: localStorageUserId
        }
      })
      
      // Fetch holidays
      const holidaysResponse = await axios.get(`${API_URL}/holidays`)
      
      const events = eventsResponse.data.data || []
      const holidays = holidaysResponse.data.data || []
      
      console.log('📊 Fetched:', {
        events: events.length,
        holidays: holidays.length
      })
      
      // ✅ Transform events
      const transformedEvents: CombinedItem[] = events.map((event: any) => ({
        _id: event._id || event.id,
        type: 'event' as const,
        name: event.event_name,
        event_type_id: event.event_type_id,
        start_date: event.start_date,
        end_date: event.end_date,
        status: event.status,
        description: event.description,
        originalData: event
      }))
      
      // ✅ Transform holidays
      const transformedHolidays: CombinedItem[] = holidays.map((holiday: any) => ({
        _id: holiday._id || holiday.id,
        type: 'holiday' as const,
        name: holiday.holiday_name,
        holiday_type: holiday.holiday_type,
        start_date: holiday.start_date,
        end_date: holiday.end_date,
        status: holiday.status || 'approved',
        description: holiday.description,
        originalData: holiday
      }))
      
      // ✅ Role-based filtering for events
      let filteredEvents = transformedEvents
      
      if (userRole === 'employee') {
        filteredEvents = transformedEvents.filter((item) => {
          const event = item.originalData
          if (!event.person_in_charge || !Array.isArray(event.person_in_charge)) {
            return false
          }
          
          const participant = event.person_in_charge.find((person: any) => {
            let personId = ''
            if (person && typeof person === 'object' && person.user_id) {
              personId = person.user_id._id || person.user_id.id || person.user_id
            } else if (typeof person === 'string') {
              personId = person
            } else if (person && typeof person === 'object') {
              personId = person._id || person.id
            }
            return personId === localStorageUserId
          })
          
          if (!participant) return false
          
          if (!event.require_participation_response) return true
          
          const participationStatus = participant.participation_status || 'not_required'
          return participationStatus === 'accepted' || 
                 participationStatus === 'pending' || 
                 participationStatus === 'not_required'
        })
      }
      
      // ✅ Combine and sort by start_date
      const combined = [...filteredEvents, ...transformedHolidays].sort((a, b) => {
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      })
      
      console.log('✅ Combined data:', combined.length)
      setCombinedData(combined)
      
    } catch (error) {
      console.error('❌ Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentUser])
  
  // ✅ Filter data based on search, type, and status
  const filteredData = useMemo(() => {
    let filtered = [...combinedData]
    
    // Search filter
    const searchTerm = state.search?.toLowerCase() || ''
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const name = item.name?.toLowerCase() || ''
        return name.includes(searchTerm)
      })
    }
    
    // Get filter object with proper typing
    const filter = state.filter as any
    
    // Type filter (event/holiday)
    if (filter?.item_type) {
      filtered = filtered.filter((item) => item.type === filter.item_type)
    }
    
    // Status filter
    if (filter?.status) {
      filtered = filtered.filter((item) => item.status === filter.status)
    }
    
    // Event Type filter (only for events)
    if (filter?.event_type) {
      filtered = filtered.filter((item) => {
        if (item.type !== 'event') return false
        
        const eventType = item.event_type_id
        if (typeof eventType === 'object' && eventType?.event_type_name) {
          return eventType.event_type_name === filter.event_type
        }
        return false
      })
    }
    
    // Holiday Type filter (only for holidays)
    if (filter?.holiday_type) {
      filtered = filtered.filter((item) => {
        if (item.type !== 'holiday') return false
        return item.holiday_type?.toLowerCase() === filter.holiday_type?.toLowerCase()
      })
    }
    
    return filtered
  }, [combinedData, state.search, state.filter])
  
  const data = useMemo(() => filteredData, [filteredData])
  
  // ✅ Custom columns for combined data
  const columns = useMemo(() => [
    {
      Header: () => <th className="min-w-50px text-center">No</th>,
      id: 'no',
      Cell: ({ row }: any) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      Header: () => <th className="min-w-100px">Type</th>,
      id: 'item_type',
      Cell: ({ row }: any) => {
        const item = row.original as CombinedItem
        return item.type === 'event' ? (
          <span className="badge badge-light-primary fw-bold">
            <i className="bi bi-calendar-event me-1"></i>
            Event
          </span>
        ) : (
          <span className="badge badge-light-info fw-bold">
            <i className="bi bi-calendar-check me-1"></i>
            Holiday
          </span>
        )
      },
    },
    {
      Header: () => <th className="min-w-150px">Name</th>,
      id: 'name',
      Cell: ({ row }: any) => {
        const item = row.original as CombinedItem
        return <div className="fw-bold">{item.name}</div>
      },
    },
    {
      Header: () => <th className="min-w-125px">Category</th>,
      id: 'category',
      Cell: ({ row }: any) => {
        const item = row.original as CombinedItem
        
        if (item.type === 'event' && item.event_type_id) {
          const eventType = item.event_type_id
          if (typeof eventType === 'object') {
            return (
              <div 
                className="badge fw-bolder px-3 py-2"
                style={{ 
                  backgroundColor: eventType.event_type_color || '#6c757d',
                  color: '#fff'
                }}
              >
                {eventType.event_type_name || 'Unknown'}
              </div>
            )
          }
        }
        
        if (item.type === 'holiday' && item.holiday_type) {
          const typeConfig: Record<string, { label: string; color: string }> = {
            'public': { label: 'Public Holiday', color: 'success' },
            'public holiday': { label: 'Public Holiday', color: 'success' },
            'private': { label: 'Leave Day', color: 'danger' },
            'leave day': { label: 'Leave Day', color: 'danger' }
          }
          
          const config = typeConfig[item.holiday_type.toLowerCase()] || { 
            label: item.holiday_type, 
            color: 'secondary' 
          }
          
          return (
            <span className={`badge badge-light-${config.color} fw-bold`}>
              {config.label}
            </span>
          )
        }
        
        return <span className="text-muted">-</span>
      },
    },
    {
      Header: () => <th className="min-w-125px">Start Date</th>,
      id: 'start_date',
      Cell: ({ row }: any) => {
        const item = row.original as CombinedItem
        return (
          <div>
            {new Date(item.start_date).toLocaleDateString('en', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        )
      },
    },
    {
      Header: () => <th className="min-w-125px">End Date</th>,
      id: 'end_date',
      Cell: ({ row }: any) => {
        const item = row.original as CombinedItem
        return (
          <div>
            {new Date(item.end_date).toLocaleDateString('en', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        )
      },
    },
    {
      Header: () => <th className="min-w-100px">Status</th>,
      id: 'status',
      Cell: ({ row }: any) => {
        const item = row.original as CombinedItem
        const statusColors: Record<string, string> = {
          pending: 'warning',
          approved: 'success',
          rejected: 'danger',
          draft: 'secondary',
          scheduled: 'info',
          ongoing: 'primary',
          completed: 'success',
          cancelled: 'dark',
        }
        const statusIcons: Record<string, string> = {
          pending: 'bi-clock-history',
          approved: 'bi-check-circle',
          rejected: 'bi-x-circle',
          draft: 'bi-pencil',
          scheduled: 'bi-calendar-check',
          ongoing: 'bi-arrow-repeat',
          completed: 'bi-check-all',
          cancelled: 'bi-x-octagon',
        }
        
        return (
          <div className={`badge badge-light-${statusColors[item.status] || 'secondary'} fw-bolder`}>
            <i className={`bi ${statusIcons[item.status]} me-1`}></i>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </div>
        )
      },
    },
    {
      Header: () => <th className="text-end min-w-100px">Actions</th>,
      id: 'actions',
      Cell: ({ row }: any) => {
        const item = row.original as CombinedItem
        return (
          <div className="text-end">
            <button 
              className="btn btn-sm btn-light-primary"
              onClick={() => {
                if (item.type === 'event') {
                  setSelectedEventId(item._id)
                } else {
                  setSelectedHolidayId(item._id)
                }
              }}
            >
              <i className="bi bi-eye me-1"></i>
              View
            </button>
          </div>
        )
      },
    },
  ], [])
  
  const {getTableProps, getTableBodyProps, headers, rows, prepareRow} = useTable({
    columns,
    data,
  })

  return (
    <>
      <KTCardBody className='py-4'>
        <div className='table-responsive'>
          <table
            id='kt_table_combined'
            className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'
            {...getTableProps()}
          >
            <thead>
              <tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
                {headers.map((column: ColumnInstance<CombinedItem>) => (
                  <CustomHeaderColumn key={column.id} column={column} />
                ))}
              </tr>
            </thead>
            <tbody className='text-gray-600 fw-bold' {...getTableBodyProps()}>
              {rows.length > 0 ? (
                rows.map((row: Row<CombinedItem>, i) => {
                  prepareRow(row)
                  return <CustomRow row={row} key={`row-${i}-${row.id}`} />
                })
              ) : (
                <tr>
                  <td colSpan={headers.length}>
                    <div className='d-flex text-center w-100 align-content-center justify-content-center'>
                      {isLoading ? (
                        <div className='d-flex align-items-center justify-content-center'>
                          <span className='spinner-border spinner-border-sm me-3'></span>
                          Loading events and holidays...
                        </div>
                      ) : state.search || state.filter ? (
                        <div className='text-muted'>
                          No results found matching your filters
                        </div>
                      ) : (
                        <div className='text-muted'>
                          No events or holidays found
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {isLoading && <EventsListLoading />}
      </KTCardBody>

      {/* ✅ Event View Modal */}
      {selectedEventId && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <ViewDetailModal
              eventId={selectedEventId}
              onClose={() => setSelectedEventId(null)}
              currentUser={currentUser}
              onRefetch={fetchData}
            />
          </div>
        </div>
      )}

      {/* ✅ Holiday View Modal */}
      {selectedHolidayId && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <HolidayViewModal
              holidayId={selectedHolidayId}
              onClose={() => setSelectedHolidayId(null)}
              currentUser={currentUser}
              onRefetch={fetchData}
            />
          </div>
        </div>
      )}
    </>
  )
}

export {UsersTable}