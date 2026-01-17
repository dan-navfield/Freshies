/**
 * A Result type representing either success (Ok) or failure (Err).
 * This pattern encourages explicit error handling.
 */
export type Result<T, E = Error> =
    | { ok: true; value: T }
    | { ok: false; error: E };

/**
 * Helper to create a successful Result
 */
export function ok<T>(value: T): Result<T, never> {
    return { ok: true, value };
}

/**
 * Helper to create a failed Result
 */
export function err<E>(error: E): Result<never, E> {
    return { ok: false, error };
}

/**
 * Helper to unwrap a Result, throwing the error if it failed.
 * Use this when you are confident the result is Ok, or you want to bubble up the exception.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
    if (result.ok) {
        return result.value;
    }
    throw result.error;
}
