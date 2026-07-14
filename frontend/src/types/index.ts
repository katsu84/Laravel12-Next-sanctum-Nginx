// src/types/index.ts

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}
