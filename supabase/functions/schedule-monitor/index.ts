/*
  # Schedule Monitor Edge Function

  This function monitors active schedules and triggers notifications.
  It's designed to be called periodically (every minute) to check for:
  1. Schedules that should start soon (15 min reminder)
  2. Schedules that are starting now
  3. Schedules that are ending now

  This simulates CRON-like functionality for schedule monitoring.
*/

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

interface Schedule {
  id: string
  name: string
  start_time: string
  end_time: string
  days_of_week: string[]
  is_active: boolean
  email_notifications: boolean
  user_id: string
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current time info
    const now = new Date()
    const currentDay = now.toLocaleLowerCase().slice(0, 3) + 'day' // e.g., "monday"
    const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight
    const reminderTime = currentTime + 15 // 15 minutes from now

    // Fetch all active schedules with email notifications enabled
    const { data: schedules, error: schedulesError } = await supabaseClient
      .from('quiet_schedules')
      .select('*')
      .eq('is_active', true)
      .eq('email_notifications', true)

    if (schedulesError) {
      throw new Error(`Failed to fetch schedules: ${schedulesError.message}`)
    }

    const notifications: Array<{
      type: 'start' | 'end' | 'reminder'
      schedule: Schedule
      userEmail: string
    }> = []

    // Check each schedule
    for (const schedule of schedules || []) {
      // Check if schedule applies to current day
      const dayMatches = schedule.days_of_week.some(day => 
        day.toLowerCase().includes(currentDay.slice(0, 3))
      )

      if (!dayMatches) continue

      // Get user email
      const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(schedule.user_id)
      if (userError || !userData.user?.email) continue

      const userEmail = userData.user.email

      // Parse schedule times
      const [startHours, startMinutes] = schedule.start_time.split(':').map(Number)
      const [endHours, endMinutes] = schedule.end_time.split(':').map(Number)
      
      const startTime = startHours * 60 + startMinutes
      const endTime = endHours * 60 + endMinutes

      // Check for start notifications (exact time)
      if (Math.abs(currentTime - startTime) <= 1) {
        notifications.push({
          type: 'start',
          schedule,
          userEmail
        })
      }

      // Check for end notifications (exact time)
      if (Math.abs(currentTime - endTime) <= 1) {
        notifications.push({
          type: 'end',
          schedule,
          userEmail
        })
      }

      // Check for reminder notifications (15 minutes before start)
      if (Math.abs(reminderTime - startTime) <= 1) {
        notifications.push({
          type: 'reminder',
          schedule,
          userEmail
        })
      }
    }

    // Send notifications
    const results = []
    for (const notification of notifications) {
      try {
        // Call the notification function
        const notificationResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/schedule-notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            type: notification.type,
            scheduleId: notification.schedule.id,
            userEmail: notification.userEmail,
            scheduleName: notification.schedule.name,
            time: notification.type === 'start' ? notification.schedule.start_time : 
                  notification.type === 'end' ? notification.schedule.end_time : 
                  notification.schedule.start_time
          })
        })

        const result = await notificationResponse.json()
        results.push({
          scheduleId: notification.schedule.id,
          type: notification.type,
          success: notificationResponse.ok,
          result
        })

      } catch (error) {
        results.push({
          scheduleId: notification.schedule.id,
          type: notification.type,
          success: false,
          error: error.message
        })
      }
    }

    const response = {
      success: true,
      timestamp: now.toISOString(),
      schedulesChecked: schedules?.length || 0,
      notificationsSent: notifications.length,
      results
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Schedule monitor error:', error)

    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 500,
      }
    )
  }
})