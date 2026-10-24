<?php

namespace Origo\Core\Plan\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Origo\Core\Plan\Enums\PlanItemKind;
use Origo\Core\Project\Models\Project;
use Origo\Core\Screen\Models\Screen;

#[Fillable(['project_id', 'parent_id', 'kind', 'name', 'note', 'position'])]
class PlanItem extends Model
{
    use HasUlids;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['kind' => PlanItemKind::class, 'name' => 'array', 'position' => 'integer'];
    }

    /**
     * @return BelongsTo<PlanItem, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return HasMany<PlanTask, $this>
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(PlanTask::class);
    }

    /**
     * Screens of the design that describe this feature.
     *
     * @return BelongsToMany<Screen, $this>
     */
    public function screens(): BelongsToMany
    {
        return $this->belongsToMany(Screen::class, 'plan_item_screen');
    }
}
