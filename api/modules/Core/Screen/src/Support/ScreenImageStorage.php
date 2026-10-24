<?php

namespace Origo\Core\Screen\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Screenshots are re-encoded to WebP on the public disk. Re-encoding drops any metadata and anything
 * that is not pixel data, and the random file name keeps image URLs unguessable.
 */
class ScreenImageStorage
{
    private const DIRECTORY = 'screens';

    private const WEBP_QUALITY = 85;

    /**
     * @return array{path: string, width: int, height: int}
     */
    public function store(UploadedFile $file): array
    {
        return $this->storeContents((string) file_get_contents($file->getRealPath()));
    }

    /**
     * @return array{path: string, width: int, height: int}
     */
    public function storeContents(string $contents): array
    {
        $image = @imagecreatefromstring($contents);

        if ($image === false) {
            throw ValidationException::withMessages(['image' => 'The image could not be read.']);
        }

        imagepalettetotruecolor($image);
        imagealphablending($image, false);
        imagesavealpha($image, true);

        ob_start();
        imagewebp($image, null, self::WEBP_QUALITY);
        $webp = (string) ob_get_clean();

        $path = self::DIRECTORY.'/'.Str::lower((string) Str::ulid()).'.webp';
        Storage::disk('public')->put($path, $webp);

        return ['path' => $path, 'width' => imagesx($image), 'height' => imagesy($image)];
    }

    public function delete(?string $path): void
    {
        if ($path !== null && $path !== '') {
            Storage::disk('public')->delete($path);
        }
    }
}
