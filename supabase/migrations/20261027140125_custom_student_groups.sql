-- Keep the three existing IDs so all student and attendance history stays linked.
CREATE TABLE public.student_groups (
    id text PRIMARY KEY DEFAULT ('group_' || gen_random_uuid()::text),
    name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
    short_name text NOT NULL CHECK (char_length(btrim(short_name)) BETWEEN 1 AND 12),
    sort_order integer NOT NULL DEFAULT 100,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT student_groups_id_check CHECK (
        id ~ '^(nhom_[1-9][0-9]*|group_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$'
    )
);
CREATE UNIQUE INDEX student_groups_name_unique
    ON public.student_groups (lower(regexp_replace(btrim(name), '\s+', ' ', 'g')));

INSERT INTO public.student_groups (id, name, short_name, sort_order) VALUES
    ('nhom_1', 'Nhóm 1', 'N1', 1),
    ('nhom_2', 'Nhóm 2', 'N2', 2),
    ('nhom_3', 'Nhóm 3', 'N3', 3);

-- Preserve any extra IDs from earlier imports before validating foreign keys.
INSERT INTO public.student_groups (id, name, short_name)
SELECT group_id, group_id, left(group_id, 12)
FROM (
    SELECT group_id FROM public.students
    UNION SELECT group_id FROM public.sessions
    UNION SELECT group_id FROM public.lesson_plans
) existing
WHERE group_id NOT IN ('nhom_1', 'nhom_2', 'nhom_3');

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_group_id_check;
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_group_id_check;
ALTER TABLE public.lesson_plans DROP CONSTRAINT IF EXISTS lesson_plans_group_id_check;
ALTER TABLE public.students ADD CONSTRAINT students_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES public.student_groups(id) ON DELETE RESTRICT;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES public.student_groups(id) ON DELETE RESTRICT;
ALTER TABLE public.lesson_plans ADD CONSTRAINT lesson_plans_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES public.student_groups(id) ON DELETE RESTRICT;

-- Match the app's existing public, no-login access, limited to reading and adding groups.
ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.student_groups FROM anon, authenticated;
GRANT SELECT, INSERT ON public.student_groups TO anon, authenticated;
CREATE POLICY "Read groups" ON public.student_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Create groups" ON public.student_groups FOR INSERT TO anon, authenticated WITH CHECK (true);
COMMENT ON COLUMN public.students.group_id IS 'References student_groups.id';
NOTIFY pgrst, 'reload schema';
