<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use App\Models\User;
use App\Notifications\ActivityNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Origo\Core\Plan\Actions\CreatePlanItem;
use Origo\Core\Plan\Actions\EnsureDefaultStages;
use Origo\Core\Plan\Actions\LinkPlanItemScreens;
use Origo\Core\Plan\Actions\MovePlanItem;
use Origo\Core\Plan\Actions\SavePlanTask;
use Origo\Core\Plan\Actions\SyncPlanStages;
use Origo\Core\Plan\Actions\UpdatePlanItem;
use Origo\Core\Plan\Enums\PlanItemKind;
use Origo\Core\Plan\Enums\PlanTaskStatus;
use Origo\Core\Plan\Models\PlanItem;
use Origo\Core\Plan\Models\PlanStage;
use Origo\Core\Plan\Models\PlanTask;
use Origo\Core\Plan\Support\PlanStatuses;
use Origo\Core\Plan\Support\PlanSummary;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\LocalizedText;

/**
 * The project plan in one read (stages, the phase → module → feature tree, every task and the screens
 * linked to each feature) and the small writes the Gantt chart makes as bars are moved.
 */
class PlanController
{
    public const MAX_ITEMS_PER_PROJECT = 1_000;

    public function show(Request $request, Project $project, EnsureDefaultStages $ensureStages, PlanStatuses $planStatuses, PlanSummary $summary): JsonResponse
    {
        Gate::authorize('view', $project);

        $ensureStages->handle($project);
        $statuses = $planStatuses->forProject($project);
        $items = PlanItem::query()->where('project_id', $project->id)->with('screens:id,code')->orderBy('position')->get();
        $tasks = PlanTask::query()->whereIn('plan_item_id', $items->pluck('id'))->get();

        return response()->json(['data' => [
            'canEdit' => Gate::allows('editPlan', $project),
            'stages' => PlanStage::query()->where('project_id', $project->id)->orderBy('position')->get()->map(fn (PlanStage $stage) => [
                'id' => $stage->id,
                'key' => $stage->key,
                'name' => LocalizedText::normalize($stage->name),
                'color' => $stage->color,
                'startDate' => $stage->start_date?->toDateString(),
                'endDate' => $stage->end_date?->toDateString(),
                'owner' => $stage->owner,
            ]),
            'statuses' => $statuses->map(fn ($status) => [
                'id' => $status->id,
                'name' => LocalizedText::normalize($status->name),
                'category' => $status->category->value,
                'color' => $status->color,
            ]),
            'items' => $items->map(fn (PlanItem $item) => [
                'id' => $item->id,
                'parentId' => $item->parent_id,
                'kind' => $item->kind->value,
                'name' => LocalizedText::normalize($item->name),
                'note' => $item->note,
                'priority' => $item->priority,
                'position' => $item->position,
                'screenCodes' => $item->screens->pluck('code')->sort()->values(),
            ]),
            'tasks' => $tasks->map(fn (PlanTask $task) => [
                'id' => $task->id,
                'itemId' => $task->plan_item_id,
                'stageId' => $task->plan_stage_id,
                'startDate' => $task->start_date->toDateString(),
                'endDate' => $task->end_date->toDateString(),
                'status' => $task->status->value,
                'statusId' => $planStatuses->resolve($task, $statuses)?->id,
                'assigneeId' => $task->assignee_id,
                'estimateDays' => $task->estimate_days,
                'progress' => $task->progress,
                'link' => $task->link,
                'note' => $task->note,
            ]),
            'summary' => $summary->for($project),
        ]]);
    }

    public function syncStages(Request $request, Project $project, SyncPlanStages $syncStages): Response
    {
        Gate::authorize('editPlan', $project);

        $data = $request->validate([
            'stages' => ['required', 'array', 'min:1', 'max:20'],
            'stages.*.id' => ['nullable', 'string', Rule::exists('plan_stages', 'id')->where('project_id', $project->id)],
            ...LocalizedText::rules('stages.*.name', required: true, max: 60),
            'stages.*.color' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'stages.*.startDate' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'stages.*.endDate' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'stages.*.owner' => ['sometimes', 'nullable', 'string', 'max:30'],
        ]);

        foreach ($data['stages'] as $index => $stage) {
            if (($stage['startDate'] ?? null) && ($stage['endDate'] ?? null) && $stage['endDate'] < $stage['startDate']) {
                throw ValidationException::withMessages(["stages.{$index}.endDate" => 'The end date must not be before the start date.']);
            }
        }

        $syncStages->handle($project, $data['stages']);

        return response()->noContent();
    }

    public function syncStatuses(Request $request, Project $project, PlanStatuses $statuses): Response
    {
        Gate::authorize('editPlan', $project);

        $data = $request->validate([
            'statuses' => ['required', 'array', 'min:3', 'max:20'],
            'statuses.*.id' => ['nullable', 'string', Rule::exists('plan_statuses', 'id')->where('project_id', $project->id)],
            ...LocalizedText::rules('statuses.*.name', required: true, max: 40),
            'statuses.*.category' => ['required', Rule::enum(PlanTaskStatus::class)],
            'statuses.*.color' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        $statuses->sync($project, $data['statuses']);

        return response()->noContent();
    }

    public function storeItem(Request $request, Project $project, CreatePlanItem $createItem): JsonResponse
    {
        Gate::authorize('editPlan', $project);

        $data = $request->validate([
            'kind' => ['required', Rule::enum(PlanItemKind::class)],
            'parentId' => ['nullable', 'string', Rule::exists('plan_items', 'id')->where('project_id', $project->id)],
            ...LocalizedText::rules('name', required: true, max: 160),
        ]);

        abort_if(PlanItem::query()->where('project_id', $project->id)->count() >= self::MAX_ITEMS_PER_PROJECT, 422, 'The plan holds too many items.');

        $parent = isset($data['parentId']) ? PlanItem::query()->findOrFail($data['parentId']) : null;
        $item = $createItem->handle($project, PlanItemKind::from($data['kind']), $data['name'], $parent);

        return response()->json(['data' => ['id' => $item->id]], 201);
    }

    public function updateItem(Request $request, Project $project, PlanItem $item, UpdatePlanItem $updateItem, MovePlanItem $moveItem): Response
    {
        Gate::authorize('editPlan', $project);
        $this->ensureBelongs($project, $item);

        $data = $request->validate([
            ...LocalizedText::rules('name', required: false, max: 160),
            'move' => ['nullable', 'in:up,down'],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'priority' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:5'],
            // Drag and drop: the new parent (null for a phase) and the index among its children.
            'position' => ['sometimes', 'integer', 'min:0', 'max:'.self::MAX_ITEMS_PER_PROJECT],
            'parentId' => ['required_with:position', 'nullable', 'string', Rule::exists('plan_items', 'id')->where('project_id', $project->id)],
        ]);

        $updateItem->handle($item, $data);

        if (array_key_exists('position', $data)) {
            $parent = $data['parentId'] !== null ? PlanItem::query()->findOrFail($data['parentId']) : null;
            $moveItem->handle($item, $parent, (int) $data['position']);
        }

        return response()->noContent();
    }

    public function destroyItem(Project $project, PlanItem $item): Response
    {
        Gate::authorize('editPlan', $project);
        $this->ensureBelongs($project, $item);

        $item->delete();

        return response()->noContent();
    }

    public function saveTask(Request $request, Project $project, PlanItem $item, PlanStage $stage, SavePlanTask $saveTask): JsonResponse
    {
        Gate::authorize('editPlan', $project);
        $this->ensureBelongs($project, $item);
        abort_unless($stage->project_id === $project->id, 404);

        $data = $request->validate([
            'startDate' => ['required', 'date_format:Y-m-d'],
            'endDate' => ['required', 'date_format:Y-m-d', 'after_or_equal:startDate'],
            'status' => ['nullable', Rule::enum(PlanTaskStatus::class)],
            'statusId' => ['sometimes', 'nullable', 'string', 'max:40'],
            'assigneeId' => ['nullable', 'integer'],
            'estimateDays' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:999'],
            'progress' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100'],
            'link' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $previousAssignee = PlanTask::query()->where('plan_item_id', $item->id)->where('plan_stage_id', $stage->id)->value('assignee_id');
        $task = $saveTask->handle($item, $stage, $data);

        // The new owner of a schedule entry hears about it; moving the dates alone tells nobody.
        if ($task->assignee_id && $task->assignee_id !== $previousAssignee) {
            ActivityNotification::send(User::query()->whereKey($task->assignee_id)->get(), new ActivityNotification(
                ActivityNotification::TASK_ASSIGNED,
                $request->user(),
                ActivityNotification::projectRef($project),
                ['task' => ['itemName' => $item->name, 'stageName' => $stage->name, 'startDate' => $data['startDate'], 'endDate' => $data['endDate']]],
            ));
        }

        return response()->json(['data' => ['id' => $task->id]]);
    }

    public function destroyTask(Project $project, PlanItem $item, PlanStage $stage): Response
    {
        Gate::authorize('editPlan', $project);
        $this->ensureBelongs($project, $item);

        PlanTask::query()->where('plan_item_id', $item->id)->where('plan_stage_id', $stage->id)->delete();

        return response()->noContent();
    }

    public function linkScreens(Request $request, Project $project, PlanItem $item, LinkPlanItemScreens $linkScreens): Response
    {
        Gate::authorize('editPlan', $project);
        $this->ensureBelongs($project, $item);

        $data = $request->validate(['screenCodes' => ['present', 'array', 'max:50'], 'screenCodes.*' => ['string', 'max:8']]);
        $linkScreens->handle($item, $data['screenCodes']);

        return response()->noContent();
    }

    private function ensureBelongs(Project $project, PlanItem $item): void
    {
        abort_unless($item->project_id === $project->id, 404);
    }
}
