<?php

namespace Origo\Core\Project\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Origo\Core\Project\Actions\CreateProject;
use Tests\TestCase;

class CreateProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_project_owned_by_the_given_user(): void
    {
        $owner = User::factory()->create();

        $project = app(CreateProject::class)->handle($owner, [
            'code' => 'LMS',
            'name' => ['vi' => 'Cổng học trực tuyến', 'ja' => null],
        ]);

        $this->assertSame($owner->id, $project->owner_id);
        $this->assertDatabaseHas('projects', ['code' => 'LMS']);
        $this->assertSame(26, strlen($project->id));
    }
}
