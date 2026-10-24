<?php

namespace Origo\Core\Screen\Actions;

use Illuminate\Validation\ValidationException;
use Origo\Core\Screen\Models\Screen;
use Origo\Core\Screen\Support\ScreenImageFactory;
use Origo\Core\Screen\Support\ScreenImageStorage;

/** Captures a screen made from HTML or a URL again, e.g. after the page changed; points stay as they are. */
class RecaptureScreen
{
    public function __construct(
        private readonly ScreenImageFactory $factory,
        private readonly ScreenImageStorage $images,
    ) {}

    public function handle(Screen $screen): Screen
    {
        $columns = $this->factory->recapture($screen->source_type, $screen->source_url, $screen->source_path, $screen->render_width);

        if ($columns === null) {
            throw ValidationException::withMessages(['source' => 'This screen was made from an image and cannot be captured again.']);
        }

        $previousImage = $screen->image_path;
        $screen->update($columns);
        $this->images->delete($previousImage);

        return $screen;
    }
}
