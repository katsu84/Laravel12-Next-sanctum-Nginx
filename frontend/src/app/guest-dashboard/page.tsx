'use client';

import { useState, useEffect } from 'react';
import { apiGuest } from '@/lib/apiGuest'; // 🚨 ゲスト用のAPIをインポート
import { Task } from '@/types'; 
import TaskForm from '@/components/TaskForm';
import TaskItem from '@/components/TaskItem';

export default function GuestDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. 【Read】画面を開いた瞬間にすべてのタスクを取得
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await apiGuest.getTasks();
        if (res.ok) {
          const data: Task[] = await res.json();
          setTasks(data);
        }
      } catch (err) {
        console.error('ゲストタスクの読み込みエラー:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // 2. 【Create】新規追加（安全装置がないので単純にPOSTするだけ！）
  const handleCreateTask = async (title: string) => {
    try {
      const res = await apiGuest.createTask(title);
      if (res.ok) {
        const newTask: Task = await res.json();
        setTasks([newTask, ...tasks]);
      }
    } catch (err) {
      console.error('ゲスト追加エラー:', err);
    }
  };

  // 3. 【Update】状態切り替え
  const handleToggleComplete = async (task: Task) => {
    try {
      const res = await apiGuest.updateTask(task.id, {
        is_completed: !task.is_completed,
      });
      if (res.ok) {
        const updatedTask: Task = await res.json();
        setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
      }
    } catch (err) {
      console.error('ゲスト更新エラー:', err);
    }
  };

  // 4. 【Delete】削除
  const handleDeleteTask = async (id: number) => {
    if (!confirm('このタスクを削除しますか？')) return;

    try {
      const res = await apiGuest.deleteTask(id);
      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('ゲスト削除エラー:', err);
    }
  };

  if (loading) {
    return <p className="mt-12 text-center text-gray-500">ゲストデータ読み込み中...</p>;
  }

  return (
    <div className="mx-auto my-12 max-w-xl rounded-xl border border-gray-100 bg-white p-6 shadow-md">
      <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          みんなのタスク掲示板（認証なし）
        </h1>
        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
          Guest Mode
        </span>
      </div>

      {/* 【Create】フォーム（使い回し） */}
      <TaskForm onCreate={handleCreateTask} />

      {/* 【Read/Update/Delete】一覧（使い回し） */}
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
