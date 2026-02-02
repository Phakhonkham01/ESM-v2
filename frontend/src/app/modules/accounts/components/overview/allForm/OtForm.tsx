import React, { useState } from 'react'
import { KTIcon } from '../../../../../../_metronic/helpers'
import { createDayOffRequest } from '../../_core/_requests'
import { useAuth } from '../../../../auth'

interface LeaveDayFormProps {
  onClose: () => void
  onSuccess?: () => void
}

const LeaveDayForm: React.FC<LeaveDayFormProps> = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    supervisor_id: '',
    day_off_type: 'FULL_DAY' as 'FULL_DAY' | 'HALF_DAY',
    start_date_time: '',
    end_date_time: '',
    title: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser?._id) {
      alert('User not found')
      return
    }

    if (!formData.supervisor_id || !formData.start_date_time || !formData.end_date_time || !formData.title) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      
      await createDayOffRequest({
        user_id: currentUser._id,
        supervisor_id: formData.supervisor_id,
        employee_id: currentUser._id,
        day_off_type: formData.day_off_type,
        start_date_time: formData.start_date_time,
        end_date_time: formData.end_date_time,
        title: formData.title,
      })

      alert('Leave request submitted successfully!')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      alert(error.message || 'Failed to submit leave request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='card'>
      <div className='card-header' style={{ background: 'linear-gradient(135deg, #17c653 0%, #14b047 100%)' }}>
        <h3 className='card-title text-white'>
          <KTIcon iconName='calendar' className='fs-2 text-white me-2' />
          Leave Day Request
        </h3>
        <div className='card-toolbar'>
          <button
            type='button'
            className='btn btn-sm btn-icon btn-light'
            onClick={onClose}
          >
            <KTIcon iconName='cross' className='fs-2' />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className='card-body'>
          {/* Leave Type */}
          <div className='mb-7'>
            <label className='form-label fw-bold required'>Leave Type</label>
            <select
              className='form-select'
              value={formData.day_off_type}
              onChange={(e) => setFormData({ ...formData, day_off_type: e.target.value as 'FULL_DAY' | 'HALF_DAY' })}
              required
            >
              <option value='FULL_DAY'>Full Day</option>
              <option value='HALF_DAY'>Half Day</option>
            </select>
          </div>

          {/* Title */}
          <div className='mb-7'>
            <label className='form-label fw-bold required'>Title/Reason</label>
            <input
              type='text'
              className='form-control'
              placeholder='Enter reason for leave'
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Start Date */}
          <div className='mb-7'>
            <label className='form-label fw-bold required'>Start Date & Time</label>
            <input
              type='datetime-local'
              className='form-control'
              value={formData.start_date_time}
              onChange={(e) => setFormData({ ...formData, start_date_time: e.target.value })}
              required
            />
          </div>

          {/* End Date */}
          <div className='mb-7'>
            <label className='form-label fw-bold required'>End Date & Time</label>
            <input
              type='datetime-local'
              className='form-control'
              value={formData.end_date_time}
              onChange={(e) => setFormData({ ...formData, end_date_time: e.target.value })}
              required
            />
            {formData.day_off_type === 'HALF_DAY' && (
              <div className='form-text text-warning'>
                <KTIcon iconName='information-5' className='fs-6 me-1' />
                Half day leave must be within the same day
              </div>
            )}
          </div>

          {/* Supervisor */}
          <div className='mb-7'>
            <label className='form-label fw-bold required'>Supervisor ID</label>
            <input
              type='text'
              className='form-control'
              placeholder='Enter supervisor ID'
              value={formData.supervisor_id}
              onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value })}
              required
            />
            <div className='form-text'>Enter the ID of your supervisor who will approve this request</div>
          </div>
        </div>

        <div className='card-footer d-flex justify-content-end'>
          <button
            type='button'
            className='btn btn-light me-3'
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type='submit'
            className='btn btn-success'
            disabled={loading}
          >
            {loading ? (
              <>
                <span className='spinner-border spinner-border-sm me-2'></span>
                Submitting...
              </>
            ) : (
              <>
                <KTIcon iconName='check' className='fs-3 me-2' />
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default LeaveDayForm