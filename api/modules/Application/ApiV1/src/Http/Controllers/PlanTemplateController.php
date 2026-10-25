<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Origo\Core\Plan\Support\Excel\TemplateException;
use Origo\Core\Plan\Support\Excel\TemplateStore;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/** The project-management workbook plan exports are filled into (Settings → Excel template). */
class PlanTemplateController
{
    private const MAX_KILOBYTES = 20 * 1024;

    public function show(TemplateStore $store): JsonResponse
    {
        Gate::authorize('manage-settings');

        return response()->json(['data' => $this->describe($store->meta())]);
    }

    public function store(Request $request, TemplateStore $store): JsonResponse
    {
        Gate::authorize('manage-settings');

        $data = $request->validate([
            'file' => ['required', 'file', 'extensions:xlsx', 'max:'.self::MAX_KILOBYTES],
            'sheet' => ['nullable', 'string', 'max:100'],
        ]);

        try {
            $meta = $store->save($data['file']->getRealPath(), $data['file']->getClientOriginalName(), $data['sheet'] ?? null, $request->user());
        } catch (TemplateException $exception) {
            throw ValidationException::withMessages(['file' => $exception->getMessage()]);
        }

        return response()->json(['data' => $this->describe($meta)], 201);
    }

    public function download(TemplateStore $store): BinaryFileResponse
    {
        Gate::authorize('manage-settings');
        abort_unless($store->exists(), 404);

        return response()->download($store->path(), 'Project_Management_template.xlsx', ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    public function destroy(TemplateStore $store): Response
    {
        Gate::authorize('manage-settings');
        $store->delete();

        return response()->noContent();
    }

    /**
     * @param  array<string, mixed>|null  $meta
     * @return array<string, mixed>|null
     */
    private function describe(?array $meta): ?array
    {
        return $meta ? array_intersect_key($meta, array_flip(['originalName', 'uploadedAt', 'uploadedBy', 'ganttSheet', 'weeklySheet', 'candidates', 'warnings'])) : null;
    }
}
