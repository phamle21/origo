<?php

namespace Origo\Core\Screen\Support;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Produces the stored screenshot for a source. HTML uploads are kept on the private disk so the screen
 * can be captured again; URL sources only need the address.
 */
class ScreenImageFactory
{
    private const SOURCE_DIRECTORY = 'screen-sources';

    public function __construct(
        private readonly ScreenImageStorage $images,
        private readonly ScreenRenderer $renderer,
        private readonly HtmlPackage $packages,
    ) {}

    /**
     * @return array{image_path: string, image_width: int, image_height: int, source_type: string, source_url: string|null, source_path: string|null, render_width: int|null}
     */
    public function create(ScreenSource $source): array
    {
        return match ($source->kind) {
            ScreenSource::KIND_HTML => $this->fromHtml($source),
            ScreenSource::KIND_URL => $this->fromUrl((string) $source->url, (int) $source->width),
            default => $this->fromImage($source),
        };
    }

    /**
     * Captures again from what was stored; null when the screen has no renderable source.
     *
     * @return array{image_path: string, image_width: int, image_height: int}|null
     */
    public function recapture(string $sourceType, ?string $sourceUrl, ?string $sourcePath, ?int $width): ?array
    {
        $width ??= ScreenSource::DEFAULT_WIDTH;

        if ($sourceType === ScreenSource::KIND_URL && $sourceUrl) {
            return $this->toImageColumns($this->renderer->render(['kind' => 'url', 'url' => $sourceUrl, 'width' => $width]));
        }

        if ($sourceType === ScreenSource::KIND_HTML && $sourcePath && Storage::disk('local')->exists($sourcePath)) {
            $package = $this->packages->fromPath(Storage::disk('local')->path($sourcePath), $sourcePath);

            return $this->toImageColumns($this->renderer->render(['kind' => 'html', 'width' => $width, ...$package]));
        }

        return null;
    }

    public function deleteSource(?string $sourcePath): void
    {
        if ($sourcePath) {
            Storage::disk('local')->delete($sourcePath);
        }
    }

    private function fromImage(ScreenSource $source): array
    {
        $stored = $this->images->store($source->file);

        return [...$this->imageColumns($stored), 'source_type' => ScreenSource::KIND_IMAGE, 'source_url' => null, 'source_path' => null, 'render_width' => null];
    }

    private function fromHtml(ScreenSource $source): array
    {
        $file = $source->file;
        $package = $this->packages->fromPath($file->getRealPath(), $file->getClientOriginalName());
        $columns = $this->toImageColumns($this->renderer->render(['kind' => 'html', 'width' => $source->width, ...$package]));

        $extension = str_ends_with(strtolower($file->getClientOriginalName()), '.zip') ? 'zip' : 'html';
        $sourcePath = self::SOURCE_DIRECTORY.'/'.Str::lower((string) Str::ulid()).'.'.$extension;
        Storage::disk('local')->put($sourcePath, (string) file_get_contents($file->getRealPath()));

        return [...$columns, 'source_type' => ScreenSource::KIND_HTML, 'source_url' => null, 'source_path' => $sourcePath, 'render_width' => $source->width];
    }

    private function fromUrl(string $url, int $width): array
    {
        $columns = $this->toImageColumns($this->renderer->render(['kind' => 'url', 'url' => $url, 'width' => $width]));

        return [...$columns, 'source_type' => ScreenSource::KIND_URL, 'source_url' => $url, 'source_path' => null, 'render_width' => $width];
    }

    /**
     * @return array{image_path: string, image_width: int, image_height: int}
     */
    private function toImageColumns(string $png): array
    {
        return $this->imageColumns($this->images->storeContents($png));
    }

    /**
     * @param  array{path: string, width: int, height: int}  $stored
     * @return array{image_path: string, image_width: int, image_height: int}
     */
    private function imageColumns(array $stored): array
    {
        return ['image_path' => $stored['path'], 'image_width' => $stored['width'], 'image_height' => $stored['height']];
    }
}
