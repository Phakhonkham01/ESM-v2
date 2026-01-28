import React, { useState, useEffect } from 'react'
import { getHolidays } from '../../modules/apps/holiday/users-list/core/_requests'; 
import { getEvents } from "../../modules/apps/event/users-list/core/_requests";
import { useAuth } from '../../modules/auth'

interface Event {
  id: string
  title: string
  start_date: Date
  end_date?: Date
  type: 'leave' | 'holiday' | 'meeting'
  description?: string
  person_in_charge?: any[]
  created_by?: {
    _id?: string
    id?: string
    user_name?: string
    name?: string
    email?: string
    role?: string
  }
  user_id?: {
    _id: string
    user_name: string
    name: string
    email: string
    role: string
  }
  status?: string
}

const Calendar = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [events, setEvents] = useState<Event[]>([])
  const [isDark, setIsDark] = useState(false)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // ✅ ดึงข้อมูล user ที่ล็อกอิน
  const { currentUser } = useAuth()
  const userRole = currentUser?.role?.toLowerCase()
  const userId = currentUser?._id

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handlePrevYear = () => setCurrentYear(prev => prev - 1)
  const handleNextYear = () => setCurrentYear(prev => prev + 1)

  useEffect(() => {
    const checkTheme = () => {
      const html = document.documentElement
      setIsDark(html.classList.contains('dark') || html.getAttribute('data-kt-theme-mode') === 'dark')
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  // ฟังก์ชันช่วยดึงชื่อผู้สร้าง
  const getCreatorName = (event: any) => {
    // ลองหาจากหลายที่ตามลำดับความสำคัญ
    if (event.created_by?.user_name) return event.created_by.user_name
    if (event.created_by?.name) return event.created_by.name
    if (event.user_id?.user_name) return event.user_id.user_name
    if (event.user_id?.name) return event.user_id.name
    if (event.createdBy?.user_name) return event.createdBy.user_name
    if (event.createdBy?.name) return event.createdBy.name
    return 'Unknown'
  }

  // ดึงข้อมูลจาก API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = `year=${currentYear}`
        
        // ดึงข้อมูล Events
        const eventsResponse = await getEvents(query)
        // ดึงข้อมูล Holidays
        const holidaysResponse = await getHolidays(query)
        
        console.log('📥 Events API Response (first 3):', eventsResponse?.data?.slice(0, 3).map((e: any) => ({
          event_name: e.event_name,
          user_id: e.user_id,
          created_by: e.created_by,
          createdBy: e.createdBy
        })))
        
        console.log('📥 Holidays API Response (first 3):', holidaysResponse?.data?.slice(0, 3).map((h: any) => ({
          holiday_name: h.holiday_name,
          user_id: h.user_id,
          created_by: h.created_by,
          createdBy: h.createdBy
        })))
        
        let allEvents: Event[] = []
        
        // แปลงข้อมูล Events
        if (eventsResponse && eventsResponse.data) {
          let formattedEvents = eventsResponse.data
            .filter((event: any) => event.status?.toLowerCase() === 'approved')
            .map((event: any) => ({
              id: event._id,
              title: event.event_name,
              start_date: new Date(event.start_date),
              end_date: event.end_date ? new Date(event.end_date) : undefined,
              type: 'meeting' as const,
              description: event.description,
              person_in_charge: event.person_in_charge,
              user_id: event.user_id, // เก็บข้อมูล user_id ทั้ง object
              // สร้าง created_by จาก user_id
              created_by: event.user_id ? {
                _id: event.user_id._id || event.user_id.id,
                user_name: event.user_id.user_name,
                name: event.user_id.name || event.user_id.user_name,
                email: event.user_id.user_email,
                role: event.user_id.role
              } : undefined,
              status: event.status
            }))

          // ✅ กรองตาม role
          if (userRole === 'ceo' || userRole === 'admin') {
            // CEO และ Admin เห็นทั้งหมด
            allEvents = [...allEvents, ...formattedEvents]
          } else {
            // Employee เห็นเฉพาะที่ตนเองอยู่ใน person_in_charge
            const filteredEvents = formattedEvents.filter((event: any) => {
              return event.person_in_charge?.some((person: any) => {
                // ตรวจสอบ user_id ที่ซ้อนอยู่ใน object
                const personId = person.user_id?._id || person.user_id?.id || person.user_id || person._id || person.id || person
                return personId === userId || personId?.toString() === userId
              })
            })
            allEvents = [...allEvents, ...filteredEvents]
          }
        }
        
        // แปลงข้อมูล Holidays
        if (holidaysResponse && holidaysResponse.data) {
          const formattedHolidays = holidaysResponse.data
            .filter((holiday: any) => holiday.status?.toLowerCase() === 'approved')
            .map((holiday: any) => ({
              id: holiday._id,
              title: holiday.holiday_name,
              start_date: new Date(holiday.start_date),
              end_date: new Date(holiday.end_date),
              type: 'holiday' as const,
              description: holiday.holiday_type,
              user_id: holiday.user_id, // เก็บข้อมูล user_id ทั้ง object
              // สร้าง created_by จาก user_id
              created_by: holiday.user_id ? {
                _id: holiday.user_id._id || holiday.user_id.id,
                user_name: holiday.user_id.user_name,
                name: holiday.user_id.name || holiday.user_id.user_name,
                email: holiday.user_id.user_email,
                role: holiday.user_id.role
              } : undefined,
              status: holiday.status
            }))
          
          // ✅ Holidays ทุกคนเห็นได้ (ไม่กรองตาม role)
          allEvents = [...allEvents, ...formattedHolidays]
        }
        
        console.log('✅ Final events with creators:', allEvents.map(e => ({
          title: e.title,
          creator: getCreatorName(e),
          user_id: e.user_id
        })))
        
        setEvents(allEvents)
      } catch (error) {
        console.error('Error fetching calendar data:', error)
        setEvents([])
      }
    }

    fetchData()
  }, [currentYear, userRole, userId])

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear()
  }

  const isWithinRange = (date: Date, start: Date, end: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    return d >= s && d <= e
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return isSameDay(date, today)
  }

  const getDayEvents = (date: Date) => {
    return events.filter(event => {
      if (event.end_date) {
        return isWithinRange(date, event.start_date, event.end_date)
      }
      return isSameDay(event.start_date, date)
    })
  }

  const handleMouseEnter = (date: Date, e: React.MouseEvent) => {
    const dayEvents = getDayEvents(date)
    if (dayEvents.length > 0) {
      setHoveredDate(date)
      const rect = e.currentTarget.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })
    }
  }

  const handleMouseLeave = () => {
    setHoveredDate(null)
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const renderMonth = (monthIndex: number) => {
    const daysInMonth = getDaysInMonth(monthIndex, currentYear)
    const firstDay = getFirstDayOfMonth(monthIndex, currentYear)
    const days: (number | null)[] = []

    // Add empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add day numbers
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    // หา events ของวันนี้ในเดือนนี้
    const today = new Date()
    const todayEvents = events.filter(event => {
      // ตรวจสอบว่า today อยู่ในช่วงของ event หรือไม่
      if (event.end_date) {
        return isWithinRange(today, event.start_date, event.end_date) &&
               today.getMonth() === monthIndex &&
               today.getFullYear() === currentYear
      }
      return isSameDay(event.start_date, today) &&
             today.getMonth() === monthIndex &&
             today.getFullYear() === currentYear
    })

    return (
      <div key={monthIndex} className="col-xxl-3 col-lg-4 col-md-6">
        <div className="card card-dashed h-xl-100">
          <div className="card-header border-0 pt-5">
            <h3 className="card-title text-gray-800 fw-bold">
              {monthNames[monthIndex]}
            </h3>
          </div>
          <div className="card-body pt-0">
            {/* Day headers */}
            <div className="calendar-grid mb-2">
              {dayNames.map(day => (
                <div key={day} className="calendar-day-header">
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="calendar-grid">
              {days.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="calendar-day-empty" />
                }

                const date = new Date(currentYear, monthIndex, day)
                const dayEvents = getDayEvents(date)
                const holidayEvents = dayEvents.filter(e => e.type === 'holiday')
                const meetingEvents = dayEvents.filter(e => e.type === 'meeting')
                const leaveEvents = dayEvents.filter(e => e.type === 'leave')

                return (
                  <div
                    key={idx}
                    className={`calendar-day ${isToday(date) ? 'is-today' : ''} ${selectedDate && isSameDay(date, selectedDate) ? 'is-selected' : ''}`}
                    onClick={() => setSelectedDate(date)}
                    onMouseEnter={(e) => handleMouseEnter(date, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="day-number">{day}</div>
                    <div className="event-indicators">
                      {holidayEvents.length > 0 && (
                        <div className="event-shape event-square holiday-bg" />
                      )}
                      {meetingEvents.length > 0 && (
                        <div className="event-shape event-circle meeting-bg" />
                      )}
                      {leaveEvents.length > 0 && (
                        <div className="event-shape event-circle leave-bg" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Today's Events for this month */}
          {todayEvents.length > 0 && (
            <div className="card-footer pt-3 pb-3">
              <div className="today-header mb-2">
                <i className="ki-duotone ki-calendar-tick fs-5 text-primary me-1">
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
                <span className="text-primary fw-bold">Today's Events</span>
              </div>
              <div className="month-events-list">
                {todayEvents.map((event, idx) => (
                  <div key={idx} className="month-event-item">
                    <div className="d-flex align-items-start gap-2">
                      <div 
                        className={`event-dot ${
                          event.type === 'holiday' ? 'dot-holiday' :
                          event.type === 'meeting' ? 'dot-meeting' : 'dot-leave'
                        }`}
                      >
                        {event.type === 'holiday' ? '■' : '●'}
                      </div>
                      <div className="flex-grow-1">
                        <div className="card-title">{event.title}</div>
                        <div className="event-item-date">
                          {event.start_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {event.end_date && (
                            <> - {event.end_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
                          )}
                        </div>
                        {/* แสดง Created by */}
                        <div className="event-item-creator mt-1">
                          <small className="text-muted">
                            <i className="ki-duotone ki-user me-1 fs-6">
                              <span className="path1"></span>
                              <span className="path2"></span>
                            </i>
                            Created by: {getCreatorName(event)}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <div className="card-title flex-column">
          <h2 className="mb-1">Calendar</h2>
          <span className="text-muted">View all events and holidays at a glance</span>
        </div>
        <div className="card-toolbar">
          <div className="d-flex align-items-center gap-2">
            <button onClick={handlePrevYear} className="btn btn-sm btn-icon btn-light-primary">
              <i className="ki-duotone ki-left fs-2"></i>
            </button>
            <span className="fs-3 fw-bold text-gray-700">{currentYear}</span>
            <button onClick={handleNextYear} className="btn btn-sm btn-icon btn-light-primary">
              <i className="ki-duotone ki-right fs-2"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card-body p-0">
        <div className="row g-4 p-6">
          {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
        </div>
      </div>

      {/* Footer Legend */}
      <div className="card-footer">
        <div className="d-flex flex-wrap gap-4">
          <div className="d-flex align-items-center">
            <div className="bullet leave-bg w-10px h-10px rounded-circle me-3"></div>
            <span className="text-gray-700">Leave (Circle)</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="bullet holiday-bg w-10px h-10px me-3"></div>
            <span className="text-gray-700">Holiday (Square, Multi-day)</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="bullet meeting-bg w-10px h-10px rounded-circle me-3"></div>
            <span className="text-gray-700">Meeting (Circle)</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="bullet bg-primary w-10px h-10px rounded me-3"></div>
            <span className="text-gray-700">Today</span>
          </div>
          {/* เพิ่มส่วนแสดง Created by info */}
          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center me-3">
              <i className="ki-duotone ki-user fs-6 text-gray-600 me-1">
                <span className="path1"></span>
                <span className="path2"></span>
              </i>
              <span className="text-gray-700">Creator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDate && (
        <div 
          className="event-tooltip"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          <div className="tooltip-arrow"></div>
          <div className="tooltip-content">
            <div className="tooltip-date">
              {hoveredDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            {getDayEvents(hoveredDate).map((event, idx) => (
              <div key={idx} className="tooltip-event">
                <div className="d-flex align-items-start gap-2">
                  <div 
                    className={`event-badge ${
                      event.type === 'holiday' ? 'badge-holiday' :
                      event.type === 'meeting' ? 'badge-meeting' : 'badge-leave'
                    }`}
                  >
                    {event.type === 'holiday' ? '■' : '●'}
                  </div>
                  <div className="flex-grow-1">
                    <div className="event-title">{event.title}</div>
                    {event.description && (
                      <div className="event-description">{event.description}</div>
                    )}
                    {event.end_date && (
                      <div className="event-date-range">
                        {event.start_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} - {event.end_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    {/* แสดง Created by ใน Tooltip */}
                    <div className="event-creator mt-1">
                      <small className="text-muted d-flex align-items-center">
                        <i className="ki-duotone ki-user me-1 fs-6">
                          <span className="path1"></span>
                          <span className="path2"></span>
                        </i>
                        Created by: {getCreatorName(event)}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .calendar-day-header {
          font-size: 0.75rem;
          font-weight: 600;
          color: ${isDark ? '#A1A5B7' : '#7E8299'};
          text-align: center;
          padding: 4px 0;
        }

        .calendar-day-empty {
          height: 40px;
        }

        .calendar-day {
          height: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          gap: 2px;
        }

        .calendar-day:hover {
          background-color: ${isDark ? '#2B2B40' : '#F5F8FA'};
          transform: scale(1.05);
        }

        .calendar-day.is-today {
          border: 2px solid #009EF7;
          background-color: ${isDark ? 'rgba(0, 158, 247, 0.1)' : 'rgba(0, 158, 247, 0.05)'};
        }

        .calendar-day.is-selected {
          background: #009EF7 !important;
        }

        .calendar-day.is-selected .day-number {
          color: white !important;
        }

        .day-number {
          font-size: 0.85rem;
          font-weight: 500;
          color: ${isDark ? '#A1A5B7' : '#5E6278'};
          line-height: 1;
        }

        .event-indicators {
          display: flex;
          gap: 2px;
          align-items: center;
          justify-content: center;
          min-height: 8px;
        }

        .event-shape {
          width: 8px;
          height: 8px;
          flex-shrink: 0;
        }

        .event-circle {
          border-radius: 50%;
        }

        .event-square {
          border-radius: 1px;
        }

        .leave-bg {
          background-color: #F1416C;
        }

        .holiday-bg {
          background-color: #50CD89;
        }

        .meeting-bg {
          background-color: #7239EA;
        }

        /* Tooltip Styles */
        .event-tooltip {
          position: fixed;
          z-index: 9999;
          transform: translate(-50%, -100%);
          pointer-events: none;
          animation: tooltipFadeIn 0.2s ease-out;
        }

        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -95%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%);
          }
        }

        .tooltip-arrow {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid ${isDark ? '#1E1E2D' : '#FFFFFF'};
        }

        .tooltip-content {
          background: ${isDark ? '#1E1E2D' : '#FFFFFF'};
          border: 1px solid ${isDark ? '#2B2B40' : '#E4E6EF'};
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          min-width: 220px;
          max-width: 300px;
        }

        .tooltip-date {
          font-size: 0.75rem;
          font-weight: 600;
          color: ${isDark ? '#92929F' : '#7E8299'};
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid ${isDark ? '#2B2B40' : '#E4E6EF'};
        }

        .tooltip-event {
          padding: 6px 0;
          border-bottom: 1px solid ${isDark ? '#2B2B40' : '#F5F8FA'};
        }

        .tooltip-event:last-child {
          border-bottom: none;
        }

        .event-badge {
          font-size: 10px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          font-weight: bold;
        }

        .badge-holiday {
          background-color: rgba(80, 205, 137, 0.1);
          color: #50CD89;
        }

        .badge-meeting {
          background-color: rgba(114, 57, 234, 0.1);
          color: #7239EA;
        }

        .badge-leave {
          background-color: rgba(241, 65, 108, 0.1);
          color: #F1416C;
        }

        .event-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: ${isDark ? '#FFFFFF' : '#181C32'};
          margin-bottom: 2px;
        }

        .event-description {
          font-size: 0.75rem;
          color: ${isDark ? '#92929F' : '#7E8299'};
          margin-top: 2px;
        }

        .event-date-range {
          font-size: 0.7rem;
          color: ${isDark ? '#92929F' : '#A1A5B7'};
          margin-top: 2px;
          font-style: italic;
        }

        .event-creator {
          font-size: 0.7rem;
          color: ${isDark ? '#7E8299' : '#92929F'};
          margin-top: 4px;
          font-style: italic;
        }

        /* Month Events List */
        .today-header {
          display: flex;
          align-items: center;
          font-size: 0.8rem;
          padding-bottom: 8px;
          border-bottom: 1px solid ${isDark ? '#2B2B40' : '#E4E6EF'};
        }

        .month-events-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 120px;
          overflow-y: auto;
        }

        .month-event-item {
          padding: 6px 8px;
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'};
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .month-event-item:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'};
          transform: translateX(2px);
        }

        .event-dot {
          font-size: 8px;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          font-weight: bold;
          margin-top: 2px;
        }

        .dot-holiday {
          background-color: rgba(80, 205, 137, 0.15);
          color: #50CD89;
        }

        .dot-meeting {
          background-color: rgba(114, 57, 234, 0.15);
          color: #7239EA;
        }

        .dot-leave {
          background-color: rgba(241, 65, 108, 0.15);
          color: #F1416C;
        }

        .event-item-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: ${isDark ? '#E4E6EF' : '#181C32'};
          line-height: 1.3;
          margin-bottom: 2px;
        }

        .event-item-date {
          font-size: 0.7rem;
          color: ${isDark ? '#92929F' : '#7E8299'};
          line-height: 1.2;
        }

        .event-item-creator {
          font-size: 0.65rem;
          color: ${isDark ? '#7E8299' : '#A1A5B7'};
          line-height: 1.2;
          margin-top: 2px;
          font-style: italic;
        }

        .event-item-creator small,
        .event-creator small {
          font-size: 0.65rem;
          color: ${isDark ? '#7E8299' : '#A1A5B7'};
          line-height: 1.2;
          font-style: italic;
        }

        .event-item-creator .ki-user,
        .event-creator .ki-user {
          font-size: 0.7rem;
          color: ${isDark ? '#92929F' : '#7E8299'};
        }

        .month-events-list::-webkit-scrollbar {
          width: 4px;
        }

        .month-events-list::-webkit-scrollbar-track {
          background: ${isDark ? '#1E1E2D' : '#F5F8FA'};
          border-radius: 2px;
        }

        .month-events-list::-webkit-scrollbar-thumb {
          background: ${isDark ? '#3F4254' : '#D1D3E0'};
          border-radius: 2px;
        }

        .month-events-list::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#565674' : '#B5B5C3'};
        }

        @media (max-width: 768px) {
          .calendar-day {
            height: 36px;
          }
          .day-number {
            font-size: 0.75rem;
          }
          .event-shape {
            width: 6px;
            height: 6px;
          }
          .tooltip-content {
            min-width: 180px;
          }
        }
      `}</style>
    </div>
  )
}

export default Calendar