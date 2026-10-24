<?php

namespace Origo\Application\ApiV1\Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Origo\Core\Project\Models\Project;
use Tests\TestCase;

class ProjectDetailsApiTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->project = Project::factory()->create(['code' => 'LMS', 'name' => ['vi' => 'Cổng học', 'ja' => 'ポータル']]);
    }

    public function test_a_manager_edits_the_name_and_description_by_project_code(): void
    {
        $this->actingAsProjectMember($this->project, 'manager');

        $this->patchJson('/api/v1/projects/LMS/details', [
            'name' => ['vi' => '  Cổng học trực tuyến ', 'ja' => 'オンライン学習'],
            'description' => ['vi' => 'Bán khóa học', 'ja' => ''],
        ])
            ->assertOk()
            ->assertJsonPath('data.code', 'LMS')
            ->assertJsonPath('data.name.vi', 'Cổng học trực tuyến')
            ->assertJsonPath('data.description.ja', null)
            ->assertJsonPath('data.permissions.canEditProject', true);
    }

    public function test_the_vietnamese_name_stays_required(): void
    {
        $this->actingAsProjectMember($this->project, 'manager');

        $this->patchJson('/api/v1/projects/LMS/details', ['name' => ['vi' => '', 'ja' => 'x']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name.vi');
        $this->assertSame('Cổng học', $this->project->fresh()->name['vi']);
    }

    public function test_other_roles_cannot_edit_the_project(): void
    {
        $this->actingAsProjectMember($this->project, 'ba');

        $this->patchJson('/api/v1/projects/LMS/details', ['name' => ['vi' => 'Đổi']])->assertForbidden();
    }
}
