<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Origo\Core\Plan\Actions\DefaultStageTemplate;
use Origo\Core\Project\Support\LocalizedText;

/** System settings that only admins change. */
class SettingsController
{
    public function stageTemplate(DefaultStageTemplate $template): JsonResponse
    {
        Gate::authorize('manage-settings');

        return response()->json(['data' => $template->stages()]);
    }

    public function saveStageTemplate(Request $request, DefaultStageTemplate $template): Response
    {
        Gate::authorize('manage-settings');

        $data = $request->validate([
            'stages' => ['required', 'array', 'min:1', 'max:20'],
            ...LocalizedText::rules('stages.*.name', required: true, max: 60),
            'stages.*.color' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        $template->save($data['stages']);

        return response()->noContent();
    }
}
