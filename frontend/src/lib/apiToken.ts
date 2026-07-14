// src/lib/apiToken.ts

// 💡 localStorage からトークンを取得する補助関数
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null; // サーバーサイドレンダリング時のエラー防止
  return localStorage.getItem('access_token');
};

// 💡 トークン認証専用の動的オプション生成関数
const getTokenOptions = (method: string, body?: any): RequestInit => {
  const token = getStoredToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // 🚨 トークンが存在すれば、Authorizationヘッダーに「Bearer 文字列」の形で乗せる！
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    // 💡 Cookieは使わないので credentials: 'include' は不要（あっても無視されます）
  };
};

export const apiToken = {
  // 1. ログイン（POST） -> 最初はトークンがないので空のヘッダーで送る
  login: (email: string, password: string): Promise<Response> => 
    fetch('/api/token/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  // 2. ユーザー情報取得（GET）
  getUser: (): Promise<Response> => 
    fetch('/api/token/user', getTokenOptions('GET')),

  // 3. 【R】タスク一覧取得（GET）
  getTasks: (): Promise<Response> => 
    fetch('/api/token/tasks', getTokenOptions('GET')),

  // 4. 【C】タスク新規作成（POST）
  createTask: (title: string): Promise<Response> => 
    fetch('/api/token/tasks', getTokenOptions('POST', { title })),

  // 5. 【U】タスク更新（PUT）
  updateTask: (id: number, data: { title?: string; is_completed?: boolean }): Promise<Response> => 
    fetch(`/api/token/tasks/${id}`, getTokenOptions('PUT', data)),

  // 6. 【D】タスク削除（DELETE）
  deleteTask: (id: number): Promise<Response> => 
    fetch(`/api/token/tasks/${id}`, getTokenOptions('DELETE')),
};
