<?php

use Illuminate\Support\Facades\Route;

// The API has no pages; its root only says what it is, for anyone who opens the address.
Route::get('/', fn () => response()->json(['app' => config('app.name'), 'version' => config('app.version'), 'health' => url('/api/health')]));
