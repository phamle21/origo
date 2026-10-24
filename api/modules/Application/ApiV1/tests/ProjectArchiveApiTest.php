<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\User;
use App\Notifications\ActivityNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Origo\Core\Project\Models\Project;
use Tests\TestCase;

class ProjectArchiveApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_manager_archives_a_project_which_then_refuses_changes_and_can_be_brought_back(): void
    {
        $project = Project::factory()->create(['code' => 'LMS']);
        $this->actingAsProjectMember($project, 'manager');

        $this->postJson('/api/v1/projects/LMS/archive')->assertOk()->assertJsonPath('data.archivedAt', fn ($value) => $value !== null);
        $this->getJson('/api/v1/projects')->assertJsonPath('data.0.permissions.canEditPlan', false)->assertJsonPath('data.0.permissions.canArchive', true);
        $this->patchJson('/api/v1/projects/LMS/details', ['name' => ['vi' => 'Đổi']])->assertForbidden();
        $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'phase', 'name' => ['vi' => 'P']])->assertForbidden();
        $this->getJson('/api/v1/projects/LMS/plan')->assertOk();

        $this->postJson('/api/v1/projects/LMS/unarchive')->assertOk()->assertJsonPath('data.archivedAt', null);
        $this->postJson('/api/v1/projects/LMS/plan/items', ['kind' => 'phase', 'name' => ['vi' => 'P']])->assertCreated();
    }

    public function test_readers_cannot_archive_and_managers_cannot_delete_for_good(): void
    {
        $project = Project::factory()->create(['code' => 'LMS']);
        $this->actingAsProjectMember($project, 'dev');
        $this->postJson('/api/v1/projects/LMS/archive')->assertForbidden();

        $this->actingAsProjectMember($project, 'manager');
        $this->deleteJson('/api/v1/projects/LMS/forever', ['confirmCode' => 'LMS'])->assertForbidden();
    }

    public function test_an_admin_deletes_for_good_only_with_the_exact_code(): void
    {
        $project = Project::factory()->create(['code' => 'LMS']);
        $member = $this->actingAsProjectMember($project, 'dev');
        $member->notify(new ActivityNotification('memberAdded', $member, ['code' => 'LMS', 'name' => ['vi' => 'L']]));
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->deleteJson('/api/v1/projects/LMS/forever', ['confirmCode' => 'lms'])->assertUnprocessable()->assertJsonValidationErrors('confirmCode');
        $this->assertNotNull(Project::query()->where('code', 'LMS')->first());

        $this->deleteJson('/api/v1/projects/LMS/forever', ['confirmCode' => 'LMS'])->assertNoContent();
        $this->assertNull(Project::withTrashed()->where('code', 'LMS')->first());
        $this->assertSame(0, $member->notifications()->count());
        $this->assertDatabaseMissing('project_members', ['user_id' => $member->id]);
    }
}
