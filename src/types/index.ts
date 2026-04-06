// =============================================
// TYPES BARREL EXPORT
// =============================================

// Database types (Supabase schema)
export type {
    Database,
    Json,
    GroupId,
    AttendanceStatus,
    ScoreCategory,
    LessonPlanSection,
    LessonPlanContent,
    DeductionEntry,
    AttendanceStatsRow,
    StudentRankingRow,
    GroupAttendanceSummaryRow,
    StudentRow,
    SessionRow,
    AttendanceRow,
    ScoreRow,
    ScoreCritRow,
    StudentInsert,
    StudentUpdate,
    ScoreInsert,
    ScoreUpdate,
    LessonPlanRow,
    LessonPlanInsert,
    LessonPlanUpdate,
} from './database.types';

// Domain types (Application layer)
export type {
    Student,
    StudentFormData,
    Session,
    AttendanceRecord,
    AttendanceBulkInput,
    Score,
    ScoreCriterion,
    ScoreFormData,
    AttendanceStats,
    GroupSummary,
    StudentRanking,
    AppConfig,
} from './domain';

export {
    GROUP_LABELS,
    GROUP_SHORT,
    ATTENDANCE_STATUS_CONFIG,
    SCORE_CATEGORY_CONFIG,
} from './domain';

// Validation schemas
export {
    GroupIdSchema,
    AttendanceStatusSchema,
    ScoreCategorySchema,
    StudentFormSchema,
    SaveAttendanceSchema,
    SaveScoreSchema,
    AttendanceStatsQuerySchema,
    AppConfigSchema,
} from './validation';

export type {
    StudentFormInput,
    SaveAttendanceInput,
    SaveScoreInput,
    AttendanceStatsQuery,
} from './validation';

// Error types
export type { ActionResult } from './errors';
export {
    Success,
    Failure,
    ApplicationError,
    ValidationError,
    DatabaseError,
    NotFoundError
} from './errors';
