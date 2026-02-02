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

export function Overview() {
  const [selectedForm, setSelectedForm] = useState<string | null>(null)

  const formCards = [
    {
      id: 'leave-request',
      title: 'Leave Request',
      description: 'Submit your leave application',
      icon: 'calendar',
      color: 'primary',
      iconBg: 'light-primary'
    },
    {
      id: 'expense-claim',
      title: 'Expense Claim',
      description: 'Submit expense reimbursement',
      icon: 'dollar',
      color: 'success',
      iconBg: 'light-success'
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
    setSelectedForm(formId)
    // TODO: Open modal or navigate to form page
    console.log('Opening form:', formId)
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
        <div className='d-flex align-items-center mb-5'>
          <h3 className='fw-bolder m-0'>Quick Actions</h3>
        </div>
        
        <div className='row g-6 g-xl-9'>
          {formCards.map((card) => (
            <div key={card.id} className='col-md-6 col-xl-3'>
              <div
                className='card card-flush h-100 cursor-pointer'
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
                  
                  <div className='fs-6 fw-semibold text-gray-500'>
                    {card.description}
                  </div>
                  
                  <div className='mt-6'>
                    <button className={`btn btn-sm btn-${card.color}`}>
                      Open Form
                      <KTIcon iconName='arrow-right' className='fs-4 ms-2' />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}