<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Origo\Core\Plan\Support\Excel\TemplateFiller;
use Origo\Core\Plan\Support\Excel\TemplateStore;
use Origo\Core\Plan\Support\PlanSpreadsheet;
use Origo\Core\Plan\Support\WeeklyReports;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\LocalizedText;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** The weekly report of a plan (progress per week, hours, summaries) and the Excel export. */
class PlanReportController
{
    public function weekly(Project $project, WeeklyReports $reports): JsonResponse
    {
        Gate::authorize('view', $project);

        return response()->json(['data' => [
            'canEdit' => Gate::allows('editPlan', $project),
            'currentWeek' => WeeklyReports::weekStart(now())->toDateString(),
            'members' => $project->members()->with('user:id,name,title')->get()->pluck('user')->filter()->sortBy('name')->values()
                ->map(fn ($user) => ['id' => $user->id, 'name' => $user->name, 'title' => $user->title]),
            'weeks' => $reports->weeks($project),
        ]]);
    }

    public function updateWeek(Request $request, Project $project, string $week, WeeklyReports $reports): Response
    {
        Gate::authorize('editPlan', $project);
        $monday = $this->monday($week);

        $data = $request->validate([
            ...LocalizedText::rules('summary', required: false, max: 5000),
            'hours' => ['sometimes', 'array', 'max:200'],
            'hours.*' => ['nullable', 'numeric', 'min:0', 'max:168'],
        ]);

        $memberIds = $project->members()->pluck('user_id')->all();
        foreach (array_keys($data['hours'] ?? []) as $userId) {
            if (! in_array((int) $userId, $memberIds, true)) {
                throw ValidationException::withMessages(['hours' => 'Hours can only be entered for members of the project.']);
            }
        }

        $reports->update($project, $monday, $data);

        return response()->noContent();
    }

    /** Freezes the plan's figures now under the given week, e.g. "record this week" before the Monday job. */
    public function recordWeek(Project $project, string $week, WeeklyReports $reports): Response
    {
        Gate::authorize('editPlan', $project);
        $monday = $this->monday($week);

        abort_if($monday->gt(WeeklyReports::weekStart(now())), 422, 'A future week cannot be recorded.');

        $reports->record($project, $monday);

        return response()->noContent();
    }

    /**
     * The plan filled into the team's own workbook when an admin has uploaded one (Settings → Excel
     * template); otherwise a workbook Origo lays out itself.
     */
    public function export(Request $request, Project $project, PlanSpreadsheet $spreadsheet, TemplateStore $templates, TemplateFiller $filler): StreamedResponse
    {
        Gate::authorize('view', $project);

        $language = (string) $request->query('lang', 'vi');
        $language = preg_match('/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/', $language) ? $language : 'vi';
        $template = $templates->meta();
        $book = $template
            ? $filler->fill($templates->path(), $template['ganttSheet'], $project, $language, $template['statusStyles'] ?? [])
            : $spreadsheet->build($project, $language);
        $name = sprintf('%s_Project_Management_%s.xlsx', Str::slug($project->code), now()->format('Ymd'));

        return response()->streamDownload(function () use ($book) {
            $writer = new Xlsx($book);
            // Formulas are left for Excel or Google Sheets to work out on opening, as in the team's own file.
            $writer->setPreCalculateFormulas(false);
            $writer->save('php://output');
            $book->disconnectWorksheets();
        }, $name, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    private function monday(string $week): CarbonImmutable
    {
        abort_unless(preg_match('/^\d{4}-\d{2}-\d{2}$/', $week) === 1, 404);

        $day = CarbonImmutable::createFromFormat('!Y-m-d', $week) ?: abort(404);
        abort_unless($day->isMonday(), 422, 'A week is given by its Monday.');

        return $day;
    }
}
