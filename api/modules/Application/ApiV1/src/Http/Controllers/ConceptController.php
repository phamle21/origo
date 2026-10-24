<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Origo\Application\ApiV1\Http\Requests\StoreConceptRequest;
use Origo\Core\Project\Models\Project;
use Origo\Core\Screen\Actions\CreateConcept;

class ConceptController
{
    public function store(StoreConceptRequest $request, Project $project, CreateConcept $createConcept): JsonResponse
    {
        $concept = $createConcept->handle($project, $request->validated());

        return response()->json(['data' => [
            'key' => $concept->key,
            'name' => $concept->name,
            'description' => $concept->description,
            'alsoUsedIn' => $concept->also_used_in,
        ]], 201);
    }
}
