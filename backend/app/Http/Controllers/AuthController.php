<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // 認証試行
        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['ログイン情報が正しくありません。'],
            ]);
        }

        // セッションの再生成（セッション固定攻撃対策）
        $request->session()->regenerate();

        return response()->json(['message' => 'ログイン成功']);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        // セッションの無効化とトークンの再生成
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'ログアウト成功']);
    }
}
