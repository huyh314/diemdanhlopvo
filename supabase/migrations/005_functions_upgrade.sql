-- =============================================
-- MIGRATION 004: ENHANCED FUNCTIONS
-- Võ Đường Manager — PostgreSQL Best Practices
-- Target: Optimize and parameterize scoring logic
-- =============================================

-- =============================================
-- 1. Refactored fn_auto_chuyen_can
--    Tự động tính điểm Chuyên Cần từ dữ liệu điểm danh
--    Rule: Configurable base score and deductions (defaults to 30, -5, -10)
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
  v_score NUMERIC(5,2);
  v_config JSONB;
BEGIN

  -- Attempt to read flexible scoring logic from app_config if it exists
  SELECT value INTO v_config FROM app_config WHERE key = 'scoring_rules';
  IF v_config IS NOT NULL THEN
    v_base_score := COALESCE((v_config->>'base_chuyen_can')::NUMERIC, v_base_score);
    v_excused_deduction := COALESCE((v_config->>'excused_deduction')::NUMERIC, v_excused_deduction);
    v_absent_deduction := COALESCE((v_config->>'absent_deduction')::NUMERIC, v_absent_deduction);
  END IF;

  SELECT GREATEST(0,
    v_base_score
    - (v_excused_deduction * COUNT(*) FILTER (WHERE a.status = 'excused'))
    - (v_absent_deduction * COUNT(*) FILTER (WHERE a.status = 'absent'))
  )::NUMERIC(5,2)
  INTO v_score
  FROM attendance a
  JOIN sessions se ON se.id = a.session_id
  WHERE a.student_id = p_student_id
    AND (p_from_date IS NULL OR se.session_date >= p_from_date)
    AND (p_to_date   IS NULL OR se.session_date <= p_to_date);

  RETURN COALESCE(v_score, v_base_score);
END;
$$;

COMMENT ON FUNCTION fn_auto_chuyen_can IS
  'Tính điểm Chuyên Cần tự động. Có thể đọc base_score, excused_deduction, absent_deduction từ bảng app_config (key: scoring_rules), mặc định 30, -5, -10.';

-- =============================================
-- 2. Refactored fn_attendance_stats
--    Tối ưu truy vấn và chuẩn hóa dữ liệu trả về 
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
  -- Only join strictly active students within the filters to minimize join load
  LEFT JOIN attendance a ON a.student_id = s.id
  LEFT JOIN sessions se ON se.id = a.session_id
  WHERE s.is_active = TRUE
    AND (p_student_id IS NULL OR s.id = p_student_id)
    AND (p_group_id   IS NULL OR s.group_id = p_group_id)
    AND (p_from_date  IS NULL OR se.session_date >= p_from_date)
    AND (p_to_date    IS NULL OR se.session_date <= p_to_date)
  GROUP BY s.id, s.name, s.group_id
  ORDER BY s.group_id, s.name;
$$;

COMMENT ON FUNCTION fn_attendance_stats IS
  'Tính tỉ lệ chuyên cần tối ưu hoá Join. Trả về thống kê group theo group_id trước tiên.';
