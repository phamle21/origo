<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Route;

// Public health check for monitoring and the load balancer. Software versions are only shown outside
// production, so the public endpoint never tells an attacker what to target.
Route::get('/health', function () {
    $checks = [
        'database' => rescue(fn () => DB::scalar('select 1') ? 'ok' : 'down', 'down', false),
        'redis' => rescue(fn () => Redis::connection()->ping() ? 'ok' : 'down', 'down', false),
    ];
    $isHealthy = ! in_array('down', $checks, true);

    return response()->json([
        'app' => config('app.name'),
        'version' => config('app.version'),
        'status' => $isHealthy ? 'ok' : 'degraded',
        ...$checks,
        ...(app()->isProduction() ? [] : ['laravel' => app()->version(), 'php' => PHP_VERSION]),
        'time' => now()->toIso8601String(),
    ], $isHealthy ? 200 : 503);
});
