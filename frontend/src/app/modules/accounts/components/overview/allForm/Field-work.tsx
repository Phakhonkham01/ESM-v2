import React, { useState } from 'react'
import { KTIcon } from '../../../../../../_metronic/helpers'
import { createOTFieldWorkRequest } from '../../_core/_requests'
import { useAuth } from '../../../../auth'

interface FieldWorkProps {
  onClose: () => void
  onSuccess?: () => void
}

const FieldWork: React.FC<FieldWorkProps> = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    supervisor_id: '',
    date: '',
    start_hour: '',
    end_hour: '',
    fuel: '',
    reason: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser?._id) {
      alert('User not found')
      return
    }

    if (!formData.supervisor_id || !formData.date || !formData.start_hour || !formData.end_hour || !formData.fuel) {
      alert('Please fill in all required fields')
      return
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(formData.start_hour) || !timeRegex.test(formData.end_hour)) {
      alert('Invalid time format. Please use HH:mm format (e.g., 08:00)')
      return
    }

    // Validate end time is after start time
    const [startH, startM] = formData.start_hour.split(':').map(Number)
    const [endH, endM] = formData.end_hour.split(':').map(Number)
    if (endH * 60 + endM <= startH * 60 + startM) {
      alert('End time must be later than start time')
      return
    }

    // Validate fuel price
    const fuelPrice = Number(formData.fuel)
    if (isNaN(fuelPrice) || fuelPrice <= 0) {
      alert('Fuel price must be a valid positive number')
      return
    }

    try {
      setLoading(true)
      
      await createOTFieldWorkRequest({
        user_id: currentUser._id,
        supervisor_id: formData.supervisor_id,
        date: formData.date,
        title: 'FIELD_WORK',
        start_hour: formData.start_hour,
        end_hour: formData.end_hour,
        fuel: fuelPrice,
        reason: formData.reason,
      })

      alert('Field work request submitted successfully!')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      alert(error.message || 'Failed to submit field work request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='card'>
      <div className='card-header' style={{ background: 'linear-gradient(135deg, #009ef7 0%, #0088d1 100%)' }}>
        <h3 className='card-title text-white'>
          <KTIcon iconName='geolocation' className='fs-2 text-white me-2' />
          Field Work Request
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
          {/* Date */}
          <div className='mb-7'>
            <label className='form-label fw-bold required'>Work Date</label>
            <input
              type='date'
              className='form-control'
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* Start Hour */}
          <div className='mb-7'>
            <label className='form-label fw-bold required'>Start Time</label>
            <input
              type='time'
              className='form-control'
              value={formData.start_hour}
              onChange={(e) => setFormData({ ...formData, start_hour: e.target.value })}
              required
            />
            <div className='form-text'>Format: HH:mm (e.g., 08:00)</div>
          </div>

          {/* End Hour */}
          <div className='mb-7'>
            <label className='form-label fw-bold required'>End Time</label>
            <input
              type='time'
              className='form-control'
              value={formData.end_hour}
              onChange={(e) => setFormData({ ...formData, end_hour: e.target.value })}
              required
            />
            <div className='form-text'>Must be later than start time</div>
          </div>

          {/* Fuel Price */}
          <div className='mb-7'>
            <label className='form-label fw-bold required'>Fuel Cost (LAK)</label>
            <div className='input-group'>
              <span className='input-group-text'>
                <KTIcon iconName='oil' className='fs-3' />
              </span>
              <input
                type='number'
                className='form-control'
                placeholder='Enter fuel cost'
                value={formData.fuel}
                onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                min='1'
                step='0.01'
                required
              />
              <span className='input-group-text'>LAK</span>
            </div>
            <div className='form-text'>
              <KTIcon iconName='information-5' className='fs-6 me-1' />
              Enter the total fuel cost for this field work
            </div>
          </div>

          {/* Reason */}
          <div className='mb-7'>
            <label className='form-label fw-bold'>Purpose/Location (Optional)</label>
            <textarea
              className='form-control'
              rows={3}
              placeholder='Describe the purpose and location of field work'
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
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
            className='btn btn-primary'
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

export default FieldWork