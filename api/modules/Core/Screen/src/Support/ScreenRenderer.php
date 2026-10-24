<?php

namespace Origo\Core\Screen\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/** Client of origo-renderer. A page that cannot be captured is the author's input problem (422). */
class ScreenRenderer
{
    /**
     * @param  array<string, mixed>  $job  `kind`, `width` and either `url` or `entry` + `files`
     * @return string PNG bytes
     */
    public function render(array $job): string
    {
        // Opening a real page can take longer than PHP's default request limit.
        set_time_limit((int) config('services.renderer.timeout') + 15);

        $response = Http::baseUrl((string) config('services.renderer.url'))
            ->timeout((int) config('services.renderer.timeout'))
            ->acceptJson()
            ->post('/render', $job);

        if ($response->successful() && str_starts_with((string) $response->header('Content-Type'), 'image/png')) {
            return $response->body();
        }

        if (in_array($response->status(), [400, 413, 422, 429], true)) {
            $reason = $response->status() === 429 ? 'The screenshot service is busy, please try again in a moment.' : (string) ($response->json('error') ?? 'The page could not be captured.');

            throw ValidationException::withMessages(['source' => $reason]);
        }

        throw new RuntimeException("Renderer failed with status {$response->status()}");
    }
}
