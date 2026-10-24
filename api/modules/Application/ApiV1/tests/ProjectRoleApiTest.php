<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Models\ProjectRole;
use Origo\Core\Project\Support\ProjectRoles;
use Tests\TestCase;

class ProjectRoleApiTest extends TestCase
{
    use RefreshDatabase;

    private function roleId(string $key): string
    {
        return ProjectRole::query()->where('key', $key)->value('id');
    }

    public function test_the_seeded_roles_are_listed_for_anyone_signed_in(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/project-roles')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('data.0.key', 'manager')
            ->assertJsonPath('data.0.permissions', ['project.read', 'plan.edit', 'design.edit', 'members.manage', 'project.edit']);
        $this->getJson('/api/v1/permissions/project')->assertOk()->assertJsonCount(5, 'data')->assertJsonPath('data.0.key', 'project.read');
        $this->getJson('/api/v1/permissions/system')->assertForbidden();
        $this->postJson('/api/v1/admin/project-roles', ['name' => ['vi' => 'X'], 'permissions' => []])->assertForbidden();
    }

    public function test_an_admin_creates_a_role_whose_permissions_apply_at_once_and_imply_reading(): void
    {
        $project = Project::factory()->create(['code' => 'LMS']);
        $member = $this->actingAsProjectMember($project, 'qa');
        $this->getJson('/api/v1/projects/LMS/plan')->assertJsonPath('data.canEdit', false);

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->postJson('/api/v1/admin/project-roles', ['name' => ['vi' => 'Tech lead'], 'permissions' => ['plan.edit', 'nope']])->assertUnprocessable();
        $this->postJson('/api/v1/admin/project-roles', ['name' => ['vi' => 'Tech lead'], 'permissions' => ['plan.edit']])
            ->assertCreated()
            ->assertJsonPath('data.key', 'tech-lead')
            ->assertJsonPath('data.permissions', ['project.read', 'plan.edit']);

        $memberId = $project->members()->where('user_id', $member->id)->value('id');
        $this->actingAsProjectMember($project, 'manager');
        $this->patchJson("/api/v1/projects/LMS/members/{$memberId}", ['role' => 'tech-lead'])->assertOk()->assertJsonPath('data.role', 'tech-lead');

        Sanctum::actingAs($member);
        $this->getJson('/api/v1/projects/LMS/plan')->assertJsonPath('data.canEdit', true);
        $this->getJson('/api/v1/projects')->assertJsonPath('data.0.myRole', 'tech-lead');
    }

    public function test_a_role_without_read_hides_the_project(): void
    {
        $project = Project::factory()->create(['code' => 'LMS']);
        $customer = $this->actingAsProjectMember($project, 'customer');
        $this->getJson('/api/v1/projects')->assertJsonCount(1, 'data');

        Sanctum::actingAs(User::factory()->admin()->create());
        $this->patchJson('/api/v1/admin/project-roles/'.$this->roleId('customer'), ['name' => ['vi' => 'Khách'], 'permissions' => []])->assertOk();

        Sanctum::actingAs($customer);
        $this->getJson('/api/v1/projects')->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/projects/LMS/map')->assertForbidden();
    }

    public function test_projects_never_lose_their_last_member_manager_and_used_roles_stay(): void
    {
        $project = Project::factory()->create(['code' => 'LMS']);
        $this->actingAsProjectMember($project, 'manager');
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->patchJson('/api/v1/admin/project-roles/'.$this->roleId('manager'), ['name' => ['vi' => 'PM'], 'permissions' => ['plan.edit']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('permissions');
        $this->deleteJson('/api/v1/admin/project-roles/'.$this->roleId('manager'))->assertUnprocessable();

        $this->deleteJson('/api/v1/admin/project-roles/'.$this->roleId('qa'))->assertNoContent();
        $this->getJson('/api/v1/project-roles')->assertJsonCount(4, 'data');
    }

    public function test_new_projects_need_a_role_that_can_manage_members(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $this->postJson('/api/v1/projects', ['code' => 'NEW', 'name' => ['vi' => 'Mới'], 'description' => ['vi' => null]])->assertCreated();
        $this->getJson('/api/v1/projects/NEW/members')->assertJsonPath('data.0.role', 'manager');

        ProjectRole::query()->whereKeyNot($this->roleId('manager'))->delete();
        ProjectRole::query()->whereKey($this->roleId('manager'))->update(['permissions' => json_encode(['project.read'])]);
        app(ProjectRoles::class)->forget();
        $this->postJson('/api/v1/projects', ['code' => 'OTHER', 'name' => ['vi' => 'Khác'], 'description' => ['vi' => null]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('managerId');
    }

    public function test_an_admin_renames_and_regroups_a_permission_but_cannot_add_one(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());
        $id = $this->getJson('/api/v1/permissions/project')->json('data.1.id');

        $this->patchJson("/api/v1/admin/permissions/project/{$id}", ['name' => ['vi' => 'Lên kế hoạch'], 'group' => 'design', 'position' => 9])
            ->assertOk()
            ->assertJsonPath('data.name.vi', 'Lên kế hoạch')
            ->assertJsonPath('data.key', 'plan.edit');
        $this->patchJson("/api/v1/admin/permissions/project/{$id}", ['name' => ['vi' => 'X'], 'group' => 'people', 'position' => 1])->assertUnprocessable();
        $this->patchJson("/api/v1/admin/permissions/system/{$id}", ['name' => ['vi' => 'X'], 'group' => 'people', 'position' => 1])->assertNotFound();
        $this->getJson('/api/v1/permissions/project')->assertJsonPath('data.4.key', 'plan.edit');
    }
}
