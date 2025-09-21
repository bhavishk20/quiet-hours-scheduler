import React from "react";
import { Edit, Trash2, ToggleLeft, ToggleRight, Clock } from "lucide-react";
import type { Database } from "../lib/supabase";

type QuietSchedule = Database["public"]["Tables"]["quiet_schedules"]["Row"];

interface ScheduleCardProps {
  schedule: QuietSchedule;
  onEdit: (schedule: QuietSchedule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}

export default function ScheduleCard({ schedule, onEdit, onDelete, onToggle }: ScheduleCardProps) {
  const isCurrentlyActive = () => {
    if (!schedule.is_active || !schedule.start_time || !schedule.end_time || !schedule.days_of_week) return false;

    try {
      const now = new Date();
      const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const currentDay = weekdays[now.getDay()];
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [startHours, startMinutes] = schedule.start_time.split(":").map(Number);
      const [endHours, endMinutes] = schedule.end_time.split(":").map(Number);
      const startTime = startHours * 60 + startMinutes;
      const endTime = endHours * 60 + endMinutes;

      const dayMatch = schedule.days_of_week.some(
        day => day?.toLowerCase().slice(0, 3) === currentDay
      );

      if (!dayMatch) return false;

      return startTime > endTime
        ? currentTime >= startTime || currentTime <= endTime // overnight
        : currentTime >= startTime && currentTime <= endTime;
    } catch (err) {
      console.error("Error calculating active schedule:", err);
      return false;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between 
                    hover:shadow-lg transition-shadow duration-200">
      {/* Schedule Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{schedule.name}</h3>
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {schedule.start_time} - {schedule.end_time}
        </p>
        <p className="text-sm text-gray-600">
          Days: {schedule.days_of_week?.join(", ") || "N/A"}
        </p>
        {isCurrentlyActive() && (
          <p className="text-xs text-emerald-600 font-medium mt-1 animate-pulse">
            Currently Active
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onEdit(schedule)}
          aria-label="Edit schedule"
          className="p-2 text-gray-600 hover:text-indigo-600 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Edit className="h-5 w-5" />
        </button>
        <button
          onClick={() => onDelete(schedule.id)}
          aria-label="Delete schedule"
          className="p-2 text-gray-600 hover:text-red-600 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        <button
          onClick={() => onToggle(schedule.id, !schedule.is_active)}
          aria-label={schedule.is_active ? "Deactivate schedule" : "Activate schedule"}
          className="p-2 text-gray-600 hover:text-indigo-600 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {schedule.is_active ? (
            <ToggleRight className="h-5 w-5 text-indigo-600 transition-transform duration-200" />
          ) : (
            <ToggleLeft className="h-5 w-5 transition-transform duration-200" />
          )}
        </button>
      </div>
    </div>
  );
}
