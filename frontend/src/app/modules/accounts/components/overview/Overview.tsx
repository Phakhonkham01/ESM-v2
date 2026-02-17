import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { KTIcon } from '../../../../../_metronic/helpers'
import {
  ChartsWidget1,
  ListsWidget5,
  TablesWidget1,
  TablesWidget5,
} from '../../../../../_metronic/partials/widgets'
import { useAuth } from '../../../auth'
import LeaveDayForm from './allForm/LeaveDayForm'
import OtandFieldWork from './allForm/OtandField-work'
import SaturdaySundayRequest from './allForm/satSunRequest' // ✅ Import

export function Overview() {
  const [selectedForm, setSelectedForm] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const formCards = [
    {
      id: 'leave-request',
      title: 'Leave Request',
      description: 'Submit your leave application',
      icon: 'calendar',
      color: 'success',
      iconBg: 'light-success'
    },
    {
      id: 'field-work',
      title: 'Field Work',
      description: 'Submit field work request',
      icon: 'geolocation',
      color: 'primary',
      iconBg: 'light-primary'
    },
    {
      id: 'overtime-request',
      title: 'Overtime Request',
      description: 'Request overtime approval',
      icon: 'timer',
      color: 'warning',
      iconBg: 'light-warning'
    },
    // ✅ Weekend Leave Card
    {
      id: 'weekend-leave',
      title: 'Weekend Work',
      description: 'Saturday or Sunday work',
      icon: 'calendar-8',
      color: 'info',
      iconBg: 'light-info'
    },
  ]

  const handleCardClick = (formId: string) => {
    console.log('Card clicked:', formId)
    setSelectedForm(formId)
    setShowModal(true)
    document.body.classList.add('modal-open')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedForm(null)
    document.body.classList.remove('modal-open')
  }

  const handleSuccess = () => {
    console.log('Request submitted successfully')
    // ✅ อาจจะ refresh data หรือแสดง toast notification
  }

  const renderFormContent = () => {
    switch (selectedForm) {
      case 'leave-request':
        return <LeaveDayForm onClose={handleCloseModal} onSuccess={handleSuccess} />
      
      case 'overtime-request':
        return <OtandFieldWork type="OT" onClose={handleCloseModal} onSuccess={handleSuccess} />
      
      case 'field-work':
        return <OtandFieldWork type="FIELD_WORK" onClose={handleCloseModal} onSuccess={handleSuccess} />
      
      // ✅ Weekend Leave - ไม่ต้องส่ง dayChoice เพราะให้เลือกใน form
      case 'weekend-leave':
        return (
          <SaturdaySundayRequest 
            onClose={handleCloseModal} 
            onSuccess={handleSuccess} 
          />
        )
      
      case 'document-request':
        return (
          <div className='card'>
            <div className='card-header' style={{ background: 'linear-gradient(135deg, #7239ea 0%, #5e2fc1 100%)' }}>
              <h3 className='card-title text-white'>
                <KTIcon iconName='document' className='fs-2 text-white me-2' />
                Document Request
              </h3>
              <div className='card-toolbar'>
                <button
                  type='button'
                  className='btn btn-sm btn-icon btn-light'
                  onClick={handleCloseModal}
                >
                  <KTIcon iconName='cross' className='fs-2' />
                </button>
              </div>
            </div>
            <div className='card-body text-center py-20'>
              <KTIcon iconName='document' className='fs-3x text-primary mb-5' />
              <h3 className='text-gray-800 mb-3'>Document Request Form</h3>
              <p className='text-gray-600 mb-0'>Coming soon...</p>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <>
      {/* Quick Actions Section */}
      <div className='mb-5 mb-xl-10'>
        <div className='row g-6 g-xl-9'>
          {formCards.map((card) => (
            <div key={card.id} className='col-md-6 col-xl-4'>
              <div
                className='card h-100 cursor-pointer'
                onClick={() => handleCardClick(card.id)}
                style={{
                  transition: 'all 0.3s ease',
                  border: '1px solid #e4e6ef'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div className='card-body text-center pt-9 pb-9'>
                  <div className={`symbol symbol-75px symbol-circle mb-5 bg-${card.iconBg}`}>
                    <div className='symbol-label'>
                      <KTIcon 
                        iconName={card.icon} 
                        className={`fs-2x text-${card.color}`}
                      />
                    </div>
                  </div>
                  
                  <div className='fs-4 fw-bold text-gray-800 mb-2'>
                    {card.title}
                  </div>
                  
                  <div className='fs-6 fw-semibold text-gray-500 mb-6'>
                    {card.description}
                  </div>
                  
                  <button 
                    className={`btn btn-sm btn-${card.color}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCardClick(card.id)
                    }}
                  >
                    Open Form
                    <KTIcon iconName='arrow-right' className='fs-4 ms-2' />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div 
            className='modal-backdrop fade show'
            onClick={handleCloseModal}
            style={{ zIndex: 1050 }}
          />
          
          {/* Modal */}
          <div 
            className='modal fade show' 
            tabIndex={-1}
            style={{ 
              display: 'block',
              zIndex: 1055
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseModal()
              }
            }}
          >
            <div className='modal-dialog modal-dialog-centered modal-xl'> {/* ✅ modal-xl สำหรับ form ที่ใหญ่ขึ้น */}
              <div className='modal-content border-0 shadow-lg'>
                {renderFormContent()}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}