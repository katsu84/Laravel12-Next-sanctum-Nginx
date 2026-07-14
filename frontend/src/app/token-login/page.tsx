'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; 
import { apiToken } from '@/lib/apiToken';

export default function TokenLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 🚨 CSRFクッキー取得は一切不要！いきなりログインを叩きます
      const res = await apiToken.login(email, password);

      if (res.ok) {
        const data = await res.json();
        
        // 🚨 Laravelから返ってきたトークン文字列をブラウザの倉庫（localStorage）に保存
        localStorage.setItem('access_token', data.access_token);
        
        // トークン専用のダッシュボードへジャンプ
        router.push('/token-dashboard');
      } else {
        const errData = await res.json();
        setError(errData.message || 'ログインに失敗しました。');
      }
    } catch (err) {
      console.error(err);
      setError('通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-md">
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-6">トークン認証 ログイン</h2>
        {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">パスワード</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-md bg-purple-600 px-4 py-2.5 font-bold text-white hover:bg-purple-700 disabled:bg-purple-400">
            {loading ? 'ログイン中...' : 'トークンでログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
