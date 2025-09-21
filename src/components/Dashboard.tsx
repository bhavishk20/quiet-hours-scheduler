import React, { useState, useEffect } from "react";
import { Plus, Moon, Settings, LogOut, User, Clock } from "lucide-react";
import { useAuthContext } from "../App";
import { useSchedules } from "../hooks/useSchedules";
import ScheduleForm from "./ScheduleForm";
import ScheduleCard from "./ScheduleCard";
import ActivityLog from "./ActivityLog";
import type { Database } from "../lib/supabase";

type QuietSchedule = Database["public"]["Tables"]["quiet_schedules"]["Row"];

export default function Dashboard() {
  const { user, signOut } = useAuthContext();
  const { schedules, loading, createSchedule, updateSchedule, deleteSchedule } = useSchedules(user?.id);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<QuietSchedule | undefined>();
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (formData: Partial<QuietSchedule>) => {
    if (!user) return;
    try {
      if (editingSchedule) {
        const { error } = await updateSchedule(editingSchedule.id, formData);
        if (error) throw new Error(error);
      } else {
        const { error } = await createSchedule(formData);
        if (error) throw new Error(error);
      }
      setShowForm(false);
      setEditingSchedule(undefined);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save schedule";
      console.error(message, err);
      setError(message);
    }
  };

  const handleEdit = (schedule: QuietSchedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;
    try {
      const { error } = await deleteSchedule(id);
      if (error) throw new Error(error);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete schedule";
      console.error(message, err);
      setError(message);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const { error } = await updateSchedule(id, { is_active: isActive });
      if (error) throw new Error(error);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to toggle schedule";
      console.error(message, err);
      setError(message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSchedule(undefined);
  };

  const activeSchedules = schedules.filter((s) => s.is_active);

  // Check which schedules are currently active
  const currentlyActive = schedules.filter((s) => {
    if (!s.is_active || !s.start_time || !s.end_time || !s.days_of_week) return false;
    try {
      const now = new Date();
      const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const currentDay = weekdays[now.getDay()];
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] = s.start_time.split(":").map(Number);
      const [endH, endM] = s.end_time.split(":").map(Number);
      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM;

      const isToday = s.days_of_week.some((d) => d.toLowerCase().slice(0, 3) === currentDay);
      if (!isToday) return false;

      return startTime > endTime
        ? currentTime >= startTime || currentTime <= endTime
        : currentTime >= startTime && currentTime <= endTime;
    } catch {
      return false;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 rounded-lg p-2">
                <Moon className="h-6 w-6 text-indigo-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Quiet Hours Scheduler</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 rounded-lg p-3">
                <Settings className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Schedules</p>
                <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 rounded-lg p-3">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Schedules</p>
                <p className="text-2xl font-bold text-gray-900">{activeSchedules.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-3 ${currentlyActive.length > 0 ? "bg-amber-100" : "bg-gray-100"}`}>
                <Moon className={`h-6 w-6 ${currentlyActive.length > 0 ? "text-amber-600" : "text-gray-600"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Currently Active</p>
                <p className="text-2xl font-bold text-gray-900">{currentlyActive.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Schedules */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your Schedules</h2>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
              >
                <Plus className="h-5 w-5" />
                New Schedule
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : schedules.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
                  <Moon className="h-12 w-12 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No schedules yet</h3>
                <p className="text-gray-600 mb-6">Create your first quiet hours schedule to get started.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  Create Schedule
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="lg:col-span-1">{user && <ActivityLog userId={user.id} />}</div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && <ScheduleForm schedule={editingSchedule} onSave={handleSave} onCancel={handleCancel} />}

      {/* Global Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow cursor-pointer" onClick={() => setError(null)}>
          {error}
        </div>
      )}
    </div>
  );
}
