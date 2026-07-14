// src/lib/apiGuest.ts

const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export const apiGuest = {
  // 1. 【R】タスク一覧取得（GET）
  getTasks: (): Promise<Response> => 
    fetch('/api/guest/tasks', { ...defaultOptions, method: 'GET' }),

  // 2. 【C】タスク新規作成（POST）
  createTask: (title: string): Promise<Response> => 
    fetch('/api/guest/tasks', {
      ...defaultOptions,
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  // 3. 【U】タスク更新（PUT）
  updateTask: (id: number, data: { title?: string; is_completed?: boolean }): Promise<Response> => 
    fetch(`/api/guest/tasks/${id}`, {
      ...defaultOptions,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // 4. 【D】タスク削除（DELETE）
  deleteTask: (id: number): Promise<Response> => 
    fetch(`/api/guest/tasks/${id}`, {
      ...defaultOptions,
      method: 'DELETE',
    }),
};
