-- 005_performance_indexes.sql
-- Run this in the Supabase SQL Editor to improve application query performance

-- 1. Index for attendance and sessions to speed up daily queries and student lookups
CREATE INDEX IF NOT EXISTS sessions_date_idx ON sessions(session_date);
CREATE INDEX IF NOT EXISTS attendance_session_idx ON attendance(session_id);
CREATE INDEX IF NOT EXISTS attendance_student_idx ON attendance(student_id);

-- 2. Index for scores table to speed up ranking calculations
CREATE INDEX IF NOT EXISTS scores_week_idx ON scores(week_key);
CREATE INDEX IF NOT EXISTS scores_student_idx ON scores(student_id);

-- 3. Index for students table to speed up group listing
CREATE INDEX IF NOT EXISTS students_group_idx ON students(group_id);
