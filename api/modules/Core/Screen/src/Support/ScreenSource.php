<?php

namespace Origo\Core\Screen\Support;

use Illuminate\Http\UploadedFile;

/**
 * Where a screenshot comes from: an image file, an uploaded HTML page (single file or zip), or a
 * public URL. HTML and URL sources are rendered by origo-renderer at one of the supported widths.
 */
final readonly class ScreenSource
{
    public const KIND_IMAGE = 'image';

    public const KIND_HTML = 'html';

    public const KIND_URL = 'url';

    public const WIDTHS = [390, 1024, 1440];

    public const DEFAULT_WIDTH = 1440;

    private function __construct(
        public string $kind,
        public ?UploadedFile $file = null,
        public ?string $url = null,
        public ?int $width = null,
    ) {}

    public static function image(UploadedFile $file): self
    {
        return new self(self::KIND_IMAGE, file: $file);
    }

    public static function html(UploadedFile $file, int $width): self
    {
        return new self(self::KIND_HTML, file: $file, width: $width);
    }

    public static function url(string $url, int $width): self
    {
        return new self(self::KIND_URL, url: $url, width: $width);
    }
}
