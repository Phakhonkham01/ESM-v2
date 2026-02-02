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
import OtForm from './allForm/OtForm'
import FieldWork from './allForm/Field-work'

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
    {
      id: 'document-request',
      title: 'Document Request',
      description: 'Request official documents',
      icon: 'document',
      color: 'info',
      iconBg: 'light-info'
    }
  ]

  const handleCardClick = (formId: string) => {
    console.log('Card clicked:', formId) // Debug log
    setSelectedForm(formId)
    setShowModal(true)
    // Add body class to prevent scroll
    document.body.classList.add('modal-open')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedForm(null)
    // Remove body class
    document.body.classList.remove('modal-open')
  }

  const handleSuccess = () => {
    // Refresh data or show success message
    console.log('Request submitted successfully')
  }

  const renderFormContent = () => {
    switch (selectedForm) {
      case 'leave-request':
        return <LeaveDayForm onClose={handleCloseModal} onSuccess={handleSuccess} />
      case 'overtime-request':
        return <OtForm onClose={handleCloseModal} onSuccess={handleSuccess} />
      case 'field-work':
        return <FieldWork onClose={handleCloseModal} onSuccess={handleSuccess} />
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
      {/* Profile Details Card */}
      {/* <div className='card mb-5 mb-xl-10' id='kt_profile_details_view'>
        <div className='card-header cursor-pointer'>
          <div className='card-title m-0'>
            <h3 className='fw-bolder m-0'>Profile Details</h3>
          </div>
        </div>

        <div className='card-body p-9'>
          <div className='row mb-7'>
            <label className='col-lg-4 fw-bold text-muted'>Full Name</label>
            <div className='col-lg-8'>
              <span className='fw-bolder fs-6 text-gray-900'>Max Smith</span>
            </div>
          </div>

          <div className='row mb-7'>
            <label className='col-lg-4 fw-bold text-muted'>Company</label>
            <div className='col-lg-8 fv-row'>
              <span className='fw-bold fs-6'>Keenthemes</span>
            </div>
          </div>

          <div className='row mb-7'>
            <label className='col-lg-4 fw-bold text-muted'>
              Contact Phone
              <i
                className='fas fa-exclamation-circle ms-1 fs-7'
                data-bs-toggle='tooltip'
                title='Phone number must be active'
              ></i>
            </label>
            <div className='col-lg-8 d-flex align-items-center'>
              <span className='fw-bolder fs-6 me-2'>044 3276 454 935</span>
              <span className='badge badge-success'>Verified</span>
            </div>
          </div>

          <div className='row mb-7'>
            <label className='col-lg-4 fw-bold text-muted'>Company Site</label>
            <div className='col-lg-8'>
              <a href='#' className='fw-bold fs-6 text-gray-900 text-hover-primary'>
                keenthemes.com
              </a>
            </div>
          </div>

          <div className='row mb-7'>
            <label className='col-lg-4 fw-bold text-muted'>
              Country
              <i
                className='fas fa-exclamation-circle ms-1 fs-7'
                data-bs-toggle='tooltip'
                title='Country of origination'
              ></i>
            </label>
            <div className='col-lg-8'>
              <span className='fw-bolder fs-6 text-gray-900'>Germany</span>
            </div>
          </div>

          <div className='row mb-7'>
            <label className='col-lg-4 fw-bold text-muted'>Communication</label>
            <div className='col-lg-8'>
              <span className='fw-bolder fs-6 text-gray-900'>Email, Phone</span>
            </div>
          </div>

          <div className='row mb-10'>
            <label className='col-lg-4 fw-bold text-muted'>Allow Changes</label>
            <div className='col-lg-8'>
              <span className='fw-bold fs-6'>Yes</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Quick Actions Section */}
      <div className='mb-5 mb-xl-10'>
        {/* <div className='d-flex align-items-center mb-5'>
          <h3 className='fw-bolder m-0'>Quick Actions</h3>
        </div> */}
        
        <div className='row g-6 g-xl-9'>
          {formCards.map((card) => (
            <div key={card.id} className='col-md-6 col-xl-3'>
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
            <div className='modal-dialog modal-dialog-centered modal-lg'>
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