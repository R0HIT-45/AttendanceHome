-- ===================================================
-- LAMS Database Schema - Supabase SQL Script
-- Run this in Supabase Dashboard → SQL Editor
-- ===================================================

-- Create labours table
CREATE TABLE IF NOT EXISTS labours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  aadhaar TEXT UNIQUE NOT NULL,
  photo_url TEXT,
  joining_date DATE  NOT NULL,
  daily_wage DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  designation TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  labour_id UUID REFERENCES labours(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'half-day')) NOT NULL,
  wage_calculated DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(labour_id, date)
);

-- ===================================================
-- Row Level Security (RLS) Policies
-- ===================================================

-- Enable RLS on labours table
ALTER TABLE labours ENABLE ROW LEVEL SECURITY;

-- Labours: Users can view their own labours
CREATE POLICY "Users can view their own labours"
  ON labours FOR SELECT
  USING (auth.uid() = user_id);

-- Labours: Users can insert their own labours
CREATE POLICY "Users can insert their own labours"
  ON labours FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Labours: Users can update their own labours
CREATE POLICY "Users can update their own labours"
  ON labours FOR UPDATE
  USING (auth.uid() = user_id);

-- Labours: Users can delete their own labours
CREATE POLICY "Users can delete their own labours"
  ON labours FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on attendance_records table
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Attendance: Users can view their own attendance records
CREATE POLICY "Users can view their own attendance records"
  ON attendance_records FOR SELECT
  USING (auth.uid() = user_id);

-- Attendance: Users can insert their own attendance records
CREATE POLICY "Users can insert their own attendance records"
  ON attendance_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Attendance: Users can update their own attendance records
CREATE POLICY "Users can update their own attendance records"
  ON attendance_records FOR UPDATE
  USING (auth.uid() = user_id);

-- Attendance: Users can delete their own attendance records
CREATE POLICY "Users can delete their own attendance records"
  ON attendance_records FOR DELETE
  USING (auth.uid() = user_id);

-- ===================================================
-- Indexes for better performance
-- ===================================================

CREATE INDEX IF NOT EXISTS idx_labours_user_id ON labours(user_id);
CREATE INDEX IF NOT EXISTS idx_labours_status ON labours(status);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_labour_id ON attendance_records(labour_id);

-- ===================================================
-- Function to automatically set updated_at timestamp
-- ===================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_labours_updated_at
BEFORE UPDATE ON labours
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- Done! Your database is ready to use.
-- ===================================================
