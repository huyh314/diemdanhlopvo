-- =============================================
-- MIGRATION: Technique Library
-- =============================================

-- 1. Create table `techniques`
CREATE TABLE techniques (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    media_url text NOT NULL,
    media_type text DEFAULT 'image', -- 'image' | 'video' 
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Add technique_ids column to lesson_plans
ALTER TABLE lesson_plans
ADD COLUMN IF NOT EXISTS technique_ids text[] NOT NULL DEFAULT '{}';

-- 3. RLS for techniques
ALTER TABLE techniques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view techniques"
ON techniques FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert techniques"
ON techniques FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update techniques"
ON techniques FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete techniques"
ON techniques FOR DELETE
TO authenticated
USING (true);
