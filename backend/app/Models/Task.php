<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    // Next.jsから送られてきたデータを一括保存できるように許可
    protected $fillable = ['title', 'is_completed', 'user_id'];

    // 💡 タスクは必ず特定のユーザーに所属するという設定（リレーション）
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
