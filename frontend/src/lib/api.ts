// src/lib/api.ts

const baseOptions: RequestInit = {
  credentials: 'include',
  cache: 'no-store',
};

const jsonHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
} as const;

function getXsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

async function refreshCsrfCookie(): Promise<void> {
  await fetch('/api/sanctum/csrf-cookie', {
    ...baseOptions,
    method: 'GET',
  });
}

async function ensureCsrfToken(): Promise<void> {
  if (!getXsrfToken()) {
    await refreshCsrfCookie();
  }
}

function mutationOptions(method: string, body?: unknown): RequestInit {
  return {
    ...baseOptions,
    method,
    headers: {
      ...jsonHeaders,
      'X-XSRF-TOKEN': getXsrfToken(),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
}

async function mutate(
  url: string,
  method: string,
  body?: unknown,
): Promise<Response> {
  await ensureCsrfToken();
  return fetch(url, mutationOptions(method, body));
}

export const api = {
  getCsrf: (): Promise<Response> =>
    refreshCsrfCookie().then(() => new Response()),

  login: (email: string, password: string): Promise<Response> =>
    fetch('/api/login', {
      ...baseOptions,
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email, password }),
    }),

  getUser: (): Promise<Response> =>
    fetch('/api/user', {
      ...baseOptions,
      method: 'GET',
      headers: jsonHeaders,
    }),

  getTasks: (): Promise<Response> =>
    fetch('/api/tasks', {
      ...baseOptions,
      method: 'GET',
      headers: jsonHeaders,
    }),

  createTask: (title: string): Promise<Response> =>
    mutate('/api/tasks', 'POST', { title }),

  updateTask: (
    id: number,
    data: { title?: string; is_completed?: boolean },
  ): Promise<Response> => mutate(`/api/tasks/${id}`, 'PUT', data),

  deleteTask: (id: number): Promise<Response> =>
    mutate(`/api/tasks/${id}`, 'DELETE'),
};
