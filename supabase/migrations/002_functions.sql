-- =============================================
-- MIGRATION 002: FUNCTIONS, VIEWS & QUERIES
-- Võ Đường Manager — PostgreSQL Best Practices
-- =============================================

-- =============================================
-- 1. fn_attendance_stats
--    Thống kê điểm danh theo student/group/khoảng thời gian
-- =============================================

CREATE OR REPLACE FUNCTION fn_attendance_stats(
  p_student_id UUID    DEFAULT NULL,
  p_group_id   TEXT    DEFAULT NULL,
  p_from_date  DATE    DEFAULT NULL,
  p_to_date    DATE    DEFAULT NULL
)
RETURNS TABLE (
  student_id    UUID,
  student_name  TEXT,
  group_id      TEXT,
  total_sessions BIGINT,
  present_count  BIGINT,
  absent_count   BIGINT,
  excused_count  BIGINT,
  attendance_rate NUMERIC(5,2)
)
LANGUAGE sql STABLE
AS $$
  SELECT
    s.id                                        AS student_id,
    s.name                                      AS student_name,
    s.group_id                                  AS group_id,
    COUNT(a.id)                                 AS total_sessions,
    COUNT(a.id) FILTER (WHERE a.status = 'present')  AS present_count,
    COUNT(a.id) FILTER (WHERE a.status = 'absent')   AS absent_count,
    COUNT(a.id) FILTER (WHERE a.status = 'excused')  AS excused_count,
    CASE
      WHEN COUNT(a.id) = 0 THEN 0
      ELSE ROUND(
        COUNT(a.id) FILTER (WHERE a.status = 'present')::NUMERIC
        / COUNT(a.id) * 100, 2
      )
    END                                         AS attendance_rate
  FROM students s
  LEFT JOIN attendance a ON a.student_id = s.id
  LEFT JOIN sessions se ON se.id = a.session_id
  WHERE s.is_active = TRUE
    AND (p_student_id IS NULL OR s.id = p_student_id)
    AND (p_group_id   IS NULL OR s.group_id = p_group_id)
    AND (p_from_date  IS NULL OR se.session_date >= p_from_date)
    AND (p_to_date    IS NULL OR se.session_date <= p_to_date)
  GROUP BY s.id, s.name, s.group_id
  ORDER BY s.name;
$$;

COMMENT ON FUNCTION fn_attendance_stats IS
  'Tính tỉ lệ chuyên cần. Truyền NULL = tất cả.';

-- =============================================
-- 2. fn_auto_chuyen_can
--    Tự động tính điểm Chuyên Cần từ dữ liệu điểm danh
--    Rule: 30 - (5 × excused) - (10 × absent), min 0
-- =============================================

CREATE OR REPLACE FUNCTION fn_auto_chuyen_can(
  p_student_id UUID,
  p_from_date  DATE DEFAULT NULL,
  p_to_date    DATE DEFAULT NULL
)
RETURNS NUMERIC(5,2)
LANGUAGE sql STABLE
AS $$
  SELECT GREATEST(0,
    30
    - 5  * COUNT(*) FILTER (WHERE a.status = 'excused')
    - 10 * COUNT(*) FILTER (WHERE a.status = 'absent')
  )::NUMERIC(5,2)
  FROM attendance a
  JOIN sessions se ON se.id = a.session_id
  WHERE a.student_id = p_student_id
    AND (p_from_date IS NULL OR se.session_date >= p_from_date)
    AND (p_to_date   IS NULL OR se.session_date <= p_to_date);
$$;

COMMENT ON FUNCTION fn_auto_chuyen_can IS
  'Tính điểm Chuyên Cần tự động: 30 − (5 × phép) − (10 × vắng). Min = 0.';

-- =============================================
-- 3. fn_student_rankings
--    Xếp hạng học sinh theo tổng điểm (tuần gần nhất hoặc chỉ định)
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
LANGUAGE sql STABLE
AS $$
  WITH target_week AS (
    SELECT COALESCE(p_week_key, MAX(sc.week_key)) AS wk
    FROM scores sc
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY sc.total DESC, s.name ASC) AS rank,
      s.id           AS student_id,
      s.name         AS student_name,
      s.group_id     AS group_id,
      sc.week_key    AS week_key,
      sc.total       AS total,
      -- Sum by category
      COALESCE(SUM(cr.value) FILTER (WHERE cr.category = 'chuyen_can'), 0) AS cat_chuyen_can,
      COALESCE(SUM(cr.value) FILTER (WHERE cr.category = 'y_thuc'), 0)     AS cat_y_thuc,
      COALESCE(SUM(cr.value) FILTER (WHERE cr.category = 'chuyen_mon'), 0) AS cat_chuyen_mon,
      CASE
        WHEN ROW_NUMBER() OVER (ORDER BY sc.total DESC, s.name ASC) = 1 THEN '🥇'
        WHEN ROW_NUMBER() OVER (ORDER BY sc.total DESC, s.name ASC) = 2 THEN '🥈'
        WHEN ROW_NUMBER() OVER (ORDER BY sc.total DESC, s.name ASC) = 3 THEN '🥉'
        ELSE ''
      END AS medal
    FROM scores sc
    JOIN students s ON s.id = sc.student_id
    LEFT JOIN score_criteria cr ON cr.score_id = sc.id
    CROSS JOIN target_week tw
    WHERE sc.week_key = tw.wk
      AND s.is_active = TRUE
    GROUP BY s.id, s.name, s.group_id, sc.week_key, sc.total
  )
  SELECT * FROM ranked
  ORDER BY rank;
$$;

COMMENT ON FUNCTION fn_student_rankings IS
  'Xếp hạng thi đua. NULL = tuần gần nhất.';

-- =============================================
-- 4. fn_upsert_attendance
--    Bulk upsert điểm danh cho 1 session
--    Input: session_id + JSONB array [{studentId, status}]
-- =============================================

CREATE OR REPLACE FUNCTION fn_upsert_attendance(
  p_session_id UUID,
  p_records    JSONB  -- [{"studentId": "uuid", "status": "present|absent|excused"}]
)
RETURNS SETOF attendance
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO attendance (student_id, session_id, status)
  SELECT
    (r->>'studentId')::UUID,
    p_session_id,
    COALESCE(r->>'status', 'absent')
  FROM jsonb_array_elements(p_records) AS r
  ON CONFLICT (student_id, session_id)
    DO UPDATE SET
      status      = EXCLUDED.status,
      recorded_at = now()
  RETURNING *;
END;
$$;

COMMENT ON FUNCTION fn_upsert_attendance IS
  'Bulk upsert điểm danh. Input: session_id + JSONB [{studentId, status}].';

-- =============================================
-- 5. fn_get_or_create_session
--    Lấy hoặc tạo session cho ngày + nhóm
-- =============================================

CREATE OR REPLACE FUNCTION fn_get_or_create_session(
  p_date     DATE,
  p_group_id TEXT DEFAULT 'nhom_1'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  SELECT id INTO v_session_id
  FROM sessions
  WHERE session_date = p_date AND group_id = p_group_id;

  IF v_session_id IS NULL THEN
    INSERT INTO sessions (session_date, group_id)
    VALUES (p_date, p_group_id)
    RETURNING id INTO v_session_id;
  END IF;

  RETURN v_session_id;
END;
$$;

COMMENT ON FUNCTION fn_get_or_create_session IS
  'Lấy session_id cho ngày+nhóm, tự tạo nếu chưa có.';

-- =============================================
-- 6. fn_group_attendance_summary
--    Thống kê nhanh theo nhóm cho dashboard
-- =============================================

CREATE OR REPLACE FUNCTION fn_group_attendance_summary(
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  group_id       TEXT,
  total_students BIGINT,
  present_count  BIGINT,
  absent_count   BIGINT,
  excused_count  BIGINT,
  rate           NUMERIC(5,2)
)
LANGUAGE sql STABLE
AS $$
  SELECT
    s.group_id,
    COUNT(DISTINCT s.id)                                          AS total_students,
    COUNT(a.id) FILTER (WHERE a.status = 'present')               AS present_count,
    COUNT(a.id) FILTER (WHERE a.status = 'absent')                AS absent_count,
    COUNT(a.id) FILTER (WHERE a.status = 'excused')               AS excused_count,
    CASE
      WHEN COUNT(a.id) = 0 THEN 0
      ELSE ROUND(
        COUNT(a.id) FILTER (WHERE a.status = 'present')::NUMERIC
        / NULLIF(COUNT(a.id), 0) * 100, 2
      )
    END                                                           AS rate
  FROM students s
  LEFT JOIN attendance a ON a.student_id = s.id
  LEFT JOIN sessions se ON se.id = a.session_id AND se.session_date = p_date
  WHERE s.is_active = TRUE
  GROUP BY s.group_id
  ORDER BY s.group_id;
$$;

COMMENT ON FUNCTION fn_group_attendance_summary IS
  'Thống kê nhanh chuyên cần theo nhóm cho 1 ngày (mặc định hôm nay).';
