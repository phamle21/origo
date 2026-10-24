<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Origo\Core\Plan\Models\PlanStage;
use Origo\Core\Project\Models\Project;
use Origo\Core\Screen\Models\Screen;
use Tests\TestCase;

class PlanApiTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->project = Project::factory()->create(['code' => 'LMS']);
    }

    private function createItem(string $kind, string $name, ?string $parentId = null): string
    {
        return $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => $kind, 'name' => ['vi' => $name], 'parentId' => $parentId])->assertCreated()->json('data.id');
    }

    public function test_opening_a_plan_gives_the_project_the_default_stages(): void
    {
        $this->actingAsProjectMember($this->project, 'dev');

        $this->getJson('/api/v1/projects/LMS/plan')
            ->assertOk()
            ->assertJsonPath('data.canEdit', false)
            ->assertJsonCount(6, 'data.stages')
            ->assertJsonPath('data.stages.0.name', ['vi' => 'Thiết kế cơ bản', 'ja' => '基本設計']);
    }

    public function test_a_plan_is_built_as_phases_modules_and_features_with_dated_tasks(): void
    {
        $this->actingAsProjectMember($this->project, 'ba');
        $stage = $this->getJson('/api/v1/projects/LMS/plan')->json('data.stages.2.id');

        $phase = $this->createItem('phase', 'Phase 1');
        $module = $this->createItem('module', 'Thanh toán', $phase);
        $feature = $this->createItem('feature', 'Giỏ hàng', $module);

        $this->putJson("/api/v1/projects/LMS/plan/items/{$feature}/tasks/{$stage}", ['startDate' => '2026-10-01', 'endDate' => '2026-10-10', 'status' => 'doing'])->assertOk();
        $this->putJson("/api/v1/projects/LMS/plan/items/{$feature}/tasks/{$stage}", ['startDate' => '2026-10-03', 'endDate' => '2026-10-12'])->assertOk();

        $this->getJson('/api/v1/projects/LMS/plan')
            ->assertJsonCount(3, 'data.items')
            ->assertJsonCount(1, 'data.tasks')
            ->assertJsonPath('data.tasks.0', fn (array $task) => $task['startDate'] === '2026-10-03' && $task['endDate'] === '2026-10-12' && $task['itemId'] === $feature);
    }

    public function test_the_tree_shape_and_task_dates_are_enforced(): void
    {
        $this->actingAsProjectMember($this->project, 'manager');
        $stage = $this->getJson('/api/v1/projects/LMS/plan')->json('data.stages.0.id');
        $phase = $this->createItem('phase', 'Phase 1');

        $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'feature', 'name' => ['vi' => 'X'], 'parentId' => $phase])->assertUnprocessable();
        $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'module', 'name' => ['vi' => 'X']])->assertUnprocessable();
        $this->putJson("/api/v1/projects/LMS/plan/items/{$phase}/tasks/{$stage}", ['startDate' => '2026-10-01', 'endDate' => '2026-10-02'])->assertUnprocessable();

        $module = $this->createItem('module', 'M', $phase);
        $feature = $this->createItem('feature', 'F', $module);
        $this->putJson("/api/v1/projects/LMS/plan/items/{$feature}/tasks/{$stage}", ['startDate' => '2026-10-05', 'endDate' => '2026-10-01'])->assertUnprocessable()->assertJsonValidationErrors('endDate');
        $this->putJson("/api/v1/projects/LMS/plan/items/{$feature}/tasks/{$stage}", ['startDate' => '2026-10-01', 'endDate' => '2026-10-02', 'assigneeId' => User::factory()->create()->id])->assertUnprocessable()->assertJsonValidationErrors('assigneeId');
    }

    public function test_items_reorder_and_deleting_a_module_removes_its_features_and_tasks(): void
    {
        $this->actingAsProjectMember($this->project, 'manager');
        $stage = $this->getJson('/api/v1/projects/LMS/plan')->json('data.stages.0.id');
        $phase = $this->createItem('phase', 'P');
        $first = $this->createItem('module', 'A', $phase);
        $second = $this->createItem('module', 'B', $phase);
        $feature = $this->createItem('feature', 'F', $second);
        $this->putJson("/api/v1/projects/LMS/plan/items/{$feature}/tasks/{$stage}", ['startDate' => '2026-10-01', 'endDate' => '2026-10-02'])->assertOk();

        $this->patchJson("/api/v1/projects/LMS/plan/items/{$second}", ['move' => 'up'])->assertNoContent();
        $order = collect($this->getJson('/api/v1/projects/LMS/plan')->json('data.items'))->where('kind', 'module')->sortBy('position')->pluck('id')->all();
        $this->assertSame([$second, $first], $order);

        $this->deleteJson("/api/v1/projects/LMS/plan/items/{$second}")->assertNoContent();
        $this->getJson('/api/v1/projects/LMS/plan')->assertJsonCount(2, 'data.items')->assertJsonCount(0, 'data.tasks');
    }

    public function test_features_link_to_design_screens_and_the_map_shows_the_link_back(): void
    {
        $this->actingAsProjectMember($this->project, 'ba');
        Screen::factory()->create(['project_id' => $this->project->id, 'code' => 'SC-01']);
        $feature = $this->createItem('feature', 'Giỏ hàng', $this->createItem('module', 'M', $this->createItem('phase', 'P')));

        $this->putJson("/api/v1/projects/LMS/plan/items/{$feature}/screens", ['screenCodes' => ['SC-01', 'SC-99']])->assertNoContent();

        $this->getJson('/api/v1/projects/LMS/plan')->assertJsonPath('data.items.2.screenCodes', ['SC-01']);
        $this->getJson('/api/v1/projects/LMS/map')->assertJsonPath('data.screens.0.features.0.name.vi', 'Giỏ hàng');
    }

    public function test_stages_can_be_renamed_reordered_and_removed_with_their_tasks(): void
    {
        $this->actingAsProjectMember($this->project, 'manager');
        $stages = $this->getJson('/api/v1/projects/LMS/plan')->json('data.stages');

        $this->putJson('/api/v1/projects/LMS/plan/stages', ['stages' => [
            ['id' => $stages[2]['id'], 'name' => ['vi' => 'Code'], 'color' => '#112233'],
            ['id' => null, 'name' => ['vi' => 'Đào tạo'], 'color' => '#445566'],
        ]])->assertNoContent();

        $this->assertSame(['development', 'dao-tao'], PlanStage::query()->orderBy('position')->pluck('key')->all());
    }

    public function test_a_customer_reads_the_plan_but_cannot_change_it(): void
    {
        $this->actingAsProjectMember($this->project, 'customer');

        $this->getJson('/api/v1/projects/LMS/plan')->assertOk();
        $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'phase', 'name' => ['vi' => 'P']])->assertForbidden();
    }

    public function test_removing_a_member_keeps_their_tasks_but_clears_who_owns_them(): void
    {
        $manager = $this->actingAsProjectMember($this->project, 'manager');
        $dev = User::factory()->create();
        $memberId = $this->postJson('/api/v1/projects/LMS/members', ['userId' => $dev->id, 'role' => 'dev'])->json('data.id');
        $stage = $this->getJson('/api/v1/projects/LMS/plan')->json('data.stages.2.id');
        $feature = $this->createItem('feature', 'Giỏ hàng', $this->createItem('module', 'Thanh toán', $this->createItem('phase', 'Phase 1')));

        $this->putJson("/api/v1/projects/LMS/plan/items/{$feature}/tasks/{$stage}", ['startDate' => '2026-10-01', 'endDate' => '2026-10-10', 'assigneeId' => $dev->id])->assertOk();
        $this->deleteJson("/api/v1/projects/LMS/members/{$memberId}")->assertNoContent();

        $this->getJson('/api/v1/projects/LMS/plan')
            ->assertJsonCount(1, 'data.tasks')
            ->assertJsonPath('data.tasks.0.assigneeId', null)
            ->assertJsonPath('data.tasks.0.startDate', '2026-10-01');
        $this->assertNotNull($manager);
    }

    public function test_removing_a_stage_removes_only_its_own_tasks(): void
    {
        $this->actingAsProjectMember($this->project, 'ba');
        $stages = $this->getJson('/api/v1/projects/LMS/plan')->json('data.stages');
        $feature = $this->createItem('feature', 'Giỏ hàng', $this->createItem('module', 'Thanh toán', $this->createItem('phase', 'Phase 1')));

        foreach ([$stages[0]['id'], $stages[1]['id']] as $stageId) {
            $this->putJson("/api/v1/projects/LMS/plan/items/{$feature}/tasks/{$stageId}", ['startDate' => '2026-10-01', 'endDate' => '2026-10-02'])->assertOk();
        }

        $kept = array_map(fn (array $stage) => ['id' => $stage['id'], 'name' => $stage['name'], 'color' => $stage['color']], array_slice($stages, 1));
        $this->putJson('/api/v1/projects/LMS/plan/stages', ['stages' => $kept])->assertNoContent();

        $this->getJson('/api/v1/projects/LMS/plan')
            ->assertJsonCount(5, 'data.stages')
            ->assertJsonCount(1, 'data.tasks')
            ->assertJsonPath('data.tasks.0.stageId', $stages[1]['id']);
    }

    public function test_dragging_reorders_siblings_and_moves_features_between_modules(): void
    {
        $this->actingAsProjectMember($this->project, 'ba');
        $phase = $this->createItem('phase', 'Phase 1');
        $cart = $this->createItem('module', 'Giỏ hàng', $phase);
        $pay = $this->createItem('module', 'Thanh toán', $phase);
        [$a, $b, $c] = [$this->createItem('feature', 'A', $cart), $this->createItem('feature', 'B', $cart), $this->createItem('feature', 'C', $cart)];

        $this->patchJson("/api/v1/projects/LMS/plan/items/{$c}", ['parentId' => $cart, 'position' => 0])->assertNoContent();
        $this->assertSame([$c, $a, $b], $this->childrenOf($cart));

        $this->patchJson("/api/v1/projects/LMS/plan/items/{$a}", ['parentId' => $pay, 'position' => 0])->assertNoContent();
        $this->assertSame([$c, $b], $this->childrenOf($cart));
        $this->assertSame([$a], $this->childrenOf($pay));

        // A feature can never become a module's sibling or a top-level item.
        $this->patchJson("/api/v1/projects/LMS/plan/items/{$b}", ['parentId' => $phase, 'position' => 0])->assertUnprocessable();
        $this->patchJson("/api/v1/projects/LMS/plan/items/{$b}", ['parentId' => null, 'position' => 0])->assertUnprocessable();
        $this->patchJson("/api/v1/projects/LMS/plan/items/{$b}", ['position' => 0])->assertUnprocessable();
    }

    public function test_a_feature_keeps_a_team_note_that_can_be_cleared(): void
    {
        $this->actingAsProjectMember($this->project, 'ba');
        $feature = $this->createItem('feature', 'Giỏ hàng', $this->createItem('module', 'Thanh toán', $this->createItem('phase', 'Phase 1')));

        $this->patchJson("/api/v1/projects/LMS/plan/items/{$feature}", ['note' => '  Chờ khách xác nhận giá.  '])->assertNoContent();
        $this->getJson('/api/v1/projects/LMS/plan')->assertJsonPath('data.items.2.note', 'Chờ khách xác nhận giá.');

        $this->patchJson("/api/v1/projects/LMS/plan/items/{$feature}", ['note' => str_repeat('x', 2001)])->assertUnprocessable();
        $this->patchJson("/api/v1/projects/LMS/plan/items/{$feature}", ['note' => '   '])->assertNoContent();
        $this->getJson('/api/v1/projects/LMS/plan')->assertJsonPath('data.items.2.note', null);
    }

    public function test_readers_cannot_change_notes_or_task_status(): void
    {
        $this->actingAsProjectMember($this->project, 'ba');
        $feature = $this->createItem('feature', 'Giỏ hàng', $this->createItem('module', 'Thanh toán', $this->createItem('phase', 'Phase 1')));
        $stage = $this->getJson('/api/v1/projects/LMS/plan')->json('data.stages.0.id');

        $this->actingAsProjectMember($this->project, 'dev');
        $this->patchJson("/api/v1/projects/LMS/plan/items/{$feature}", ['note' => 'x'])->assertForbidden();
        $this->putJson("/api/v1/projects/LMS/plan/items/{$feature}/tasks/{$stage}", ['startDate' => '2026-10-01', 'endDate' => '2026-10-02', 'status' => 'done'])->assertForbidden();
    }

    /** @return list<string> */
    private function childrenOf(string $parentId): array
    {
        return collect($this->getJson('/api/v1/projects/LMS/plan')->json('data.items'))
            ->where('parentId', $parentId)
            ->sortBy('position')
            ->pluck('id')
            ->values()
            ->all();
    }
}
