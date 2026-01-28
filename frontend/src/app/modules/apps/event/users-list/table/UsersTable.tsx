import {useMemo} from 'react'
import {useTable, ColumnInstance, Row} from 'react-table'
import {CustomHeaderColumn} from './columns/CustomHeaderColumn'
import {CustomRow} from './columns/CustomRow'
import {useQueryResponseData, useQueryResponseLoading} from '../core/QueryResponseProvider'
import {useQueryRequest} from '../core/QueryRequestProvider'
import {eventsColumns} from './columns/_columns'
import {Event} from '../core/_models'
import {EventsListLoading} from '../components/loading/EventsListLoading'
import {UsersListPagination} from '../components/pagination/UsersListPagination'
import {KTCardBody} from '../../../../../../_metronic/helpers'
import {useAuth} from '../../../../auth'

const UsersTable = () => {
  const {currentUser} = useAuth()
  const users = useQueryResponseData()
  const isLoading = useQueryResponseLoading()
  const {state} = useQueryRequest()
  
  // ✅ Role-based filtering with participation status
  const filteredData = useMemo(() => {
    if (!users || !currentUser) {
      console.log('❌ No users or currentUser')
      return []
    }
    
    const localStorageUserId = currentUser._id
    const userRole = currentUser.role?.toLowerCase()
    const searchTerm = state.search?.toLowerCase() || ''
    
    console.log('🔍 Current User:', {
      id: currentUser._id,
      role: currentUser.role,
      normalizedRole: userRole,
      localStorageUserId: localStorageUserId,
      searchTerm: searchTerm
    })
    
    console.log('📊 Total events before filter:', users.length)
    
    // CEO and Admin can see events where user_id matches their _id
    if (userRole === 'ceo' || userRole === 'admin') {
      console.log('👑 CEO/Admin - filtering by user_id match')
      
      const filtered = users.filter((event: any, index: number) => {
        console.log(`\n--- Event ${index + 1}: ${event.event_name} ---`)
        console.log('Event user_id:', event.user_id)
        
        // Extract user_id from event
        let eventUserId = ''
        
        if (!event.user_id) {
          console.log('❌ Event has no user_id')
          return false
        }
        
        if (typeof event.user_id === 'string') {
          eventUserId = event.user_id
        }
        else if (event.user_id && typeof event.user_id === 'object') {
          eventUserId = event.user_id._id || 
                       event.user_id.id || 
                       event.user_id.$oid ||
                       String(event.user_id)
        }
        
        console.log(`🆔 Comparing: Event user_id "${eventUserId}" === User _id "${localStorageUserId}"`)
        
        const userIdMatches = eventUserId === localStorageUserId
        console.log(`✅ Result: ${userIdMatches ? 'MATCH! 🎉' : 'No match'}`)
        
        // ✅ Filter by event_name
        if (userIdMatches && searchTerm) {
          const eventName = (event.event_name || '').toLowerCase()
          const nameMatches = eventName.includes(searchTerm)
          console.log(`🔎 Event name "${event.event_name}" ${nameMatches ? 'matches' : 'does not match'} search term "${searchTerm}"`)
          return nameMatches
        }
        
        return userIdMatches
      })
      
      console.log(`\n📊 CEO/Admin result: ${filtered.length} events found`)
      return filtered
    }
    
    // ✅ Employee: แสดง event เฉพาะเมื่อ user_id อยู่ใน person_in_charge และ participation_status = 'accepted'
    if (userRole === 'employee') {
      console.log('👤 Employee - filtering by person_in_charge with participation_status = "accepted"')
      
      const filtered = users.filter((event: any, index: number) => {
        console.log(`\n--- Event ${index + 1}: ${event.event_name} ---`)
        console.log('person_in_charge:', event.person_in_charge)
        console.log('require_participation_response:', event.require_participation_response)
        
        // Check if person_in_charge exists and is an array
        if (!event.person_in_charge || !Array.isArray(event.person_in_charge)) {
          console.log('❌ No person_in_charge array or not an array')
          return false
        }
        
        console.log(`👥 Total persons in charge: ${event.person_in_charge.length}`)
        
        // ✅ หา participant ที่ตรงกับ current user
        const participant = event.person_in_charge.find((person: any) => {
          let personId = ''
          
          // Handle new format: { user_id: ObjectId, participation_status: string }
          if (person && typeof person === 'object' && person.user_id) {
            if (typeof person.user_id === 'string') {
              personId = person.user_id
            } else if (person.user_id && typeof person.user_id === 'object') {
              personId = person.user_id._id || 
                        person.user_id.id || 
                        person.user_id.$oid ||
                        String(person.user_id)
            }
          }
          // Handle old format: direct string or ObjectId
          else if (typeof person === 'string') {
            personId = person
          } else if (person && typeof person === 'object') {
            personId = person._id || 
                      person.id || 
                      person.$oid ||
                      String(person)
          }
          
          console.log(`  👤 Person ID: ${personId}`)
          const matches = personId === localStorageUserId
          
          if (matches) {
            console.log(`  ✅ Found user in person_in_charge!`)
          }
          
          return matches
        })
        
        if (!participant) {
          console.log('❌ User not found in person_in_charge')
          return false
        }
        
        console.log('👤 Found participant:', participant)
        
        // ✅ ตรวจสอบ participation_status
        // ถ้า event ไม่ได้เปิดใช้งาน require_participation_response แสดงเลย (backward compatibility)
        if (!event.require_participation_response) {
          console.log('ℹ️ Event does not require participation response - checking search filter')
          
          // ✅ Filter by event_name
          if (searchTerm) {
            const eventName = (event.event_name || '').toLowerCase()
            const nameMatches = eventName.includes(searchTerm)
            console.log(`🔎 Event name "${event.event_name}" ${nameMatches ? 'matches' : 'does not match'} search term "${searchTerm}"`)
            return nameMatches
          }
          
          return true
        }
        
        // ✅ ถ้าเปิดใช้งาน require_participation_response ต้องเช็ค status
        const participationStatus = participant.participation_status || 'not_required'
        console.log(`📋 Participation status: "${participationStatus}"`)
        
        // ✅ แสดงเฉพาะ 'accepted' หรือ 'not_required' เท่านั้น
        const shouldShow = participationStatus === 'accepted' || participationStatus === 'not_required'
        
        if (shouldShow) {
          console.log(`✅ Status is "${participationStatus}" - checking search filter`)
          
          // ✅ Filter by event_name
          if (searchTerm) {
            const eventName = (event.event_name || '').toLowerCase()
            const nameMatches = eventName.includes(searchTerm)
            console.log(`🔎 Event name "${event.event_name}" ${nameMatches ? 'matches' : 'does not match'} search term "${searchTerm}"`)
            return nameMatches
          }
          
          return true
        } else {
          console.log(`❌ Status is "${participationStatus}" (not accepted) - HIDING EVENT`)
          return false
        }
      })
      
      console.log(`\n📊 Employee result: ${filtered.length} events found`)
      
      // Debug: Show all person_in_charge arrays for reference
      if (filtered.length === 0 && !searchTerm) {
        console.log('\n🔍 === DEBUG: No events found for Employee ===')
        console.log(`Looking for user_id: ${localStorageUserId}`)
        console.log('\nChecking all events:')
        users.forEach((event: any, index: number) => {
          console.log(`\n${index + 1}. Event: "${event.event_name}"`)
          console.log(`   require_participation_response: ${event.require_participation_response}`)
          console.log(`   person_in_charge (${event.person_in_charge?.length || 0} people):`)
          
          if (event.person_in_charge && Array.isArray(event.person_in_charge)) {
            event.person_in_charge.forEach((p: any, idx: number) => {
              let personId = ''
              let status = 'unknown'
              
              if (p && typeof p === 'object' && p.user_id) {
                // New format
                personId = p.user_id._id || p.user_id.id || p.user_id || 'unknown'
                status = p.participation_status || 'not_required'
              } else if (typeof p === 'string') {
                // Old format (string)
                personId = p
                status = 'old_format'
              } else if (p._id || p.id) {
                // Old format (object)
                personId = p._id || p.id
                status = 'old_format'
              }
              
              const isCurrentUser = personId === localStorageUserId
              console.log(`      [${idx}] Person ID: ${personId} ${isCurrentUser ? '← YOU' : ''}, Status: ${status}`)
            })
          } else {
            console.log('      (No person_in_charge array)')
          }
        })
        console.log('\n=== END DEBUG ===\n')
      }
      
      return filtered
    }
    
    // All other roles see nothing
    console.log('⚠️ Role not authorized:', currentUser.role)
    return []
  }, [users, currentUser, state.search])
  
  const data = useMemo(() => filteredData, [filteredData])
  const columns = useMemo(() => eventsColumns, [])
  
  const {getTableProps, getTableBodyProps, headers, rows, prepareRow} = useTable({
    columns,
    data,
  })

  return (
    <KTCardBody className='py-4'>
      <div className='table-responsive'>
        <table
          id='kt_table_users'
          className='table align-middle table-row-dashed fs-6 gy-5 dataTable no-footer'
          {...getTableProps()}
        >
          <thead>
            <tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
              {headers.map((column: ColumnInstance<Event>) => (
                <CustomHeaderColumn key={column.id} column={column} />
              ))}
            </tr>
          </thead>
          <tbody className='text-gray-600 fw-bold' {...getTableBodyProps()}>
            {rows.length > 0 ? (
              rows.map((row: Row<Event>, i) => {
                prepareRow(row)
                return <CustomRow row={row} key={`row-${i}-${row.id}`} />
              })
            ) : (
              <tr>
                <td colSpan={headers.length}>
                  <div className='d-flex text-center w-100 align-content-center justify-content-center'>
                    {isLoading ? (
                      'Loading...'
                    ) : (
                      (() => {
                        const role = currentUser?.role?.toLowerCase()
                        const searchTerm = state.search || ''
                        
                        if (searchTerm) {
                          return `No events found matching "${searchTerm}"`
                        }
                        
                        if (role === 'ceo' || role === 'admin') {
                          return 'No events created by you'
                        } else if (role === 'employee') {
                          return 'No accepted events found. Check console for debug info.'
                        } else {
                          return 'Access denied. Only CEO, Admin, and Employee can view this data.'
                        }
                      })()
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <UsersListPagination />
      {isLoading && <EventsListLoading />}
    </KTCardBody>
  )
}

export {UsersTable}