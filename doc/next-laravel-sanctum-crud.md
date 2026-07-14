# Next.js + Laravel Sanctum 同一ドメイン CRUD 構築手順

本ドキュメントは、**同一ドメイン**上で Next.js（フロント）と Laravel（API）を組み合わせ、**Sanctum のセッション Cookie 認証**でログインし、**CRUD** を行うための構築手順です。

本リポジトリ（`/home/ubuntu/app`）の構成を前提に記載しています。

---

## 1. アーキテクチャ概要

```
ブラウザ
  http://192.168.20.199  (ポート 80 のみ)
        │
        ▼
      nginx
        ├─ /api/*  → Laravel (PHP-FPM)
        └─ /*      → Next.js (内部 127.0.0.1:3000)
```

| 役割 | 技術 | パス例 |
|---|---|---|
| 画面 | Next.js 16 (App Router) | `/login`, `/dashboard` |
| API | Laravel 11 + Sanctum | `/api/login`, `/api/tasks` |
| リバースプロキシ | nginx | ポート 80 |

### 認証方式

- **Bearer Token ではなく、セッション Cookie 認証**（SPA 向け Sanctum）
- ブラウザは常に **同一オリジン**（例: `http://192.168.20.199`）へ `fetch` する
- `credentials: 'include'` で Cookie を送受信する
- POST / PUT / DELETE では **CSRF トークン**（`X-XSRF-TOKEN`）が必要

---

## 2. 前提条件

- PHP 8.2+（本環境: 8.5）
- Composer
- Node.js 20+
- MySQL / MariaDB
- nginx
- PHP-FPM

---

## 3. ディレクトリ構成

```
app/
├── backend/          # Laravel
│   ├── app/Http/Controllers/
│   ├── routes/api.php
│   └── ...
├── frontend/         # Next.js
│   └── src/
│       ├── lib/api.ts
│       └── app/
│           ├── login/page.tsx
│           └── dashboard/page.tsx
└── doc/              # 本ドキュメント
```

---

## 4. Laravel セットアップ

### 4.1 インストールと Sanctum

```bash
cd backend
composer create-project laravel/laravel .   # 新規の場合
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

### 4.2 `.env` の設定

```env
APP_URL=http://192.168.20.199

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_PATH=/
# SESSION_DOMAIN は未設定（または空にしない）。IP アドレスでは基本的に設定不要
SESSION_SECURE_COOKIE=false

SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1,192.168.20.199
```

> **注意**
> - `SESSION_DOMAIN=null` と書くと文字列 `"null"` になり Cookie が壊れる
> - `SESSION_DOMAIN=`（空文字）も避け、**行ごと削除**するのが安全
> - `config/session.php` では `env('SESSION_DOMAIN') ?: null` とし、空文字を null 扱いにする

設定変更後:

```bash
php artisan config:clear
```

### 4.3 ミドルウェア（`bootstrap/app.php`）

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: '*');

    $middleware->validateCsrfTokens(except: [
        'api/login',
        'api/logout',
    ]);
})
```

- `trustProxies`: nginx 経由のリクエストを正しく認識する
- CSRF 例外: ログイン・ログアウトは CSRF 検証を免除（初回ログイン前は XSRF トークンがないため）

### 4.4 API ルート（`routes/api.php`）

`web` ミドルウェアでセッションを有効にし、`auth:web` で認証を保護します。

```php
Route::middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('auth:web')->group(function () {
        Route::get('/user', fn (Request $request) => $request->user());

        Route::get('/tasks', [TaskController::class, 'index']);
        Route::post('/tasks', [TaskController::class, 'store']);
        Route::put('/tasks/{id}', [TaskController::class, 'update']);
        Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);
    });
});
```

### 4.5 認証コントローラ（`AuthController`）

```php
public function login(Request $request)
{
    $credentials = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required'],
    ]);

    if (!Auth::attempt($credentials)) {
        throw ValidationException::withMessages([
            'email' => ['ログイン情報が正しくありません。'],
        ]);
    }

    $request->session()->regenerate();

    return response()->json(['message' => 'ログイン成功']);
}
```

ログイン成功時、レスポンスに `laravel-session` と `XSRF-TOKEN` の Cookie が付与されます。

### 4.6 モデルとマイグレーション

**tasks テーブル**

```php
Schema::create('tasks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('title');
    $table->boolean('is_completed')->default(false);
    $table->timestamps();
});
```

**User モデル**

```php
public function tasks(): HasMany
{
    return $this->hasMany(Task::class);
}
```

```bash
php artisan migrate
```

---

## 5. Next.js セットアップ

### 5.1 インストール

```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app
npm install
```

### 5.2 API クライアント（`src/lib/api.ts`）

同一オリジン前提の要点:

```typescript
const baseOptions: RequestInit = {
  credentials: 'include',  // Cookie を送る（必須）
  cache: 'no-store',
};

const jsonHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'X-Requested-With': 'XMLHttpRequest',  // Sanctum が SPA リクエストと認識
};
```

#### 認証フロー

| 操作 | エンドポイント | CSRF | 備考 |
|---|---|---|---|
| ログイン | `POST /api/login` | 不要（免除） | **ログイン前に csrf-cookie を呼ばない** |
| ユーザー取得 | `GET /api/user` | 不要 | |
| 一覧取得 | `GET /api/tasks` | 不要 | |
| 作成・更新・削除 | `POST/PUT/DELETE /api/tasks` | **必要** | `X-XSRF-TOKEN` ヘッダーを付与 |

#### CSRF トークンの取得

```typescript
function getXsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}
```

変更系リクエストの前に、Cookie に `XSRF-TOKEN` がなければ `/api/sanctum/csrf-cookie` を呼びます。
**ログイン直後に毎回 csrf-cookie を呼ぶと、認証セッションが上書きされることがあるため避けます。**

### 5.3 ログインページ

```typescript
const res = await api.login(email, password);
if (res.ok) {
  window.location.assign('/dashboard');  // フルリロードで Cookie を確実に反映
}
```

### 5.4 ダッシュボード

```typescript
const userRes = await api.getUser();
if (userRes.status === 401) {
  window.location.replace('/login');
  return;
}
const tasksRes = await api.getTasks();
```

### 5.5 `next.config.ts`（任意）

nginx 経由（ポート 80）でアクセスする場合、**`/api` は nginx が Laravel に直接渡す**ため、rewrite は必須ではありません。

Next.js に直接アクセスする開発時（`:3000`）のみ、以下のような rewrite を設定できます。

```typescript
async rewrites() {
  return [
    {
      source: "/api/:path*",
      destination: "http://192.168.20.199/api/:path*",
    },
  ];
},
```

> 本番運用では **ブラウザは常にポート 80（nginx）経由**でアクセスする構成を推奨します。

---

## 6. nginx 設定

`/etc/nginx/sites-available/ubuntu26.site` の例:

```nginx
server {
    listen 80;
    server_name 192.168.20.199;

    root /home/ubuntu/app/backend/public;
    index index.php;

    # Laravel API（リバースプロキシではなく PHP 直）
    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.5-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    # Next.js（画面のみプロキシ）
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### nginx と Cookie の関係

- `/api` は PHP-FPM 直結のため、**API の Cookie は nginx プロキシの影響を受けにくい**
- ブラウザから見えるのは常に `http://192.168.20.199`（ポート 80）
- 内部の `127.0.0.1:3000` はブラウザには見えない

---

## 7. 起動手順

```bash
# 1. Laravel（常時稼働想定、PHP-FPM + nginx）
cd backend
php artisan config:clear
php artisan migrate

# 2. Next.js
cd frontend
npm run build
npm start   # ポート 3000（nginx からのみ参照）

# 3. アクセス
# ブラウザ: http://192.168.20.199
# ※ :3000 を直接開かない
```

---

## 8. 認証・CRUD のリクエストフロー

### ログイン

```
1. POST /api/login  { email, password }
   ← Set-Cookie: laravel-session, XSRF-TOKEN

2. GET /api/user
   → 200 { id, name, email, ... }
```

### タスク CRUD

```
GET    /api/tasks          → 一覧（認証必須）
POST   /api/tasks          → 作成（CSRF 必須）
PUT    /api/tasks/{id}     → 更新（CSRF 必須）
DELETE /api/tasks/{id}     → 削除（CSRF 必須）
```

### CSRF 付きリクエストの流れ（作成例）

```
1. Cookie に XSRF-TOKEN がなければ GET /api/sanctum/csrf-cookie
2. POST /api/tasks
   Header: X-XSRF-TOKEN: <Cookie の XSRF-TOKEN を decode した値>
   Cookie: laravel-session=...
```

---

## 9. 動作確認

### ブラウザ

1. Cookie をクリア（開発者ツール → Application → Cookies）
2. `http://192.168.20.199/login` でログイン
3. Network タブで確認:
   - `POST /api/login` レスポンスに `Set-Cookie: laravel-session`
   - `GET /api/tasks` リクエストに `Cookie: laravel-session=...`

### curl（サーバー側）

```bash
# ログイン
curl -c cookies.txt -b cookies.txt \
  -X POST http://192.168.20.199/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# タスク一覧
curl -b cookies.txt http://192.168.20.199/api/tasks
```

---

## 10. よくあるトラブルと対処

| 症状 | 原因 | 対処 |
|---|---|---|
| 419 CSRF token mismatch | `X-XSRF-TOKEN` 未送信 | 変更系リクエストにヘッダーを付与 |
| 401 Unauthenticated | セッション Cookie 未送信 | `credentials: 'include'`、Cookie クリア後に再ログイン |
| 401（ログイン直後） | ログイン後に `csrf-cookie` でセッション上書き | ログイン前後の不要な `csrf-cookie` 呼び出しを削除 |
| Cookie が保存されない | `SESSION_DOMAIN=null` や空文字 | `.env` から `SESSION_DOMAIN` 行を削除 |
| 画面は出るが API が 401 | 未ログインで `/dashboard` にアクセス | `/login` からログイン |
| Next.js 起動失敗 EADDRINUSE | ポート 3000 が使用中 | `pkill -f "next start"` して再起動 |

---

## 11. 設計上の注意（本番向け）

- HTTPS 利用時は `SESSION_SECURE_COOKIE=true`、`APP_URL=https://...` に変更
- `SANCTUM_STATEFUL_DOMAINS` に本番ドメインを追加
- テストユーザーは Seeder で管理し、本番では削除
- API トークン方式（Bearer）が必要な場合は別設計（モバイルアプリ等）

---

## 12. 関連ファイル一覧

| ファイル | 役割 |
|---|---|
| `backend/routes/api.php` | API ルート定義 |
| `backend/bootstrap/app.php` | ミドルウェア・CSRF 設定 |
| `backend/app/Http/Controllers/AuthController.php` | ログイン・ログアウト |
| `backend/app/Http/Controllers/TaskController.php` | タスク CRUD |
| `frontend/src/lib/api.ts` | API クライアント |
| `frontend/src/app/login/page.tsx` | ログイン画面 |
| `frontend/src/app/dashboard/page.tsx` | ダッシュボード |
| `/etc/nginx/sites-available/ubuntu26.site` | nginx 設定 |

---

## 13. まとめ

同一ドメイン + Sanctum セッション認証で CRUD を行う最小要件は次の 4 点です。

1. **nginx で `/api` を Laravel、`/` を Next.js に振り分ける**
2. **Laravel 側で `web` ミドルウェア + `auth:web` を使う**
3. **Next.js 側で `credentials: 'include'` と CSRF ヘッダーを正しく送る**
4. **ブラウザは常に同一 URL（ポート 80）でアクセスする**

この 4 点を守れば、Sanctum + CRUD はシンプルな構成で運用できます。
