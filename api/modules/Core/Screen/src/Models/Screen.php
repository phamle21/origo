<?php

namespace Origo\Core\Screen\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Origo\Core\Project\Models\Project;
use Origo\Core\Screen\Database\Factories\ScreenFactory;

#[Fillable(['project_id', 'code', 'name', 'flow', 'purpose', 'image_path', 'image_width', 'image_height', 'source_type', 'source_url', 'source_path', 'render_width', 'position'])]
class Screen extends Model
{
    /** @use HasFactory<ScreenFactory> */
    use HasFactory, HasUlids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'name' => 'array',
            'flow' => 'array',
            'purpose' => 'array',
            'image_width' => 'integer',
            'image_height' => 'integer',
            'render_width' => 'integer',
            'position' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return HasMany<ScreenPoint, $this>
     */
    public function points(): HasMany
    {
        return $this->hasMany(ScreenPoint::class)->orderBy('number');
    }

    public function imageUrl(): string
    {
        return Storage::disk('public')->url($this->image_path);
    }

    protected static function newFactory(): ScreenFactory
    {
        return ScreenFactory::new();
    }
}
