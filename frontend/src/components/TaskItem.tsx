'use client';

import { Task } from '@/types';

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <li className="flex items-center justify-between border-b border-gray-200 py-3 px-2 text-lg">
      {/* 【Update】チェックボックスとタイトル */}
      <div className="flex flex-1 items-center gap-3">
        <input
          type="checkbox"
          checked={task.is_completed}
          onChange={() => onToggle(task)}
          className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span 
          className={`transition-all ${
            task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'
          }`}
        >
          {task.title}
        </span>
      </div>

      {/* 【Delete】削除ボタン */}
      <button
        onClick={() => onDelete(task.id)}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        削除
      </button>
    </li>
  );
}
