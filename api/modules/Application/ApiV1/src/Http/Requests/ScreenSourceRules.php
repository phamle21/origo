<?php

namespace Origo\Application\ApiV1\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Origo\Core\Screen\Support\ScreenSource;

/**
 * A screen gets its screenshot from exactly one of: `image` (PNG, JPG or WebP), `html` (an .html file
 * or a .zip with its assets) or `url` (a public page). HTML and URL sources are captured at `width`.
 */
final class ScreenSourceRules
{
    public const MAX_UPLOAD_KILOBYTES = 10_240;

    /**
     * @return array<string, array<int, string>>
     */
    public static function rules(): array
    {
        return [
            'image' => ['nullable', 'required_without_all:html,url', 'prohibits:html,url', 'file', 'mimes:png,jpg,jpeg,webp', 'max:'.self::MAX_UPLOAD_KILOBYTES, 'dimensions:max_width=8000,max_height=8000'],
            'html' => ['nullable', 'prohibits:image,url', 'file', 'extensions:html,htm,zip', 'max:'.self::MAX_UPLOAD_KILOBYTES],
            'url' => ['nullable', 'prohibits:image,html', 'string', 'max:2048', 'url:http,https'],
            'width' => ['nullable', 'integer', 'in:'.implode(',', ScreenSource::WIDTHS)],
        ];
    }

    public static function toSource(FormRequest $request): ScreenSource
    {
        $width = $request->integer('width', ScreenSource::DEFAULT_WIDTH);

        return match (true) {
            $request->hasFile('html') => ScreenSource::html($request->file('html'), $width),
            $request->filled('url') => ScreenSource::url($request->string('url')->toString(), $width),
            default => ScreenSource::image($request->file('image')),
        };
    }
}
