import {
  ForbiddenError,
  InsufficientBalanceError,
  RateLimitedError,
  TagNotFoundError,
  UnauthorizedError,
  UnexpectedApiError,
  ValidationError,
} from "./errors.js";
import type { FetchLike } from "./types.js";

export type HttpMethod = "GET" | "POST" | "PATCH";

export type RequestParams = Readonly<{
  method: HttpMethod;
  path: string;
  query?: Record<string, string | undefined>;
  body?: unknown;
  token?: string;
}>;

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | undefined>): string {
  const trimmedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const url = new URL(trimmedBase + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

type ErrorBody = Readonly<{
  statusCode?: number;
  message?: string;
  reason?: string;
  requiredLamports?: string;
  currentLamports?: string;
  shortfallLamports?: string;
}>;

function isInsufficientBalanceBody(
  body: unknown,
): body is { message?: string; requiredLamports: string; currentLamports: string; shortfallLamports: string } {
  const candidate = body as ErrorBody | undefined;
  return (
    typeof candidate?.requiredLamports === "string" &&
    typeof candidate?.currentLamports === "string" &&
    typeof candidate?.shortfallLamports === "string"
  );
}

function mapErrorResponse(status: number, body: unknown): Error {
  const errorBody = body as ErrorBody | undefined;
  const message = errorBody?.message ?? `request failed with status ${status}`;

  switch (status) {
    case 404:
      return new TagNotFoundError(message, status, body);
    case 401:
      return new UnauthorizedError(body);
    case 403:
      return new ForbiddenError(message, status, body);
    case 429:
      return new RateLimitedError(message, status, body);
    case 402:
      if (isInsufficientBalanceBody(body)) {
        return new InsufficientBalanceError(body);
      }
      return new UnexpectedApiError(message, status, body);
    case 400:
      return new ValidationError(message, body, errorBody?.reason);
    default:
      return new UnexpectedApiError(message, status, body);
  }
}

/**
 * The single place that talks to fetch. Every TipClient method that hits
 * the network goes through this, so error mapping and request shaping stay
 * in one place.
 */
export async function request<T>(params: {
  baseUrl: string;
  fetchImpl: FetchLike;
  request: RequestParams;
}): Promise<T> {
  const url = buildUrl(params.baseUrl, params.request.path, params.request.query);
  const headers: Record<string, string> = {};
  let body: string | undefined;

  if (params.request.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(params.request.body);
  }
  if (params.request.token) {
    headers.authorization = `Bearer ${params.request.token}`;
  }

  const response = await params.fetchImpl(url, {
    method: params.request.method,
    headers,
    ...(body !== undefined ? { body } : {}),
  });

  if (!response.ok) {
    const errorBody = await safeParseJson(response);
    throw mapErrorResponse(response.status, errorBody);
  }

  return (await response.json()) as T;
}
