-- =============================================
-- MIGRATION 001: NORMALIZED SCHEMA
-- Võ Đường Manager — Supabase
-- =============================================

-- =============================================
-- 0. CLEANUP (bỏ các bảng cũ nếu có)
-- =============================================
DROP TABLE IF EXISTS score_criteria CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS app_config CASCADE;

-- =============================================
-- 1. STUDENTS (master data)
-- =============================================
CREATE TABLE IF NOT EXISTS students (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  group_id   TEXT NOT NULL DEFAULT 'nhom_1'
             CHECK (group_id IN ('nhom_1', 'nhom_2', 'nhom_3')),
  birth_year TEXT DEFAULT '',
  phone      TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  schedule   INTEGER[] DEFAULT '{}',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  students IS 'Danh sách học sinh võ đường';
COMMENT ON COLUMN students.group_id IS 'nhom_1 | nhom_2 | nhom_3';
COMMENT ON COLUMN students.schedule IS 'Các thứ trong tuần học sinh tập: [2,4,6]';

-- =============================================
-- 2. SESSIONS (buổi tập)
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL,
  day_of_week  SMALLINT NOT NULL GENERATED ALWAYS AS (EXTRACT(ISODOW FROM session_date)::SMALLINT) STORED,
  group_id     TEXT NOT NULL DEFAULT 'nhom_1'
               CHECK (group_id IN ('nhom_1', 'nhom_2', 'nhom_3')),
  notes        TEXT DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sessions IS 'Buổi tập — mỗi ngày mỗi nhóm 1 record';

-- Prevent duplicate sessions per day per group
CREATE UNIQUE INDEX IF NOT EXISTS uq_sessions_date_group
  ON sessions (session_date, group_id);

-- =============================================
-- 3. ATTENDANCE (điểm danh)
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'absent'
             CHECK (status IN ('present', 'absent', 'excused')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (student_id, session_id)
);

COMMENT ON TABLE attendance IS 'Điểm danh theo buổi — 1 record / học sinh / buổi';

-- =============================================
-- 4. SCORES (điểm thi đua tuần)
-- =============================================
CREATE TABLE IF NOT EXISTS scores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  week_key   TEXT NOT NULL,  -- e.g. '2026-W12'
  total      NUMERIC(6,2) NOT NULL DEFAULT 0,
  notes      TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (student_id, week_key)
);

COMMENT ON TABLE  scores IS 'Bảng điểm thi đua theo tuần';
COMMENT ON COLUMN scores.week_key IS 'ISO week: YYYY-Www (e.g. 2026-W12)';

-- =============================================
-- 5. SCORE_CRITERIA (chi tiết từng tiêu chí)
-- =============================================
CREATE TABLE IF NOT EXISTS score_criteria (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_id      UUID NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
  category      TEXT NOT NULL
                CHECK (category IN ('chuyen_can', 'y_thuc', 'chuyen_mon')),
  criterion_key TEXT NOT NULL,       -- e.g. '1-1', '2-1', '3-2'
  label         TEXT NOT NULL DEFAULT '',
  value         NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_value     NUMERIC(5,2) NOT NULL DEFAULT 10,
  deductions    JSONB DEFAULT '[]',  -- [{reason, amount, date}]

  UNIQUE (score_id, criterion_key)
);

COMMENT ON TABLE  score_criteria IS 'Chi tiết điểm từng tiêu chí con';
COMMENT ON COLUMN score_criteria.category IS 'chuyen_can | y_thuc | chuyen_mon';
COMMENT ON COLUMN score_criteria.deductions IS 'Danh sách vi phạm: [{reason, amount, date}]';

-- =============================================
-- 6. APP_CONFIG (cấu hình)
-- =============================================
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_students_group     ON students (group_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_students_active    ON students (is_active, name);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance (student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance (session_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_date      ON sessions (session_date DESC, group_id);
CREATE INDEX IF NOT EXISTS idx_scores_student     ON scores (student_id, week_key DESC);
CREATE INDEX IF NOT EXISTS idx_scores_week        ON scores (week_key DESC, total DESC);
CREATE INDEX IF NOT EXISTS idx_criteria_score     ON score_criteria (score_id, category);

-- =============================================
-- TRIGGERS: auto-update updated_at
-- =============================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_scores_updated_at
  BEFORE UPDATE ON scores
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE students       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance     ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config     ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all data
CREATE POLICY "Authenticated read"  ON students       FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read"  ON sessions       FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read"  ON attendance     FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read"  ON scores         FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read"  ON score_criteria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read"  ON app_config     FOR SELECT TO authenticated USING (true);

-- Authenticated users can insert/update/delete
CREATE POLICY "Authenticated write" ON students       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write" ON sessions       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write" ON attendance     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write" ON scores         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write" ON score_criteria FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated write" ON app_config     FOR ALL TO authenticated USING (true) WITH CHECK (true);
