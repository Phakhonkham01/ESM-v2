import {useMemo} from 'react'
import {useTable, ColumnInstance, Row} from 'react-table'
import {CustomHeaderColumn} from './columns/CustomHeaderColumn'
import {CustomRow} from './columns/CustomRow'
import {useQueryResponseData, useQueryResponseLoading} from '../core/QueryResponseProvider'
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
  
  // ✅ Role-based filtering - Employee เห็นเฉพาะ pending status
  const filteredData = useMemo(() => {
    if (!users || !currentUser) {
      console.log('❌ No users or currentUser')
      return []
    }
    
    const localStorageUserId = currentUser._id
    const userRole = currentUser.role?.toLowerCase()
    const currentDate = new Date()
    
    console.log('🔍 Current User:', {
      id: currentUser._id,
      role: currentUser.role,
      normalizedRole: userRole,
      localStorageUserId: localStorageUserId,
      currentDate: currentDate.toISOString()
    })
    
    console.log('📊 Total events before filter:', users.length)
    
    // ✅ CEO and Admin: แสดง events ทั้งหมดที่ยังไม่หมดอายุ
    if (userRole === 'ceo' || userRole === 'admin') {
      console.log(`👑 ${userRole.toUpperCase()} - showing ALL events (excluding expired)`)
      
      const filtered = users.filter((event: any) => {
        // ✅ เช็คว่า event หมดอายุหรือยัง
        if (event.end_date) {
          const endDate = new Date(event.end_date)
          if (currentDate > endDate) {
            console.log(`⏰ Event "${event.event_name}" expired (end_date: ${endDate.toISOString()}) - HIDING`)
            return false
          }
        }
        return true
      })
      
      console.log(`📊 ${userRole.toUpperCase()} result: ${filtered.length} active events out of ${users.length} total`)
      return filtered
    }
    
    // ✅ Employee: แสดงเฉพาะ events ที่มี participation_status = 'pending' และยังไม่หมดอายุเท่านั้น
    if (userRole === 'employee') {
      console.log('👤 Employee - filtering by person_in_charge with participation_status = "pending" ONLY')
      
      const filtered = users.filter((event: any, index: number) => {
        console.log(`\n--- Event ${index + 1}: ${event.event_name} ---`)
        console.log('person_in_charge:', event.person_in_charge)
        console.log('require_participation_response:', event.require_participation_response)
        console.log('end_date:', event.end_date)
        
        // ✅ เช็คว่า event หมดอายุหรือยัง
        if (event.end_date) {
          const endDate = new Date(event.end_date)
          console.log(`⏰ Checking end_date: ${endDate.toISOString()} vs current: ${currentDate.toISOString()}`)
          
          if (currentDate > endDate) {
            console.log(`❌ Event expired (current time > end_date) - HIDING EVENT`)
            return false
          } else {
            console.log(`✅ Event still active (current time <= end_date)`)
          }
        } else {
          console.log(`⚠️ No end_date specified - treating as active`)
        }
        
        // ❌ ถ้าไม่มี person_in_charge array ให้ skip
        if (!event.person_in_charge || !Array.isArray(event.person_in_charge)) {
          console.log('❌ No person_in_charge array')
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
          
          console.log(`  👤 Checking Person ID: ${personId}`)
          const matches = personId === localStorageUserId
          
          if (matches) {
            console.log(`  ✅ MATCH! Found current user in person_in_charge`)
          }
          
          return matches
        })
        
        // ❌ ถ้าไม่พบ user ใน person_in_charge
        if (!participant) {
          console.log('❌ Current user NOT found in person_in_charge - HIDING EVENT')
          return false
        }
        
        console.log('👤 Found participant:', participant)
        
        // ✅ เช็ค participation_status - แสดงเฉพาะ 'pending' เท่านั้น
        const participationStatus = participant.participation_status || 'not_required'
        console.log(`📋 Participation status: "${participationStatus}"`)
        
        // ✅ แสดงเฉพาะ 'pending' เท่านั้น
        const shouldShow = participationStatus === 'pending'
        
        if (shouldShow) {
          console.log(`✅ Status is "pending" - SHOWING EVENT! 🎉`)
        } else {
          console.log(`❌ Status is "${participationStatus}" (not pending) - HIDING EVENT`)
        }
        
        return shouldShow
      })
      
      console.log(`\n📊 Employee result: ${filtered.length} pending events found out of ${users.length} total`)
      
      // ✅ Debug info ถ้าไม่เจอ events
      if (filtered.length === 0) {
        console.log('\n🔍 === DEBUG: No pending events found for Employee ===')
        console.log(`Current User ID: ${localStorageUserId}`)
        console.log(`Current Time: ${currentDate.toISOString()}`)
        console.log('\nChecking all events:')
        
        users.forEach((event: any, index: number) => {
          console.log(`\n${index + 1}. Event: "${event.event_name}"`)
          console.log(`   Status: ${event.status}`)
          console.log(`   end_date: ${event.end_date}`)
          
          if (event.end_date) {
            const endDate = new Date(event.end_date)
            const isExpired = currentDate > endDate
            console.log(`   ⏰ Expired: ${isExpired ? 'YES ❌' : 'NO ✅'} (${endDate.toISOString()})`)
          }
          
          console.log(`   require_participation_response: ${event.require_participation_response}`)
          
          if (event.person_in_charge && Array.isArray(event.person_in_charge)) {
            console.log(`   person_in_charge (${event.person_in_charge.length} people):`)
            event.person_in_charge.forEach((p: any, idx: number) => {
              let personId = ''
              let status = 'unknown'
              
              if (p && typeof p === 'object' && p.user_id) {
                personId = p.user_id._id || p.user_id.id || p.user_id || 'unknown'
                status = p.participation_status || 'not_required'
              } else if (typeof p === 'string') {
                personId = p
                status = 'old_format'
              } else if (p._id || p.id) {
                personId = p._id || p.id
                status = 'old_format'
              }
              
              const isCurrentUser = personId === localStorageUserId
              console.log(`      [${idx}] ID: ${personId} ${isCurrentUser ? '← YOU!' : ''}, Status: ${status}`)
            })
          } else {
            console.log('   ❌ No person_in_charge array')
          }
        })
        console.log('\n=== END DEBUG ===\n')
      }
      
      return filtered
    }
    
    // All other roles see nothing
    console.log('⚠️ Role not authorized:', currentUser.role)
    return []
  }, [users, currentUser])
  
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
                        if (role === 'ceo' || role === 'admin') {
                          return 'No events found'
                        } else if (role === 'employee') {
                          return 'No pending participation requests found. Check browser console (F12) for debug info.'
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