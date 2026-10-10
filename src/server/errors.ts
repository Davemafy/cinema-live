export class AppError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function errorResponse(error: unknown, context: string): Response {
  if (error instanceof AppError) return Response.json({ error: error.message }, { status: error.status });
  // Provider errors can contain signed URLs, credentials or private prompt data.
  console.error(JSON.stringify({ event: 'request_failed', context, type: error instanceof Error ? error.name : 'unknown' }));
  return Response.json({ error: 'The service could not finish this request. Please retry.' }, { status: 502 });
}
