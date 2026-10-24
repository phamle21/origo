<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Origo\Core\Project\Models\Project;
use Tests\TestCase;

class ProjectMemberApiTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->project = Project::factory()->create(['code' => 'LMS']);
    }

    public function test_a_manager_adds_changes_and_removes_members(): void
    {
        $this->actingAsProjectMember($this->project, 'manager');
        $newcomer = User::factory()->create(['name' => 'Thảo']);

        $memberId = $this->postJson('/api/v1/projects/LMS/members', ['userId' => $newcomer->id, 'role' => 'qa'])
            ->assertCreated()
            ->assertJsonPath('data.user.name', 'Thảo')
            ->json('data.id');

        $this->patchJson("/api/v1/projects/LMS/members/{$memberId}", ['role' => 'dev'])->assertOk()->assertJsonPath('data.role', 'dev');
        $this->getJson('/api/v1/projects/LMS/members')->assertOk()->assertJsonCount(2, 'data');
        $this->deleteJson("/api/v1/projects/LMS/members/{$memberId}")->assertNoContent();

        $this->assertNull($this->project->roleOf($newcomer));
    }

    public function test_someone_already_in_the_project_or_deactivated_cannot_be_added(): void
    {
        $manager = $this->actingAsProjectMember($this->project, 'manager');

        $this->postJson('/api/v1/projects/LMS/members', ['userId' => $manager->id, 'role' => 'qa'])->assertUnprocessable()->assertJsonValidationErrors('userId');
        $this->postJson('/api/v1/projects/LMS/members', ['userId' => User::factory()->inactive()->create()->id, 'role' => 'qa'])->assertUnprocessable();
    }

    public function test_the_last_manager_can_be_neither_demoted_nor_removed(): void
    {
        $this->actingAsProjectMember($this->project, 'manager');
        $memberId = $this->project->members()->firstOrFail()->id;

        $this->patchJson("/api/v1/projects/LMS/members/{$memberId}", ['role' => 'ba'])->assertUnprocessable()->assertJsonValidationErrors('role');
        $this->deleteJson("/api/v1/projects/LMS/members/{$memberId}")->assertUnprocessable();
    }

    public function test_only_managers_and_admins_manage_members(): void
    {
        $this->actingAsProjectMember($this->project, 'ba');
        $this->getJson('/api/v1/projects/LMS/members')->assertOk();
        $this->postJson('/api/v1/projects/LMS/members', ['userId' => User::factory()->create()->id, 'role' => 'qa'])->assertForbidden();
    }

    public function test_people_can_be_looked_up_by_name_or_email(): void
    {
        $this->actingAsProjectMember($this->project, 'manager');
        User::factory()->create(['name' => 'Nguyễn Thảo', 'email' => 'thao@origo.local']);
        User::factory()->inactive()->create(['name' => 'Thảo cũ']);

        $this->getJson('/api/v1/users/lookup?q=thảo')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.email', 'thao@origo.local');
        $this->getJson('/api/v1/users/lookup?q=t')->assertOk()->assertJsonCount(0, 'data');
    }
}
