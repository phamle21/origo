<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Origo\Core\Project\Models\Project;
use Tests\TestCase;

class ProjectApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_rejected(): void
    {
        $this->getJson('/api/v1/projects')->assertUnauthorized();
    }

    public function test_an_admin_creates_a_project_and_the_chosen_manager_joins_it(): void
    {
        $manager = User::factory()->create();
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->postJson('/api/v1/projects', ['code' => 'LMS', 'name' => ['vi' => 'Cổng học', 'ja' => 'ポータル'], 'managerId' => $manager->id])
            ->assertCreated()
            ->assertJsonPath('data.code', 'LMS');

        $this->assertSame('manager', Project::query()->firstOrFail()->roleOf($manager)?->key);
    }

    public function test_a_member_cannot_create_projects(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/projects', ['code' => 'LMS', 'name' => ['vi' => 'A']])->assertForbidden();
    }

    public function test_people_only_see_the_projects_they_belong_to_while_admins_see_all(): void
    {
        $mine = Project::factory()->create(['code' => 'LMS']);
        Project::factory()->create(['code' => 'HRM']);

        $this->actingAsProjectMember($mine, 'dev');
        $this->getJson('/api/v1/projects')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'LMS')
            ->assertJsonPath('data.0.myRole', 'dev')
            ->assertJsonPath('data.0.permissions', ['canEditDesign' => false, 'canEditPlan' => false, 'canManageMembers' => false, 'canEditProject' => false, 'canArchive' => false, 'canDelete' => false]);

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->getJson('/api/v1/projects')->assertJsonCount(2, 'data');
    }

    public function test_the_list_shows_who_manages_each_project_and_how_many_people_work_on_it(): void
    {
        $project = Project::factory()->create(['code' => 'LMS']);
        $manager = User::factory()->create(['name' => 'Hoàng']);
        $project->members()->create(['user_id' => $manager->id, 'role' => 'manager']);
        $this->actingAsProjectMember($project, 'qa');

        $this->getJson('/api/v1/projects')
            ->assertOk()
            ->assertJsonPath('data.0.memberCount', 2)
            ->assertJsonCount(1, 'data.0.managers')
            ->assertJsonPath('data.0.managers.0.name', 'Hoàng');
    }

    public function test_project_code_must_be_uppercase_and_unique(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        Project::factory()->create(['code' => 'LMS']);

        $this->postJson('/api/v1/projects', ['code' => 'lms', 'name' => ['vi' => 'A']])->assertUnprocessable()->assertJsonValidationErrors('code');
        $this->postJson('/api/v1/projects', ['code' => 'LMS', 'name' => ['vi' => 'A']])->assertUnprocessable()->assertJsonValidationErrors('code');
    }

    public function test_only_a_manager_renames_the_project_and_only_an_admin_deletes_it(): void
    {
        $project = Project::factory()->create();

        $this->actingAsProjectMember($project, 'ba');
        $this->patchJson("/api/v1/projects/{$project->id}", ['name' => ['vi' => 'Đổi tên']])->assertForbidden();

        $this->actingAsProjectMember($project, 'manager');
        $this->patchJson("/api/v1/projects/{$project->id}", ['name' => ['vi' => 'Đổi tên', 'ja' => null]])->assertOk()->assertJsonPath('data.name.vi', 'Đổi tên');
        $this->deleteJson("/api/v1/projects/{$project->id}")->assertForbidden();

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->deleteJson("/api/v1/projects/{$project->id}")->assertNoContent();
        $this->assertSoftDeleted($project);
    }
}
