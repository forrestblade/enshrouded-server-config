/**
 * shared/lib/result — Result-based error handling (neverthrow).
 *
 * App layers return `Result<T, E>` instead of throwing. The Zod `model` layer
 * stays free of neverthrow; this shared helper adapts schema validation into
 * Result values so callers get typed, non-throwing error handling.
 */
import {
  ok,
  err,
  okAsync,
  errAsync,
  Result,
  ResultAsync,
  fromThrowable,
  fromPromise,
  fromSafePromise,
  fromAsyncThrowable,
  safeTry,
} from 'neverthrow'
import type { Ok, Err } from 'neverthrow'
import type { z } from 'zod'

export {
  ok,
  err,
  okAsync,
  errAsync,
  Result,
  ResultAsync,
  fromThrowable,
  fromPromise,
  fromSafePromise,
  fromAsyncThrowable,
  safeTry,
}
export type { Ok, Err }

/** Adapt a Zod schema parse into a Result — never throws. */
export function parseResult<S extends z.ZodType> (
  schema: S,
  input: unknown
): Result<z.infer<S>, z.ZodError> {
  const parsed = schema.safeParse(input)
  return parsed.success ? ok(parsed.data) : err(parsed.error)
}
