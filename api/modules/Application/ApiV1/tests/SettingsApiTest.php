<?php

namespace Origo\Application\ApiV1\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Origo\Core\Project\Models\Project;
use Tests\TestCase;

class SettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_projects_start_from_the_stage_list_an_admin_saved(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/v1/admin/settings/stage-template')->assertOk()->assertJsonCount(6, 'data')->assertJsonPath('data.0.key', 'basic-design');

        $this->putJson('/api/v1/admin/settings/stage-template', ['stages' => [
            ['name' => ['vi' => 'Phân tích', 'ja' => '分析'], 'color' => '#7C3AED'],
            ['name' => ['vi' => 'Phân tích', 'ja' => null], 'color' => '#0f766e'],
        ]])->assertNoContent();

        $this->getJson('/api/v1/admin/settings/stage-template')
            ->assertJsonPath('data.0.key', 'phan-tich')
            ->assertJsonPath('data.1.key', 'phan-tich-2')
            ->assertJsonPath('data.0.color', '#7c3aed');

        $project = Project::factory()->create(['code' => 'NEW']);
        $this->getJson('/api/v1/projects/NEW/plan')->assertOk()->assertJsonCount(2, 'data.stages');
        $this->assertSame(2, $project->planStages()->count());
    }

    public function test_only_admins_see_or_change_settings(): void
    {
        $project = Project::factory()->create();
        $this->actingAsProjectMember($project, 'manager');

        $this->getJson('/api/v1/admin/settings/stage-template')->assertForbidden();
        $this->putJson('/api/v1/admin/settings/stage-template', ['stages' => [['name' => ['vi' => 'X'], 'color' => '#000000']]])->assertForbidden();
    }
}
