import React, { useState, useEffect } from 'react'
import { X, Clock, Calendar, Bell, Save } from 'lucide-react'
import type { Database } from '../lib/supabase'

type QuietSchedule = Database['public']['Tables']['quiet_schedules']['Row']

type ScheduleFormData = {
  name: string
  description: string
  start_time: string
  end_time: string
  days_of_week: string[]
  is_active: boolean
  email_notifications: boolean
}

interface ScheduleFormProps {
  schedule?: QuietSchedule
  onSave: (schedule: ScheduleFormData) => Promise<void>
  onCancel: () => void
}

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday', short: 'Mon' },
  { id: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { id: 'thursday', label: 'Thursday', short: 'Thu' },
  { id: 'friday', label: 'Friday', short: 'Fri' },
  { id: 'saturday', label: 'Saturday', short: 'Sat' },
  { id: 'sunday', label: 'Sunday', short: 'Sun' }
]

export default function ScheduleForm({ schedule, onSave, onCancel }: ScheduleFormProps) {
  const [formData, setFormData] = useState<ScheduleFormData>({
    name: '',
    description: '',
    start_time: '22:00',
    end_time: '08:00',
    days_of_week: [],
    is_active: true,
    email_notifications: true
  })
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (schedule) {
      setFormData({
        name: schedule.name,
        description: schedule.description || '',
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        days_of_week: schedule.days_of_week,
        is_active: schedule.is_active,
        email_notifications: schedule.email_notifications
      })
    }
  }, [schedule])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.days_of_week.length === 0) {
      setFormError('Please select at least one day of the week')
      return
    }

    const [startH, startM] = formData.start_time.split(':').map(Number)
    const [endH, endM] = formData.end_time.split(':').map(Number)
    if (startH === endH && startM === endM) {
      setFormError('Start and end time cannot be the same.')
      return
    }

    setFormError(null)
    setLoading(true)
    try {
      await onSave(formData)
    } finally {
      setLoading(false)
    }
  }

  const toggleDay = (dayId: string) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(dayId)
        ? prev.days_of_week.filter(d => d !== dayId)
        : [...prev.days_of_week, dayId]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {schedule ? 'Edit Schedule' : 'Create New Schedule'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close form"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {formError && <p className="text-red-600 text-sm">{formError}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="e.g., Night Quiet Hours"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Brief description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Start Time
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                End Time
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Calendar className="inline h-4 w-4 mr-1" />
              Days of Week
            </label>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.days_of_week.includes(day.id)
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-pressed={formData.days_of_week.includes(day.id)}
                >
                  <span className="hidden md:inline">{day.label}</span>
                  <span className="md:hidden">{day.short}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Schedule is active
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="email_notifications"
                checked={formData.email_notifications}
                onChange={(e) => setFormData(prev => ({ ...prev, email_notifications: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-700">
                <Bell className="inline h-4 w-4 mr-1" />
                Send email notifications
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  {schedule ? 'Update Schedule' : 'Create Schedule'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
