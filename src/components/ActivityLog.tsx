import React from 'react'
import { Activity, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useScheduleLogs } from '../hooks/useScheduleLogs'

interface ActivityLogProps {
  userId: string
}

export default function ActivityLog({ userId }: ActivityLogProps) {
  const { logs, loading } = useScheduleLogs(userId)

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <div className="w-2 h-2 bg-green-500 rounded-full" />
      case 'updated': return <div className="w-2 h-2 bg-blue-500 rounded-full" />
      case 'deleted': return <div className="w-2 h-2 bg-red-500 rounded-full" />
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'text-green-700'
      case 'updated': return 'text-blue-700'
      case 'deleted': return 'text-red-700'
      default: return 'text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <div className="flex-1 h-4 bg-gray-300 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </div>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm">No activity yet</p>
        ) : (
          logs.slice(0, 10).map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3"
              aria-label={`${log.action} - ${log.details} - ${formatDistanceToNow(new Date(log.timestamp))} ago`}
            >
              <div className="mt-2">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${getActionColor(log.action)}`}>
                  {log.details}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {logs.length > 10 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Showing 10 most recent activities
          </p>
        </div>
      )}
    </div>
  )
}
