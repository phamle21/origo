<?php

namespace Origo\Core\Screen\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Origo\Core\Screen\Models\Screen;
use Origo\Core\Screen\Models\ScreenPoint;

/**
 * @extends Factory<ScreenPoint>
 */
class ScreenPointFactory extends Factory
{
    protected $model = ScreenPoint::class;

    public function definition(): array
    {
        return [
            'screen_id' => Screen::factory(),
            'number' => 1,
            'box' => [10, 10, 20, 10],
            'title' => ['vi' => fake()->words(3, true), 'ja' => null],
            'basic' => ['summary' => ['vi' => fake()->sentence(), 'ja' => null], 'rules' => []],
            'detail' => ['rows' => [], 'endpoints' => []],
            'tests' => [],
            'history' => [],
        ];
    }
}
