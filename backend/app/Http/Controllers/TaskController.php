<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    // 【R】一覧取得：ログイン中のユーザーのタスクだけを取得
    public function index()
    {
        $tasks = Auth::user()->tasks()->latest()->get();
        return response()->json($tasks);
    }

    // 【C】新規作成
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
        ]);

        // ログイン中ユーザーのタスクとして新しく作成
        $task = Auth::user()->tasks()->create([
            'title' => $request->title,
        ]);

        return response()->json($task, 201); // 201: Created
    }

    // 【U】更新
    public function update(Request $request, $id)
    {
        // 他人のタスクを勝手に更新できないように、自分のタスクから検索
        $task = Auth::user()->tasks()->findOrFail($id);

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'is_completed' => 'sometimes|required|boolean',
        ]);

        $task->update($request->only(['title', 'is_completed']));

        return response()->json($task);
    }

    // 【D】削除
    public function destroy($id)
    {
        // 他人のタスクを勝手に削除できないように、自分のタスクから検索
        $task = Auth::user()->tasks()->findOrFail($id);
        $task->delete();

        return response()->json(['message' => '削除しました']);
    }
}
