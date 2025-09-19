/*
  # Quiet Hours Scheduler Database Schema

  1. New Tables
    - `quiet_schedules`
      - `id` (uuid, primary key)
      - `name` (text, schedule name)
      - `description` (text, optional description)
      - `start_time` (text, HH:MM format)
      - `end_time` (text, HH:MM format)
      - `days_of_week` (text[], array of day names)
      - `is_active` (boolean, whether schedule is enabled)
      - `email_notifications` (boolean, whether to send emails)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `schedule_logs`
      - `id` (uuid, primary key)
      - `schedule_id` (uuid, references quiet_schedules)
      - `action` (text, action type)
      - `details` (text, action details)
      - `timestamp` (timestamptz)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own schedules and logs

  3. Indexes
    - Add indexes for efficient querying by user_id
    - Add index for schedule logs by timestamp
*/

-- Create quiet_schedules table
CREATE TABLE IF NOT EXISTS quiet_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_time text NOT NULL,
  end_time text NOT NULL,
  days_of_week text[] NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create schedule_logs table
CREATE TABLE IF NOT EXISTS schedule_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES quiet_schedules(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  details text,
  timestamp timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE quiet_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for quiet_schedules
CREATE POLICY "Users can view own schedules"
  ON quiet_schedules
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own schedules"
  ON quiet_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
  ON quiet_schedules
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
  ON quiet_schedules
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for schedule_logs
CREATE POLICY "Users can view own logs"
  ON schedule_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own logs"
  ON schedule_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS quiet_schedules_user_id_idx ON quiet_schedules(user_id);
CREATE INDEX IF NOT EXISTS quiet_schedules_is_active_idx ON quiet_schedules(is_active);
CREATE INDEX IF NOT EXISTS schedule_logs_user_id_idx ON schedule_logs(user_id);
CREATE INDEX IF NOT EXISTS schedule_logs_timestamp_idx ON schedule_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS schedule_logs_schedule_id_idx ON schedule_logs(schedule_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_quiet_schedules_updated_at'
  ) THEN
    CREATE TRIGGER update_quiet_schedules_updated_at
      BEFORE UPDATE ON quiet_schedules
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;