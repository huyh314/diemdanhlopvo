-- =============================================
-- MIGRATION 005: AUTOMATED SCORING RULES & WEEKLY RESET
-- Apply new logic for Chuyên Cần and dynamic week resolution
-- =============================================

-- =============================================
-- 1. Refactored fn_auto_chuyen_can
--    Rules: student must attend >= 3 sessions.
--    Missing sessions are penalized: -5 for excused, -10 for absent.
-- =============================================

CREATE OR REPLACE FUNCTION fn_auto_chuyen_can(
  p_student_id UUID,
  p_from_date  DATE DEFAULT NULL,
  p_to_date    DATE DEFAULT NULL
)
RETURNS NUMERIC(5,2)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_base_score NUMERIC := 30;
  v_excused_deduction NUMERIC := 5;
  v_absent_deduction NUMERIC := 10;
  v_required_sessions INT := 3;
  
  v_present INT;
  v_excused INT;
  v_absent INT;
  v_missing INT;
  v_penalty_excused INT;
  v_penalty_absent INT;
  v_score NUMERIC(5,2);
BEGIN
  -- Count attendance types
  SELECT 
    COUNT(*) FILTER (WHERE a.status = 'present'),
    COUNT(*) FILTER (WHERE a.status = 'excused'),
    COUNT(*) FILTER (WHERE a.status = 'absent')
  INTO v_present, v_excused, v_absent
  FROM attendance a
  JOIN sessions se ON se.id = a.session_id
  WHERE a.student_id = p_student_id
    AND (p_from_date IS NULL OR se.session_date >= p_from_date)
    AND (p_to_date   IS NULL OR se.session_date <= p_to_date);

  -- Calculate missing sessions vs requirement
  v_missing := GREATEST(0, v_required_sessions - COALESCE(v_present, 0));
  
  -- Apply penalties prioritizing 'excused' first to minimize deduction
  v_penalty_excused := LEAST(v_missing, COALESCE(v_excused, 0));
  v_penalty_absent := v_missing - v_penalty_excused;

  -- Calculate final score
  v_score := GREATEST(0, v_base_score - (v_penalty_excused * v_excused_deduction) - (v_penalty_absent * v_absent_deduction));

  RETURN v_score;
END;
$$;

COMMENT ON FUNCTION fn_auto_chuyen_can IS
  'Tính điểm Chuyên Cần tự động: yêu cầu 3 buổi. Thiếu thì trừ 5 (phép), 10 (vắng). Điểm tối thiểu 0.';

-- =============================================
-- 2. Helper fn_get_current_iso_week
--    Returns string like "2026-W13" based on Monday 00:00 reset
-- =============================================
CREATE OR REPLACE FUNCTION fn_get_current_iso_week()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT to_char(CURRENT_DATE, 'IYYY') || '-W' || to_char(CURRENT_DATE, 'IW');
$$;

-- =============================================
-- 3. Refactored fn_student_rankings
--    Automatically resolve to current ISO week if null.
--    Include all active students, even if they have no explicit 'scores' row yet (Lazy Evaluation).
-- =============================================

CREATE OR REPLACE FUNCTION fn_student_rankings(
  p_week_key TEXT DEFAULT NULL
)
RETURNS TABLE (
  rank         BIGINT,
  student_id   UUID,
  student_name TEXT,
  group_id     TEXT,
  week_key     TEXT,
  total        NUMERIC(6,2),
  cat_chuyen_can  NUMERIC(5,2),
  cat_y_thuc      NUMERIC(5,2),
  cat_chuyen_mon  NUMERIC(5,2),
  medal        TEXT
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_target_week TEXT;
  v_week_start DATE;
  v_week_end DATE;
BEGIN
  -- If not provided, use the current ISO week (resets automatically on Monday 12:00 AM)
  v_target_week := COALESCE(p_week_key, fn_get_current_iso_week());
  
  -- Determine date boundaries for the target ISO week (to feed into fn_auto_chuyen_can)
  v_week_start := to_date(v_target_week, 'IYYY-"W"IW');
  v_week_end := v_week_start + 6;

  RETURN QUERY
  WITH student_scores AS (
    SELECT
      s.id           AS s_id,
      s.name         AS s_name,
      s.group_id     AS s_group,
      v_target_week  AS wk,
      
      -- Auto 'Chuyên Cần' score fallback if no explicit manual score exists
      fn_auto_chuyen_can(s.id, v_week_start, v_week_end) AS auto_cc,
      
      -- Explicit scores from 'scores' table
      sc.id AS sc_id,
      sc.total AS db_total,
      
      -- Categorized criteria sum
      COALESCE(SUM(cr.value) FILTER (WHERE cr.category = 'chuyen_can'), 0) AS db_cc,
      COALESCE(SUM(cr.value) FILTER (WHERE cr.category = 'y_thuc'), 0)     AS db_y_thuc,
      COALESCE(SUM(cr.value) FILTER (WHERE cr.category = 'chuyen_mon'), 0) AS db_cm
    FROM students s
    LEFT JOIN scores sc ON sc.student_id = s.id AND sc.week_key = v_target_week
    LEFT JOIN score_criteria cr ON cr.score_id = sc.id
    WHERE s.is_active = TRUE
    GROUP BY s.id, s.name, s.group_id, sc.id, sc.total
  ),
  ranked AS (
    SELECT
      ss.s_id,
      ss.s_name,
      ss.s_group,
      ss.wk,
      CASE WHEN ss.sc_id IS NOT NULL THEN ss.db_cc ELSE ss.auto_cc END AS final_cc,
      CASE WHEN ss.sc_id IS NOT NULL THEN ss.db_y_thuc ELSE 0 END AS final_yt,
      CASE WHEN ss.sc_id IS NOT NULL THEN ss.db_cm ELSE 0 END AS final_cm,
      
      (CASE WHEN ss.sc_id IS NOT NULL THEN ss.db_cc ELSE ss.auto_cc END) +
      (CASE WHEN ss.sc_id IS NOT NULL THEN ss.db_y_thuc ELSE 0 END) +
      (CASE WHEN ss.sc_id IS NOT NULL THEN ss.db_cm ELSE 0 END) AS final_total
    FROM student_scores ss
  ),
  final_ranking AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY r.final_total DESC, r.s_name ASC) AS rank,
      r.s_id,
      r.s_name,
      r.s_group,
      r.wk,
      r.final_total,
      r.final_cc,
      r.final_yt,
      r.final_cm,
      CASE
        WHEN ROW_NUMBER() OVER (ORDER BY r.final_total DESC, r.s_name ASC) = 1 THEN '🥇'
        WHEN ROW_NUMBER() OVER (ORDER BY r.final_total DESC, r.s_name ASC) = 2 THEN '🥈'
        WHEN ROW_NUMBER() OVER (ORDER BY r.final_total DESC, r.s_name ASC) = 3 THEN '🥉'
        ELSE ''
      END AS medal
    FROM ranked r
  )
  SELECT * FROM final_ranking ORDER BY rank;
END;
$$;

COMMENT ON FUNCTION fn_student_rankings IS
  'Xếp hạng học sinh với Lazy Evaluation. Tự động chuyển tuần lúc 12:00 AM Thứ Hai & áp dụng điểm điểm danh tự động.';

-- =============================================
-- 4. NEW fn_student_average_rankings
--    Tính trung bình điểm N tuần gần nhất bằng cách gộp logic Lazy Evaluation
-- =============================================

CREATE OR REPLACE FUNCTION fn_student_average_rankings(
  p_weeks INT DEFAULT 4
)
RETURNS TABLE (
  rank         BIGINT,
  student_id   UUID,
  student_name TEXT,
  group_id     TEXT,
  weeks_count  INT,
  avg_total    NUMERIC(6,2),
  avg_cc       NUMERIC(5,2),
  avg_yt       NUMERIC(5,2),
  avg_cm       NUMERIC(5,2),
  medal        TEXT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH recent_weeks AS (
    SELECT 
      to_char(CURRENT_DATE - (7 * g.i), 'IYYY') || '-W' || to_char(CURRENT_DATE - (7 * g.i), 'IW') AS wk,
      CURRENT_DATE - (7 * g.i) AS base_date
    FROM generate_series(0, p_weeks - 1) AS g(i)
  ),
  student_weekly_scores AS (
    SELECT
      s.id           AS s_id,
      s.name         AS s_name,
      s.group_id     AS s_group,
      rw.wk          AS wk,
      
      -- Auto fallback
      fn_auto_chuyen_can(
        s.id, 
        to_date(rw.wk, 'IYYY-"W"IW'), 
        to_date(rw.wk, 'IYYY-"W"IW') + 6
      ) AS auto_cc,
      
      sc.id AS sc_id,
      COALESCE(SUM(cr.value) FILTER (WHERE cr.category = 'chuyen_can'), 0) AS db_cc,
      COALESCE(SUM(cr.value) FILTER (WHERE cr.category = 'y_thuc'), 0)     AS db_y_thuc,
      COALESCE(SUM(cr.value) FILTER (WHERE cr.category = 'chuyen_mon'), 0) AS db_cm
    FROM students s
    CROSS JOIN recent_weeks rw
    LEFT JOIN scores sc ON sc.student_id = s.id AND sc.week_key = rw.wk
    LEFT JOIN score_criteria cr ON cr.score_id = sc.id
    WHERE s.is_active = TRUE
    GROUP BY s.id, s.name, s.group_id, rw.wk, sc.id
  ),
  resolved_scores AS (
    SELECT
      s_id,
      s_name,
      s_group,
      CASE WHEN sc_id IS NOT NULL THEN db_cc ELSE auto_cc END AS final_cc,
      CASE WHEN sc_id IS NOT NULL THEN db_y_thuc ELSE 0 END AS final_yt,
      CASE WHEN sc_id IS NOT NULL THEN db_cm ELSE 0 END AS final_cm,
      (CASE WHEN sc_id IS NOT NULL THEN db_cc ELSE auto_cc END) +
      (CASE WHEN sc_id IS NOT NULL THEN db_y_thuc ELSE 0 END) +
      (CASE WHEN sc_id IS NOT NULL THEN db_cm ELSE 0 END) AS final_total
    FROM student_weekly_scores
  ),
  aggregated_scores AS (
    SELECT
      s_id,
      s_name,
      s_group,
      COUNT(s_id)::INT AS w_count,
      ROUND(AVG(final_total), 2) AS a_total,
      ROUND(AVG(final_cc), 2) AS a_cc,
      ROUND(AVG(final_yt), 2) AS a_yt,
      ROUND(AVG(final_cm), 2) AS a_cm
    FROM resolved_scores
    GROUP BY s_id, s_name, s_group
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY a_total DESC, s_name ASC) AS rank,
      s_id,
      s_name,
      s_group,
      w_count,
      a_total,
      a_cc,
      a_yt,
      a_cm,
      CASE
        WHEN ROW_NUMBER() OVER (ORDER BY a_total DESC, s_name ASC) = 1 THEN '🥇'
        WHEN ROW_NUMBER() OVER (ORDER BY a_total DESC, s_name ASC) = 2 THEN '🥈'
        WHEN ROW_NUMBER() OVER (ORDER BY a_total DESC, s_name ASC) = 3 THEN '🥉'
        ELSE ''
      END AS medal
    FROM aggregated_scores
  )
  SELECT * FROM ranked ORDER BY rank;
END;
$$;

COMMENT ON FUNCTION fn_student_average_rankings IS
  'Tính trung bình điểm thi đua của N tuần gần nhất, có xét kết quả auto_chuyen_can lười (Lazy Evaluation).';
