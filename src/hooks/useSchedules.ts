import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type QuietSchedule = Database['public']['Tables']['quiet_schedules']['Row']
type ScheduleInsert = Database['public']['Tables']['quiet_schedules']['Insert']
type ScheduleUpdate = Database['public']['Tables']['quiet_schedules']['Update']

export function useSchedules(userId: string | undefined) {
  const [schedules, setSchedules] = useState<QuietSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    fetchSchedules()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('quiet_schedules')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'quiet_schedules', filter: `user_id=eq.${userId}` },
        () => {
          fetchSchedules()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const fetchSchedules = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('quiet_schedules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSchedules(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules')
    } finally {
      setLoading(false)
    }
  }

  const createSchedule = async (schedule: Omit<ScheduleInsert, 'user_id'>) => {
    if (!userId) return { error: 'No user ID' }

    try {
      const { data, error } = await supabase
        .from('quiet_schedules')
        .insert({ ...schedule, user_id: userId })
        .select()
        .single()

      if (error) throw error

      // Log the creation
      await logScheduleAction(data.id, 'created', `Schedule "${data.name}" created`)
      
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create schedule' }
    }
  }

  const updateSchedule = async (id: string, updates: ScheduleUpdate) => {
    try {
      const { data, error } = await supabase
        .from('quiet_schedules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Log the update
      await logScheduleAction(id, 'updated', `Schedule "${data.name}" updated`)

      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update schedule' }
    }
  }

  const deleteSchedule = async (id: string) => {
    try {
      const schedule = schedules.find(s => s.id === id)
      const { error } = await supabase
        .from('quiet_schedules')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Log the deletion
      if (schedule) {
        await logScheduleAction(id, 'deleted', `Schedule "${schedule.name}" deleted`)
      }

      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete schedule' }
    }
  }

  const logScheduleAction = async (scheduleId: string, action: string, details: string) => {
    if (!userId) return

    await supabase
      .from('schedule_logs')
      .insert({
        schedule_id: scheduleId,
        action,
        details,
        user_id: userId
      })
  }

  return {
    schedules,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refreshSchedules: fetchSchedules
  }
}