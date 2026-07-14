<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\GuestTaskController;
use App\Http\Controllers\TokenAuthController;
use App\Http\Controllers\TokenTaskController;

// =======================================================
// 🟢 ここから下は「認証なし（完全オープン）」のCRUD
// =======================================================

// プレフィックスとして /api/guest/tasks になります
Route::get('/guest/tasks', [GuestTaskController::class, 'index']);     // 一覧取得
Route::post('/guest/tasks', [GuestTaskController::class, 'store']);    // 新規作成
Route::put('/guest/tasks/{id}', [GuestTaskController::class, 'update']); // 更新
Route::delete('/guest/tasks/{id}', [GuestTaskController::class, 'destroy']); // 削除


// =======================================================
// 🟢 ここから下は「SPA認証」のCRUD
// =======================================================

Route::middleware('web')->group(function () {
    
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('auth:web')->group(function () {
        Route::get('/user', function (Request $request) {
            return $request->user();
        });


        // 🔒 認証必須のCRUDルート
        Route::get('/tasks', [TaskController::class, 'index']);     // 【R】一覧取得
        Route::post('/tasks', [TaskController::class, 'store']);    // 【C】新規作成
        Route::put('/tasks/{id}', [TaskController::class, 'update']); // 【U】更新
        Route::delete('/tasks/{id}', [TaskController::class, 'destroy']); // 【D】削除
        
    });
});

// =======================================================
// 🚨 ここから下を「トークン（Bearer）認証専用」として新しく増設
// =======================================================

// 1. ログイン（プレフィックスとして /api/token/login になります）
Route::post('/token/login', [TokenAuthController::class, 'login']);

// 2. 認証必須ルート（/api/token/...）
// auth:sanctumを付けますが、webで囲んでいないため自動的に「トークンチェック」になります
Route::middleware('auth:sanctum')->prefix('token')->group(function () {
    
    // ユーザー情報取得 (/api/token/user)
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // タスクのCRUD
    Route::get('/tasks', [TokenTaskController::class, 'index']);
    Route::post('/tasks', [TokenTaskController::class, 'store']);
    Route::put('/tasks/{id}', [TokenTaskController::class, 'update']);
    Route::delete('/tasks/{id}', [TokenTaskController::class, 'destroy']);
});
