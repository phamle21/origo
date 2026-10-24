<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;
use Origo\Core\Project\Models\Project;

abstract class TestCase extends BaseTestCase
{
    /** Signs in a new user who holds the given role (a project role key) in the project. */
    protected function actingAsProjectMember(Project $project, string $role = 'ba', array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $project->members()->create(['user_id' => $user->id, 'role' => $role]);

        return Sanctum::actingAs($user);
    }

    //
}
