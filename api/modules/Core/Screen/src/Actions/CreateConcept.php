<?php

namespace Origo\Core\Screen\Actions;

use Illuminate\Support\Str;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\LocalizedText;
use Origo\Core\Screen\Models\Concept;

class CreateConcept
{
    /**
     * @param  array{name: array<string, mixed>, description?: array<string, mixed>|null, alsoUsedIn?: array<int, array<string, mixed>>}  $data
     */
    public function handle(Project $project, array $data): Concept
    {
        $name = LocalizedText::normalize($data['name']);

        return Concept::create([
            'project_id' => $project->id,
            'key' => $this->uniqueKey($project, (LocalizedText::primary($name) ?: 'concept')),
            'name' => $name,
            'description' => LocalizedText::normalize($data['description'] ?? null),
            'also_used_in' => array_map(LocalizedText::normalize(...), $data['alsoUsedIn'] ?? []),
        ]);
    }

    private function uniqueKey(Project $project, string $name): string
    {
        $base = Str::slug($name) ?: 'concept';
        $key = $base;
        $suffix = 2;

        while (Concept::query()->where('project_id', $project->id)->where('key', $key)->exists()) {
            $key = "{$base}-".$suffix++;
        }

        return $key;
    }
}
