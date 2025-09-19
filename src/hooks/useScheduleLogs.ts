import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type ScheduleLog = {
  id: string
  schedule_id: string
  action: string
  details: string | null
  timestamp: string
  user_id: string
}

export function useScheduleLogs(userId: string | undefined) {
  const [logs, setLogs] = useState<ScheduleLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    fetchLogs()

    // Subscribe to real-time log changes
    const channel = supabase
      .channel('schedule_logs')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'schedule_logs', filter: `user_id=eq.${userId}` },
        () => {
          fetchLogs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const fetchLogs = async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('schedule_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50)

      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setLoading(false)
    }
  }

  return { logs, loading }
}