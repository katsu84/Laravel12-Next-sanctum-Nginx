<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;

class TokenTaskController extends Controller
{
    public function index()
    {
        return response()->json(Auth::user()->tasks()->latest()->get());
    }

    public function store(Request $request)
    {
        $request->validate(['title' => 'required|string|max:255']);
        $task = Auth::user()->tasks()->create(['title' => $request->title]);
        return response()->json($task, 201);
    }

    public function update(Request $request, $id)
    {
        $task = Auth::user()->tasks()->findOrFail($id);
        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'is_completed' => 'sometimes|required|boolean',
        ]);
        $task->update($request->only(['title', 'is_completed']));
        return response()->json($task);
    }

    public function destroy($id)
    {
        $task = Auth::user()->tasks()->findOrFail($id);
        $task->delete();
        return response()->json(['message' => '削除しました']);
    }
}
