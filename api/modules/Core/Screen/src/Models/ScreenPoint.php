<?php

namespace Origo\Core\Screen\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Origo\Core\Screen\Database\Factories\ScreenPointFactory;

/**
 * One numbered point on a screenshot. Design content is stored as JSON in the shapes below, every text
 * being bilingual {"vi": ..., "ja": ...}:
 *
 * - box: [left, top, width, height] in percent of the image
 * - basic: {summary, rules: text[]}
 * - detail: {rows: {item, spec}[], endpoints: string[]}
 * - tests: {given, when, then}[]
 * - history: {phase, note}[]
 */
#[Fillable(['screen_id', 'number', 'box', 'title', 'basic', 'detail', 'tests', 'history'])]
class ScreenPoint extends Model
{
    /** @use HasFactory<ScreenPointFactory> */
    use HasFactory, HasUlids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'number' => 'integer',
            'box' => 'array',
            'title' => 'array',
            'basic' => 'array',
            'detail' => 'array',
            'tests' => 'array',
            'history' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Screen, $this>
     */
    public function screen(): BelongsTo
    {
        return $this->belongsTo(Screen::class);
    }

    /**
     * @return BelongsToMany<Concept, $this>
     */
    public function concepts(): BelongsToMany
    {
        return $this->belongsToMany(Concept::class, 'concept_screen_point');
    }

    /**
     * Points this one needs; the reverse direction and shared-concept links are derived by readers.
     *
     * @return BelongsToMany<ScreenPoint, $this>
     */
    public function dependencies(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'screen_point_dependencies', 'screen_point_id', 'depends_on_id');
    }

    /**
     * @return HasMany<PointComment, $this>
     */
    public function comments(): HasMany
    {
        return $this->hasMany(PointComment::class)->oldest();
    }

    protected static function newFactory(): ScreenPointFactory
    {
        return ScreenPointFactory::new();
    }
}
