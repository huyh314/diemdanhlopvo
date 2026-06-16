-- =============================================
-- MIGRATION 003: STRICT RLS UPGRADE
-- Võ Đường Manager — Supabase
-- Target: Apply strict auth.uid() / authenticated role checks
-- =============================================

-- =============================================
-- DROP PREVIOUS PERMISSIVE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Authenticated read" ON students;
DROP POLICY IF EXISTS "Authenticated read" ON sessions;
DROP POLICY IF EXISTS "Authenticated read" ON attendance;
DROP POLICY IF EXISTS "Authenticated read" ON scores;
DROP POLICY IF EXISTS "Authenticated read" ON score_criteria;
DROP POLICY IF EXISTS "Authenticated read" ON app_config;

DROP POLICY IF EXISTS "Authenticated write" ON students;
DROP POLICY IF EXISTS "Authenticated write" ON sessions;
DROP POLICY IF EXISTS "Authenticated write" ON attendance;
DROP POLICY IF EXISTS "Authenticated write" ON scores;
DROP POLICY IF EXISTS "Authenticated write" ON score_criteria;
DROP POLICY IF EXISTS "Authenticated write" ON app_config;

-- =============================================
-- APPLY STRICT POLICIES
-- Require auth.role() = 'authenticated' to prevent anon/public access
-- =============================================

-- Read Policies
CREATE POLICY "Authenticated read" ON students       FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON sessions       FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON attendance     FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON scores         FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON score_criteria FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON app_config     FOR SELECT USING (auth.role() = 'authenticated');

-- Write Policies
CREATE POLICY "Authenticated write" ON students       FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON sessions       FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON attendance     FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON scores         FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON score_criteria FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated write" ON app_config     FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- ADDITIONAL INDEXES (PERFORMANCE TUNING)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_sessions_group_date ON sessions (group_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_score_criteria_score ON score_criteria (score_id);
