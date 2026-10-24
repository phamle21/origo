<?php

namespace Origo\Core\Screen\Actions;

use Origo\Core\Project\Support\LocalizedText;
use Origo\Core\Screen\Models\Screen;

class UpdateScreen
{
    /**
     * @param  array{name?: array<string, mixed>, flow?: array<string, mixed>|null, purpose?: array<string, mixed>|null}  $texts
     */
    public function handle(Screen $screen, array $texts): Screen
    {
        foreach (['name', 'flow', 'purpose'] as $field) {
            if (array_key_exists($field, $texts)) {
                $screen->{$field} = LocalizedText::normalize($texts[$field]);
            }
        }

        $screen->save();

        return $screen;
    }
}
