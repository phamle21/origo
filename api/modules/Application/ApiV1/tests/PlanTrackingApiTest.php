<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Origo\Core\Plan\Models\PlanWeeklyReport;
use Origo\Core\Project\Models\Project;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class PlanTrackingApiTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;

    private string $feature;

    /** @var list<string> */
    private array $stages;

    protected function setUp(): void
    {
        parent::setUp();

        // No uploaded Excel template: exports use Origo's own layout.
        Storage::fake('local');
        Carbon::setTestNow('2026-10-21 08:00:00'); // a Wednesday
        $this->project = Project::factory()->create(['code' => 'LMS']);
        $this->actingAsProjectMember($this->project, 'ba');
        $this->stages = $this->getJson('/api/v1/projects/LMS/plan')->json('data.stages.*.id');
        $phase = $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'phase', 'name' => ['vi' => 'Phase 1'], 'parentId' => null])->json('data.id');
        $module = $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'module', 'name' => ['vi' => 'Bán hàng'], 'parentId' => $phase])->json('data.id');
        $this->feature = $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'feature', 'name' => ['vi' => 'Giỏ hàng'], 'parentId' => $module])->json('data.id');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function saveTask(int $stage, array $data): void
    {
        $this->putJson("/api/v1/projects/LMS/plan/items/{$this->feature}/tasks/{$this->stages[$stage]}", $data)->assertOk();
    }

    public function test_a_plan_starts_with_one_status_per_category(): void
    {
        $this->getJson('/api/v1/projects/LMS/plan')
            ->assertJsonCount(3, 'data.statuses')
            ->assertJsonPath('data.statuses.*.category', ['todo', 'doing', 'done']);
    }

    public function test_tasks_keep_effort_progress_link_and_note_when_only_their_dates_move(): void
    {
        $this->saveTask(0, ['startDate' => '2026-10-19', 'endDate' => '2026-10-20', 'estimateDays' => 1.5, 'progress' => 40, 'link' => 'https://example.com/spec', 'note' => 'Chờ khách']);
        $this->saveTask(0, ['startDate' => '2026-10-20', 'endDate' => '2026-10-22', 'status' => 'doing']);

        $this->getJson('/api/v1/projects/LMS/plan')->assertJsonPath('data.tasks.0', fn (array $task) => $task['estimateDays'] === 1.5
            && $task['progress'] === 40
            && $task['link'] === 'https://example.com/spec'
            && $task['note'] === 'Chờ khách'
            && $task['status'] === 'doing');
    }

    public function test_custom_statuses_set_the_category_and_must_cover_every_category(): void
    {
        $current = $this->getJson('/api/v1/projects/LMS/plan')->json('data.statuses');
        $statuses = [...$current, ['id' => null, 'name' => ['vi' => 'Đang kiểm tra'], 'category' => 'doing', 'color' => '#ca8a04']];

        $this->putJson('/api/v1/projects/LMS/plan/statuses', ['statuses' => $statuses])->assertNoContent();
        $checking = collect($this->getJson('/api/v1/projects/LMS/plan')->json('data.statuses'))->firstWhere('name.vi', 'Đang kiểm tra');

        $this->saveTask(0, ['startDate' => '2026-10-19', 'endDate' => '2026-10-20', 'statusId' => $checking['id']]);
        $this->getJson('/api/v1/projects/LMS/plan')->assertJsonPath('data.tasks.0.status', 'doing')->assertJsonPath('data.tasks.0.statusId', $checking['id']);

        // The quick menu sends a category only; a status already in that category is kept.
        $this->saveTask(0, ['startDate' => '2026-10-19', 'endDate' => '2026-10-20', 'status' => 'doing']);
        $this->getJson('/api/v1/projects/LMS/plan')->assertJsonPath('data.tasks.0.statusId', $checking['id']);

        $withoutDone = array_values(array_filter($statuses, fn ($status) => $status['category'] !== 'done'));
        $this->putJson('/api/v1/projects/LMS/plan/statuses', ['statuses' => [...$withoutDone, $withoutDone[0]]])->assertUnprocessable();
    }

    public function test_the_summary_weighs_progress_by_effort_and_counts_working_days(): void
    {
        $this->asAdmin()->putJson('/api/v1/admin/settings/work-calendar', ['days' => [['date' => '2026-10-16', 'kind' => 'holiday', 'name' => 'Lễ']]])->assertNoContent();
        $this->actingAsProjectMember($this->project, 'ba');

        $this->saveTask(0, ['startDate' => '2026-10-12', 'endDate' => '2026-10-16', 'status' => 'done', 'estimateDays' => 3]);
        $this->saveTask(1, ['startDate' => '2026-10-19', 'endDate' => '2026-10-30', 'status' => 'doing', 'estimateDays' => 1, 'progress' => 50]);

        $this->getJson('/api/v1/projects/LMS/plan')
            ->assertJsonPath('data.summary.overall.estimateDays', 4)
            ->assertJsonPath('data.summary.overall.actualDays', 3.5)
            ->assertJsonPath('data.summary.overall.progress', 0.875)
            ->assertJsonPath('data.summary.overall.basis', 'effort')
            // 12–30 Oct: 15 weekdays minus the holiday; 12–21 Oct passed: 8 minus the holiday.
            ->assertJsonPath('data.summary.overall.workingDays', 14)
            ->assertJsonPath('data.summary.overall.workingDaysPassed', 7)
            ->assertJsonPath('data.summary.stages.0.progress', 1)
            ->assertJsonPath('data.summary.stages.1.progress', 0.5);
    }

    public function test_stage_windows_and_feature_priority_are_saved(): void
    {
        $stages = collect($this->getJson('/api/v1/projects/LMS/plan')->json('data.stages'))
            ->map(fn (array $stage, int $index) => [...$stage, ...($index === 0 ? ['startDate' => '2026-10-01', 'endDate' => '2026-10-20', 'owner' => 'VN'] : [])])
            ->all();

        $this->putJson('/api/v1/projects/LMS/plan/stages', ['stages' => $stages])->assertNoContent();
        $this->patchJson("/api/v1/projects/LMS/plan/items/{$this->feature}", ['priority' => 2])->assertNoContent();

        $this->getJson('/api/v1/projects/LMS/plan')
            ->assertJsonPath('data.stages.0.owner', 'VN')
            ->assertJsonPath('data.stages.0.startDate', '2026-10-01')
            ->assertJsonPath('data.summary.stages.0.workingDays', 14)
            ->assertJsonPath('data.items.2.priority', 2);
    }

    public function test_weekly_reports_record_progress_keep_summaries_and_member_hours(): void
    {
        $member = auth()->user();
        $this->saveTask(0, ['startDate' => '2026-10-12', 'endDate' => '2026-10-16', 'status' => 'done', 'estimateDays' => 2]);

        $this->postJson('/api/v1/projects/LMS/plan/weekly/2026-10-19/record')->assertNoContent();
        $this->patchJson('/api/v1/projects/LMS/plan/weekly/2026-10-19', ['summary' => ['vi' => 'Xong giỏ hàng'], 'hours' => [$member->id => 32]])->assertNoContent();
        $this->postJson('/api/v1/projects/LMS/plan/weekly/2026-10-26/record')->assertUnprocessable();
        $this->patchJson('/api/v1/projects/LMS/plan/weekly/2026-10-20', ['hours' => []])->assertUnprocessable();
        $this->patchJson('/api/v1/projects/LMS/plan/weekly/2026-10-19', ['hours' => [User::factory()->create()->id => 8]])->assertUnprocessable();

        $week = collect($this->getJson('/api/v1/projects/LMS/plan/weekly')->assertOk()->json('data.weeks'))->firstWhere('weekStart', '2026-10-19');

        $this->assertSame(1, $week['snapshot']['overall']['progress']);
        $this->assertSame('Xong giỏ hàng', $week['summary']['vi']);
        $this->assertEquals([$member->id => 32], $week['hours']);
    }

    public function test_the_monday_job_records_last_week_for_active_projects(): void
    {
        $this->saveTask(0, ['startDate' => '2026-10-12', 'endDate' => '2026-10-16', 'status' => 'done']);

        $this->artisan('origo:plan-weekly-snapshot')->assertExitCode(0);

        $this->assertTrue(PlanWeeklyReport::query()->where('project_id', $this->project->id)->whereDate('week_start', '2026-10-12')->whereNotNull('snapshot')->exists());
    }

    public function test_the_plan_exports_as_a_workbook_laid_out_like_the_team_sheet(): void
    {
        $this->patchJson("/api/v1/projects/LMS/plan/items/{$this->feature}", ['priority' => 1]);
        $this->saveTask(0, ['startDate' => '2026-10-12', 'endDate' => '2026-10-16', 'status' => 'done', 'estimateDays' => 2, 'link' => 'https://example.com']);

        $response = $this->get('/api/v1/projects/LMS/plan/export')->assertOk();
        $this->assertStringContainsString('spreadsheetml', $response->headers->get('Content-Type'));

        $path = tempnam(sys_get_temp_dir(), 'plan').'.xlsx';
        file_put_contents($path, $response->streamedContent());
        $book = IOFactory::load($path);
        unlink($path);

        $this->assertSame(['Gantt Chart', 'Weekly Report', '.setting'], $book->getSheetNames());
        $gantt = $book->getSheet(0);
        $this->assertSame('[LMS] '.$this->project->name['vi'], $gantt->getCell('B1')->getValue());
        $this->assertSame('PAGE TITLE / To-do', $gantt->getCell('D9')->getValue());
        $this->assertSame('P1', $gantt->getCell('A13')->getValue());
        $this->assertSame('Giỏ hàng', $gantt->getCell('D13')->getValue());
        $this->assertEquals(2, $gantt->getCell('H13')->getValue());
        $this->assertSame('Xong', $gantt->getCell('L13')->getValue());
    }

    public function test_only_admins_edit_the_work_calendar_and_everyone_reads_it(): void
    {
        $this->putJson('/api/v1/admin/settings/work-calendar', ['days' => []])->assertForbidden();

        $this->asAdmin()->putJson('/api/v1/admin/settings/work-calendar', ['days' => [
            ['date' => '2026-09-02', 'kind' => 'holiday', 'name' => 'Quốc khánh'],
            ['date' => '2026-09-05', 'kind' => 'workday', 'name' => 'Làm bù'],
        ]])->assertNoContent();

        $this->actingAsProjectMember($this->project, 'dev');
        $this->getJson('/api/v1/work-calendar')->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('data.1.kind', 'workday');
    }

    private function asAdmin(): static
    {
        return $this->actingAs(User::factory()->admin()->create());
    }
}
