<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Origo\Core\Project\Models\Project;
use Origo\Core\Screen\Models\Screen;
use Origo\Core\Screen\Models\ScreenPoint;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tagging_a_member_in_a_comment_notifies_only_them(): void
    {
        $project = Project::factory()->create(['code' => 'LMS']);
        $screen = Screen::factory()->for($project)->create();
        $point = ScreenPoint::factory()->for($screen)->create(['number' => 2]);
        $tagged = $this->actingAsProjectMember($project, 'dev');
        $outsider = User::factory()->create();
        $author = $this->actingAsProjectMember($project, 'ba');

        $this->postJson("/api/v1/points/{$point->id}/comments", ['text' => '@Lan xem giúp nhé', 'mentionIds' => [$tagged->id, $outsider->id, $author->id]])
            ->assertCreated()
            ->assertJsonPath('data.mentions', [['id' => $tagged->id, 'name' => $tagged->name]]);

        $this->assertSame(0, $outsider->notifications()->count());
        $this->assertSame(0, $author->notifications()->count());

        Sanctum::actingAs($tagged);
        $this->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonPath('meta.unreadCount', 1)
            ->assertJsonPath('data.0.data.kind', 'mention')
            ->assertJsonPath('data.0.data.project.code', 'LMS')
            ->assertJsonPath('data.0.data.point.number', 2)
            ->assertJsonPath('data.0.data.excerpt', '@Lan xem giúp nhé')
            ->assertJsonPath('data.0.isRead', false);

        $this->postJson('/api/v1/notifications/read')->assertNoContent();
        $this->getJson('/api/v1/notifications')->assertJsonPath('meta.unreadCount', 0)->assertJsonPath('data.0.isRead', true);
    }

    public function test_joining_a_project_and_a_new_role_are_notified(): void
    {
        $project = Project::factory()->create(['code' => 'LMS']);
        $newcomer = User::factory()->create();
        $this->actingAsProjectMember($project, 'manager');

        $memberId = $this->postJson('/api/v1/projects/LMS/members', ['userId' => $newcomer->id, 'role' => 'dev'])->assertCreated()->json('data.id');
        $this->travel(1)->seconds();
        $this->patchJson("/api/v1/projects/LMS/members/{$memberId}", ['role' => 'qa'])->assertOk();
        $this->patchJson("/api/v1/projects/LMS/members/{$memberId}", ['role' => 'qa'])->assertOk();

        Sanctum::actingAs($newcomer);
        $this->getJson('/api/v1/notifications')
            ->assertJsonPath('meta.unreadCount', 2)
            ->assertJsonPath('data.0.data.kind', 'roleChanged')
            ->assertJsonPath('data.0.data.role.key', 'qa')
            ->assertJsonPath('data.1.data.kind', 'memberAdded');

        $first = $this->getJson('/api/v1/notifications')->json('data.1.id');
        $this->postJson('/api/v1/notifications/read', ['ids' => [$first]])->assertNoContent();
        $this->getJson('/api/v1/notifications')->assertJsonPath('meta.unreadCount', 1);
    }

    public function test_a_new_task_owner_is_notified_but_moving_dates_is_quiet(): void
    {
        $project = Project::factory()->create(['code' => 'LMS']);
        $owner = $this->actingAsProjectMember($project, 'dev');
        $this->actingAsProjectMember($project, 'ba');
        $stage = $this->getJson('/api/v1/projects/LMS/plan')->json('data.stages.0.id');
        $phase = $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'phase', 'name' => ['vi' => 'P1']])->json('data.id');
        $module = $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'module', 'name' => ['vi' => 'M'], 'parentId' => $phase])->json('data.id');
        $feature = $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'feature', 'name' => ['vi' => 'Giỏ hàng'], 'parentId' => $module])->json('data.id');
        $task = ['startDate' => '2026-11-01', 'endDate' => '2026-11-05', 'assigneeId' => $owner->id];

        $this->putJson("/api/v1/projects/LMS/plan/items/{$feature}/tasks/{$stage}", $task)->assertOk();
        $this->putJson("/api/v1/projects/LMS/plan/items/{$feature}/tasks/{$stage}", [...$task, 'endDate' => '2026-11-09'])->assertOk();

        $this->assertSame(1, $owner->notifications()->count());
        $this->assertSame('taskAssigned', $owner->notifications()->first()->data['kind']);
        $this->assertSame('Giỏ hàng', $owner->notifications()->first()->data['task']['itemName']['vi']);
    }
}
