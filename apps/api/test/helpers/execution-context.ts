import type { ExecutionContext } from "@nestjs/common";

/** Builds a minimal fake ExecutionContext exposing only what the guards under test read. */
export function makeExecutionContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}
