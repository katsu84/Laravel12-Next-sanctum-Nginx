<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;

class GuestTaskController extends Controller
{
    // 【R】全員のタスクを最新順にすべて取得
    public function index()
    {
        $tasks = Task::latest()->get();
        return response()->json($tasks);
    }

    // 【C】新しくタスクを作成（認証がないため、とりあえず user_id は「1」などで固定保存します）
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $task = Task::create([
            'title' => $request->title,
            'user_id' => 1, // 🚨 データベースの制約（必須）を満たすため、仮でユーザーID「1」を入れます
        ]);

        return response()->json($task, 201);
    }

    // 【U】更新（IDを指定して直接書き換え）
    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id); // 誰のタスクであっても、IDが合致すれば取得

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'is_completed' => 'sometimes|required|boolean',
        ]);

        $task->update($request->only(['title', 'is_completed']));

        return response()->json($task);
    }

    // 【D】削除（IDを指定して直接削除）
    public function destroy($id)
    {
        $task = Task::findOrFail($id);
        $task->delete();

        return response()->json(['message' => '削除しました']);
    }
}
