<?php

namespace Origo\Core\Screen\Actions;

use Origo\Core\Screen\Models\Screen;
use Origo\Core\Screen\Support\ScreenImageFactory;
use Origo\Core\Screen\Support\ScreenImageStorage;

class DeleteScreen
{
    public function __construct(
        private readonly ScreenImageStorage $images,
        private readonly ScreenImageFactory $factory,
    ) {}

    public function handle(Screen $screen): void
    {
        $imagePath = $screen->image_path;
        $sourcePath = $screen->source_path;

        $screen->delete();
        $this->images->delete($imagePath);
        $this->factory->deleteSource($sourcePath);
    }
}
