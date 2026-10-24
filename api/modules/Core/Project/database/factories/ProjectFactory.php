<?php

namespace Origo\Core\Project\Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Origo\Core\Project\Models\Project;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->lexify('????')),
            'name' => ['vi' => fake()->words(3, true), 'ja' => null],
            'description' => ['vi' => fake()->sentence(), 'ja' => null],
            'owner_id' => User::factory(),
        ];
    }
}
