<?php

namespace Origo\Core\Screen\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Origo\Core\Project\Models\Project;
use Origo\Core\Screen\Models\Screen;

/**
 * @extends Factory<Screen>
 */
class ScreenFactory extends Factory
{
    protected $model = Screen::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'code' => sprintf('SC-%02d', fake()->unique()->numberBetween(1, 99)),
            'name' => ['vi' => fake()->words(2, true), 'ja' => null],
            'flow' => ['vi' => 'Luồng chính', 'ja' => null],
            'purpose' => ['vi' => fake()->sentence(), 'ja' => null],
            'image_path' => 'screens/test.webp',
            'image_width' => 1200,
            'image_height' => 760,
            'position' => 1,
        ];
    }
}
