import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/supabase";

type QuietSchedule = Database["public"]["Tables"]["quiet_schedules"]["Row"];
type ScheduleInsert = Database["public"]["Tables"]["quiet_schedules"]["Insert"];
type ScheduleUpdate = Database["public"]["Tables"]["quiet_schedules"]["Update"];

export function useSchedules(userId: string | undefined) {
  const [schedules, setSchedules] = useState<QuietSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch schedules function
  const fetchSchedules = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("quiet_schedules")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Fetched schedules for user:", userId, data);
      setSchedules(data || []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch schedules";
      console.error(message, err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    fetchSchedules();

    // Real-time subscription
    const channel = supabase
      .channel("quiet_schedules")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiet_schedules", filter: `user_id=eq.${userId}` },
        () => {
          if (isMounted) fetchSchedules();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId, fetchSchedules]);

  // CRUD operations
  const createSchedule = async (schedule: Omit<ScheduleInsert, "user_id">) => {
    if (!userId) return { data: null, error: "No user ID" };
    try {
      const { data, error } = await supabase
        .from("quiet_schedules")
        .insert({ ...schedule, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      await logScheduleAction(data.id, "created", `Schedule "${data.name}" created`);
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create schedule";
      console.error(message, err);
      return { data: null, error: message };
    }
  };

  const updateSchedule = async (id: string, updates: ScheduleUpdate) => {
    try {
      const { data, error } = await supabase
        .from("quiet_schedules")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      await logScheduleAction(id, "updated", `Schedule "${data.name}" updated`);
      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update schedule";
      console.error(message, err);
      return { data: null, error: message };
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const schedule = schedules.find((s) => s.id === id);
      const { error } = await supabase.from("quiet_schedules").delete().eq("id", id);

      if (error) throw error;
      if (schedule) await logScheduleAction(id, "deleted", `Schedule "${schedule.name}" deleted`);

      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete schedule";
      console.error(message, err);
      return { error: message };
    }
  };

  const logScheduleAction = async (scheduleId: string, action: string, details: string) => {
    if (!userId) return;
    try {
      await supabase
        .from("schedule_logs")
        .insert({ schedule_id: scheduleId, action, details, user_id: userId });
    } catch (err) {
      console.error("Failed to log schedule action:", err);
    }
  };

  return {
    schedules,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    refreshSchedules: fetchSchedules,
  };
}
