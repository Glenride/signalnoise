<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Segment extends Model
{
    use HasFactory;

    protected $fillable = [
        'story_id',
        'order',
        'type',
        'script_text',
        'visual_cue',
        'image_url',
        'source_url',
    ];

    // ── Relationships ──────────────────────────────────

    public function story(): BelongsTo
    {
        return $this->belongsTo(Story::class);
    }
}
