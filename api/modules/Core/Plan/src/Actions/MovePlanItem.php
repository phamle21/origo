<?php

namespace Origo\Core\Plan\Actions;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Origo\Core\Plan\Models\PlanItem;

/**
 * Drag-and-drop ordering: puts an item at a given index under a parent, which may be its current one
 * or another of the right kind (a feature under any module, a module under any phase). Positions of
 * both the old and the new siblings are renumbered 1..n, with the rows locked meanwhile.
 */
class MovePlanItem
{
    public function handle(PlanItem $item, ?PlanItem $parent, int $index): PlanItem
    {
        if ($parent?->kind !== $item->kind->parentKind() || ($parent !== null && $parent->project_id !== $item->project_id)) {
            throw ValidationException::withMessages(['parentId' => 'A phase sits at the top, a module inside a phase and a feature inside a module.']);
        }

        DB::transaction(function () use ($item, $parent, $index) {
            $oldParentId = $item->parent_id;
            $siblings = $this->siblings($item->project_id, $parent?->id)->reject(fn (PlanItem $sibling) => $sibling->is($item))->values();
            $siblings->splice(max(0, min($index, $siblings->count())), 0, [$item]);

            foreach ($siblings as $position => $sibling) {
                $sibling->forceFill(['parent_id' => $parent?->id, 'position' => $position + 1])->save();
            }

            if ($oldParentId !== $parent?->id) {
                foreach ($this->siblings($item->project_id, $oldParentId)->values() as $position => $sibling) {
                    $sibling->forceFill(['position' => $position + 1])->save();
                }
            }
        });

        return $item->refresh();
    }

    /** @return Collection<int, PlanItem> */
    private function siblings(string $projectId, ?string $parentId)
    {
        return PlanItem::query()
            ->where('project_id', $projectId)
            ->where('parent_id', $parentId)
            ->orderBy('position')
            ->lockForUpdate()
            ->get();
    }
}
