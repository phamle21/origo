<?php

namespace Origo\Core\Project\Actions;

use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\LocalizedText;

class UpdateProject
{
    /**
     * @param  array{code?: string, name?: array{vi: string, ja: string|null}, description?: array{vi: string|null, ja: string|null}|null}  $data
     */
    public function handle(Project $project, array $data): Project
    {
        foreach (['name', 'description'] as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = LocalizedText::normalize($data[$field]);
            }
        }

        $project->update($data);

        return $project;
    }
}
