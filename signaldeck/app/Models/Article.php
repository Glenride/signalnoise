<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'feed_id',
        'title',
        'url',
        'author',
        'summary',
        'content',
        'published_at',
        'group_hash',
        'signal_score',
        'signal_flags',
        'ai_insight',
        'ai_sentiment',
        'ai_facts',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'signal_flags' => 'array',
            'ai_facts' => 'array',
        ];
    }

    // ── Relationships ──────────────────────────────────

    public function feed(): BelongsTo
    {
        return $this->belongsTo(Feed::class);
    }

    public function stories(): BelongsToMany
    {
        return $this->belongsToMany(Story::class)
            ->withPivot('order')
            ->withTimestamps();
    }

    // ── Accessors ──────────────────────────────────────

    public function getFeedNameAttribute(): string
    {
        return $this->feed?->name ?? '';
    }
}
