// =============================================
// ERROR HANDLING TYPES — Application Layer
// =============================================

export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string; code: string; details?: unknown };

// =============================================
// HELPER FUNCTIONS
// =============================================

export function Success<T>(data: T): ActionResult<T> {
    return { success: true, data };
}

export function Failure(error: unknown): ActionResult<never> {
    if (error instanceof ApplicationError) {
        return {
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
        };
    }

    // Default unhandled error
    return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'INTERNAL_ERROR',
    };
}

// =============================================
// CUSTOM ERROR CLASSES
// =============================================

export class ApplicationError extends Error {
    constructor(
        message: string,
        public code: string = 'INTERNAL_ERROR',
        public statusCode: number = 500,
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = this.constructor.name;
        // Allows proper stack trace in V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class ValidationError extends ApplicationError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', 400, details);
    }
}

export class DatabaseError extends ApplicationError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'DATABASE_ERROR', 500, details);
    }
}

export class NotFoundError extends ApplicationError {
    constructor(resource: string, details?: Record<string, unknown>) {
        super(`${resource} not found`, 'NOT_FOUND', 404, details);
    }
}
