'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api'; 
import { User, Task } from '@/types'; 
import TaskForm from '@/components/TaskForm';
import TaskItem from '@/components/TaskItem';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. 【Read】初期読み込み
  useEffect(() => {
    const initDashboard = async () => {
      try {
        const userRes = await api.getUser();
        if (userRes.status === 401) {
          window.location.replace('/login');
          return;
        }
        if (!userRes.ok) throw new Error('未ログイン');
        
        const userData: User = await userRes.json();
        setUser(userData);

        const tasksRes = await api.getTasks();
        if (tasksRes.ok) {
          const tasksData: Task[] = await tasksRes.json();
          setTasks(tasksData);
        }
      } catch (err) {
        console.error('ダッシュボード初期化エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, []);

  // 2. 【Create】新規追加
  const handleCreateTask = async (title: string) => {
    try {
      const res = await api.createTask(title);

      if (res.ok) {
        const newTask: Task = await res.json();
        setTasks([newTask, ...tasks]);
      } else {
        // もしLaravel側でエラー（422バリデーションエラーなど）が起きた場合はログを出す
        const errLog = await res.json();
        console.error('Laravel側からのエラー返却:', errLog);
        alert('タスクの追加に失敗しました。入力内容を確認してください。');
      }
    } catch (err) {
      console.error('追加エラー:', err);
    }
  };

  // 3. 【Update】ステータス切り替え
  const handleToggleComplete = async (task: Task) => {
    try {
      const res = await api.updateTask(task.id, {
        is_completed: !task.is_completed,
      });

      if (res.ok) {
        const updatedTask: Task = await res.json();
        setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
      }
    } catch (err) {
      console.error('更新エラー:', err);
    }
  };

  // 4. 【Delete】削除
  const handleDeleteTask = async (id: number) => {
    if (!confirm('このタスクを削除しますか？')) return;

    try {
      const res = await api.deleteTask(id);

      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('削除エラー:', err);
    }
  };

  if (loading) {
    return <p className="mt-12 text-center text-gray-500">読み込み中...</p>;
  }
  if (!user) {
    return <p className="mt-12 text-center text-red-500">ログインしていません。</p>;
  }

  return (
    <div className="mx-auto my-12 max-w-xl rounded-xl border border-gray-100 bg-white p-6 shadow-md">
      <h1 className="border-b border-gray-200 pb-3 text-2xl font-bold text-gray-800">
        {user.name} さんのタスク一覧
      </h1>

      {/* 【Create】フォーム */}
      <TaskForm onCreate={handleCreateTask} />

      {/* 【Read/Update/Delete】一覧表示 */}
      <ul className="mt-6 flex flex-col list-none p-0">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-4">タスクはまだありません。</p>
        ) : (
          tasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onToggle={handleToggleComplete} 
              onDelete={handleDeleteTask} 
            />
          ))
        )}
      </ul>
    </div>
  );
}
