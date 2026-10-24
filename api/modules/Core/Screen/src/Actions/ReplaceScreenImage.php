<?php

namespace Origo\Core\Screen\Actions;

use Origo\Core\Screen\Models\Screen;
use Origo\Core\Screen\Support\ScreenImageFactory;
use Origo\Core\Screen\Support\ScreenImageStorage;
use Origo\Core\Screen\Support\ScreenSource;

/** Boxes are stored in percent, so points keep their place on a new screenshot of the same screen. */
class ReplaceScreenImage
{
    public function __construct(
        private readonly ScreenImageFactory $factory,
        private readonly ScreenImageStorage $images,
    ) {}

    public function handle(Screen $screen, ScreenSource $source): Screen
    {
        $previousImage = $screen->image_path;
        $previousSource = $screen->source_path;

        $screen->update($this->factory->create($source));

        $this->images->delete($previousImage);

        if ($previousSource !== $screen->source_path) {
            $this->factory->deleteSource($previousSource);
        }

        return $screen;
    }
}
