<?php

namespace Origo\Application\ApiV1;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Origo\Application\ApiV1\Http\Middleware\EnsureUserIsActive;

class ApiV1ServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::prefix('api/v1')
            ->middleware(['api', 'auth:sanctum', EnsureUserIsActive::class])
            ->name('api.v1.')
            ->group(__DIR__.'/../routes/api.php');
    }
}
