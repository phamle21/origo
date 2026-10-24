<?php

namespace Origo\Core\Plan\Actions;

use Illuminate\Support\Facades\DB;
use Origo\Core\Plan\Models\PlanItem;
use Origo\Core\Project\Support\LocalizedText;

/** Renames an item and/or moves it one place up or down among its siblings. */
class UpdatePlanItem
{
    /**
     * @param  array{name?: array<string, mixed>, note?: string|null, move?: 'up'|'down'}  $data
     */
    public function handle(PlanItem $item, array $data): PlanItem
    {
        if (isset($data['name'])) {
            $item->update(['name' => LocalizedText::normalize($data['name'])]);
        }

        if (array_key_exists('note', $data)) {
            $note = trim((string) ($data['note'] ?? ''));
            $item->update(['note' => $note === '' ? null : $note]);
        }

        if (isset($data['move'])) {
            $this->move($item, $data['move']);
        }

        return $item->refresh();
    }

    private function move(PlanItem $item, string $direction): void
    {
        $neighbour = PlanItem::query()
            ->where('project_id', $item->project_id)
            ->where('parent_id', $item->parent_id)
            ->where('position', $direction === 'up' ? '<' : '>', $item->position)
            ->orderBy('position', $direction === 'up' ? 'desc' : 'asc')
            ->first();

        if ($neighbour) {
            DB::transaction(function () use ($item, $neighbour) {
                [$first, $second] = [$item->position, $neighbour->position];
                $item->update(['position' => $second]);
                $neighbour->update(['position' => $first]);
            });
        }
    }
}
