'use client';

import { useState, FormEvent } from 'react';

interface TaskFormProps {
  onCreate: (title: string) => Promise<void>;
}

export default function TaskForm({ onCreate }: TaskFormProps) {
  const [newTitle, setNewTitle] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await onCreate(newTitle);
    setNewTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
      <input
        type="text"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="新しいタスクを入力..."
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 text-base font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        追加
      </button>
    </form>
  );
}
