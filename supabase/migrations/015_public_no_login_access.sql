-- Public no-login mode requested for the management app.
-- Anyone with the public Supabase URL and anon key can read or change this data.

-- Expose app tables to the Supabase anon role while keeping RLS enabled.
GRANT USAGE ON SCHEMA public, storage TO anon;
DROP POLICY IF EXISTS "Authenticated read" ON public.students;
DROP POLICY IF EXISTS "Authenticated write" ON public.students;
DROP POLICY IF EXISTS "Authenticated read" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated write" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated read" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated write" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated read" ON public.scores;
DROP POLICY IF EXISTS "Authenticated write" ON public.scores;
DROP POLICY IF EXISTS "Authenticated read" ON public.score_criteria;
DROP POLICY IF EXISTS "Authenticated write" ON public.score_criteria;
DROP POLICY IF EXISTS "Authenticated read" ON public.app_config;
DROP POLICY IF EXISTS "Authenticated write" ON public.app_config;
DROP POLICY IF EXISTS "Authenticated users can read lesson_plans" ON public.lesson_plans;
DROP POLICY IF EXISTS "Authenticated users can insert lesson_plans" ON public.lesson_plans;
DROP POLICY IF EXISTS "Authenticated users can update lesson_plans" ON public.lesson_plans;
DROP POLICY IF EXISTS "Authenticated users can delete lesson_plans" ON public.lesson_plans;
DROP POLICY IF EXISTS "Anyone can view techniques" ON public.techniques;
DROP POLICY IF EXISTS "Authenticated users can insert techniques" ON public.techniques;
DROP POLICY IF EXISTS "Authenticated users can update techniques" ON public.techniques;
DROP POLICY IF EXISTS "Authenticated users can delete techniques" ON public.techniques;

CREATE POLICY "Public full access" ON public.students
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.sessions
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.attendance
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.scores
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.score_criteria
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.app_config
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.lesson_plans
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.techniques
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.students, public.sessions, public.attendance, public.scores,
    public.score_criteria, public.app_config, public.lesson_plans, public.techniques
TO anon;

-- Keep media buckets private; the app's public media endpoint issues signed URLs.
UPDATE storage.buckets
SET public = false
WHERE id IN ('avatars', 'lesson-attachments');

DROP POLICY IF EXISTS "Anyone can view lesson attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view lesson attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload lesson attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete lesson attachments" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Delete Access" ON storage.objects;

CREATE POLICY "Public media full access" ON storage.objects
    FOR ALL TO anon, authenticated
    USING (bucket_id IN ('avatars', 'lesson-attachments'))
    WITH CHECK (bucket_id IN ('avatars', 'lesson-attachments'));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage.objects TO anon;
