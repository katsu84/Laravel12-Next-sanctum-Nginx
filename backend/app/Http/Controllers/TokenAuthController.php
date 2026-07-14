<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TokenAuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'ログイン情報が正しくありません。'], 422);
        }

        $user = Auth::user();
        
        // 🚨 Sanctumトークンを発行して文字列としてNext.jsに返却する
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'ログイン成功',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }
}
