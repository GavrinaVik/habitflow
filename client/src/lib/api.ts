/** Ошибка API с HTTP-статусом и текстом от сервера */
export class ApiError extends Error {
  status: number;
  retryAfter?: number;

  constructor(status: number, message: string, retryAfter?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

/** Запрос к API с обработкой ошибок: кидает ApiError с текстом от сервера */
export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError(0, "Нет соединения с сервером. Проверьте, что API запущен на :3001");
  }

  const data = (await res.json().catch(() => null)) as { error?: string; retryAfter?: number } | null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? "Что-то пошло не так", data?.retryAfter);
  }
  return data as T;
}

export function postJson<T>(path: string, body?: unknown): Promise<T> {
  return requestJson<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Запрос с фолбэком для нетребовательного контента (тарифы, FAQ и т.п.) */
export async function fetchJson<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(path, init);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}