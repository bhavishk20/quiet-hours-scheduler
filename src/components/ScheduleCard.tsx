import React from 'react'
import { Clock, Calendar, Bell, BellOff, Edit, Trash2, Power, PowerOff } from 'lucide-react'
import { format } from 'date-fns'
import type { Database } from '../lib/supabase'

type QuietSchedule = Database['public']['Tables']['quiet_schedules']['Row']

interface ScheduleCardProps {
  schedule: QuietSchedule
  onEdit: (schedule: QuietSchedule) => void
  onDelete: (id: string) => void
  onToggle: (id: string, isActive: boolean) => void
}

export default function ScheduleCard({ schedule, onEdit, onDelete, onToggle }: ScheduleCardProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return format(date, 'h:mm a')
  }

  const formatDays = (days: string[]) => {
    const dayMap: { [key: string]: string } = {
      monday: 'Mon',
      tuesday: 'Tue', 
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    }
    
    return days.map(day => dayMap[day] || day).join(', ')
  }

  const isCurrentlyActive = () => {
    if (!schedule.is_active) return false
    
    const now = new Date()
    const currentDay = now.toLocaleLowerCase().slice(0, 3) + 'day'
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    const [startHours, startMinutes] = schedule.start_time.split(':').map(Number)
    const [endHours, endMinutes] = schedule.end_time.split(':').map(Number)
    
    const startTime = startHours * 60 + startMinutes
    const endTime = endHours * 60 + endMinutes
    
    const dayMatch = schedule.days_of_week.some(day => day.includes(currentDay.slice(0, 3)))
    
    // Handle overnight schedules
    if (startTime > endTime) {
      return dayMatch && (currentTime >= startTime || currentTime <= endTime)
    } else {
      return dayMatch && currentTime >= startTime && currentTime <= endTime
    }
  }

  const currentlyActive = isCurrentlyActive()

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${
      currentlyActive ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{schedule.name}</h3>
              {currentlyActive && (
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium">
                  Active Now
                </span>
              )}
              {!schedule.is_active && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                  Disabled
                </span>
              )}
            </div>
            {schedule.description && (
              <p className="text-gray-600 text-sm mb-3">{schedule.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggle(schedule.id, !schedule.is_active)}
              className={`p-2 rounded-lg transition-colors ${
                schedule.is_active
                  ? 'text-emerald-600 hover:bg-emerald-50'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
              title={schedule.is_active ? 'Disable schedule' : 'Enable schedule'}
            >
              {schedule.is_active ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
            </button>
            <button
              onClick={() => onEdit(schedule)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit schedule"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(schedule.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete schedule"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>{formatDays(schedule.days_of_week)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            {schedule.email_notifications ? (
              <Bell className="h-4 w-4 mr-2 text-emerald-500" />
            ) : (
              <BellOff className="h-4 w-4 mr-2 text-gray-400" />
            )}
            <span>
              {schedule.email_notifications ? 'Email notifications enabled' : 'Email notifications disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}