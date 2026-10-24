<?php

namespace Origo\Core\Screen\Support;

use Illuminate\Validation\ValidationException;
use ZipArchive;

/**
 * Turns an uploaded page into the files the renderer needs: a single .html file, or a .zip with an
 * index.html (or exactly one .html at its root) plus its CSS, images and scripts. Archive limits stop
 * zip bombs, and paths that could leave the archive folder are rejected.
 */
class HtmlPackage
{
    public const MAX_FILES = 300;

    public const MAX_UNCOMPRESSED_BYTES = 30 * 1_024 * 1_024;

    /**
     * @return array{entry: string, files: array<string, string>} file contents are base64 encoded
     */
    public function fromPath(string $path, string $originalName): array
    {
        if (str_ends_with(strtolower($originalName), '.zip')) {
            return $this->fromZip($path);
        }

        return ['entry' => 'index.html', 'files' => ['index.html' => base64_encode((string) file_get_contents($path))]];
    }

    /**
     * @return array{entry: string, files: array<string, string>}
     */
    private function fromZip(string $path): array
    {
        $zip = new ZipArchive;

        if ($zip->open($path, ZipArchive::RDONLY) !== true) {
            $this->fail('The zip file could not be opened.');
        }

        try {
            if ($zip->numFiles > self::MAX_FILES) {
                $this->fail('The zip file holds too many files.');
            }

            $files = [];
            $total = 0;

            for ($index = 0; $index < $zip->numFiles; $index++) {
                $stat = $zip->statIndex($index);
                $name = (string) ($stat['name'] ?? '');

                if ($name === '' || str_ends_with($name, '/') || str_starts_with($name, '__MACOSX/')) {
                    continue;
                }

                if (! $this->isSafePath($name)) {
                    $this->fail('The zip file contains an unsafe path.');
                }

                $total += (int) ($stat['size'] ?? 0);

                if ($total > self::MAX_UNCOMPRESSED_BYTES) {
                    $this->fail('The zip file is too large once extracted.');
                }

                $files[$name] = base64_encode((string) $zip->getFromIndex($index));
            }
        } finally {
            $zip->close();
        }

        return ['entry' => $this->findEntry(array_keys($files)), 'files' => $files];
    }

    /**
     * @param  array<int, string>  $names
     */
    private function findEntry(array $names): string
    {
        if (in_array('index.html', $names, true)) {
            return 'index.html';
        }

        $rootPages = array_values(array_filter($names, fn (string $name) => ! str_contains($name, '/') && preg_match('/\.html?$/i', $name)));

        if (count($rootPages) === 1) {
            return $rootPages[0];
        }

        $this->fail('The zip file needs an index.html, or exactly one .html file, at its root.');
    }

    private function isSafePath(string $name): bool
    {
        if (str_contains($name, '\\') || str_contains($name, "\0") || str_starts_with($name, '/')) {
            return false;
        }

        return ! in_array('..', explode('/', $name), true);
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['html' => $message]);
    }
}
