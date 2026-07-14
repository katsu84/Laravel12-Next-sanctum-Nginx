'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiToken } from '@/lib/apiToken'; // 🚨 トークン用API
import { User, Task } from '@/types'; 
import TaskForm from '@/components/TaskForm';
import TaskItem from '@/components/TaskItem';

export default function TokenDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. 【Read】初期データ読み込み
  useEffect(() => {
    const initDashboard = async () => {
      try {
        const userRes = await apiToken.getUser();
        if (!userRes.ok) throw new Error('未認証');
        
        const userData: User = await userRes.json();
        setUser(userData);

        const tasksRes = await apiToken.getTasks();
        if (tasksRes.ok) {
          const tasksData: Task[] = await tasksRes.json();
          setTasks(tasksData);
        }
      } catch (err) {
        console.error(err);
        router.push('/token-login'); // 認証に失敗したらログイン画面へ突き返す
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [router]);

  // 2. 【Create】新規追加（ヘッダーに自動でトークンが乗ります）
  const handleCreateTask = async (title: string) => {
    try {
      const res = await apiToken.createTask(title);
      if (res.ok) {
        const newTask: Task = await res.json();
        setTasks([newTask, ...tasks]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. 【Update】状態切り替え
  const handleToggleComplete = async (task: Task) => {
    try {
      const res = await apiToken.updateTask(task.id, { is_completed: !task.is_completed });
      if (res.ok) {
        const updatedTask: Task = await res.json();
        setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. 【Delete】削除
  const handleDeleteTask = async (id: number) => {
    if (!confirm('このタスクを削除しますか？')) return;
    try {
      const res = await apiToken.deleteTask(id);
      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 🚪 【ログアウト】localStorageを消すだけで完了！
  const handleLogout = () => {
    localStorage.removeItem('access_token'); // 倉庫から合言葉を消去
    router.push('/token-login'); // ログイン画面へ戻る
  };

  if (loading) return <p className="mt-12 text-center text-gray-500">トークンデータ読込中...</p>;
  if (!user) return null;

  return (
    <div className="mx-auto my-12 max-w-xl rounded-xl border border-gray-100 bg-white p-6 shadow-md">
      <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{user.name} さんのトークンタスク</h1>
        <button onClick={handleLogout} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200">
          ログアウト
        </button>
      </div>

      <TaskForm onCreate={handleCreateTask} />

      <ul className="mt-6 flex flex-col list-none p-0">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-4">タスクはまだありません。</p>
        ) : (
          tasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={handleToggleComplete} onDelete={handleDeleteTask} />
          ))
        )}
      </ul>
    </div>
  );
}
