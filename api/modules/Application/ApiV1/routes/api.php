<?php

use Illuminate\Support\Facades\Route;
use Origo\Application\ApiV1\Http\Controllers\AdminUserController;
use Origo\Application\ApiV1\Http\Controllers\AuthController;
use Origo\Application\ApiV1\Http\Controllers\ConceptController;
use Origo\Application\ApiV1\Http\Controllers\ContentLanguageController;
use Origo\Application\ApiV1\Http\Controllers\InstallController;
use Origo\Application\ApiV1\Http\Controllers\NotificationController;
use Origo\Application\ApiV1\Http\Controllers\PermissionController;
use Origo\Application\ApiV1\Http\Controllers\PlanController;
use Origo\Application\ApiV1\Http\Controllers\PointCommentController;
use Origo\Application\ApiV1\Http\Controllers\ProfileController;
use Origo\Application\ApiV1\Http\Controllers\ProjectController;
use Origo\Application\ApiV1\Http\Controllers\ProjectFeatureController;
use Origo\Application\ApiV1\Http\Controllers\ProjectMapController;
use Origo\Application\ApiV1\Http\Controllers\ProjectMemberController;
use Origo\Application\ApiV1\Http\Controllers\ProjectRoleController;
use Origo\Application\ApiV1\Http\Controllers\ScreenController;
use Origo\Application\ApiV1\Http\Controllers\SettingsController;
use Origo\Application\ApiV1\Http\Controllers\SystemRoleController;
use Origo\Application\ApiV1\Http\Controllers\UserLookupController;
use Origo\Application\ApiV1\Http\Middleware\EnsureUserIsActive;

// First-run install screen; both answer only while no administrator exists.
Route::get('install', [InstallController::class, 'status'])
    ->withoutMiddleware(['auth:sanctum', EnsureUserIsActive::class])
    ->middleware('throttle:60,1')
    ->name('install.status');
Route::post('install', [InstallController::class, 'store'])
    ->withoutMiddleware(['auth:sanctum', EnsureUserIsActive::class])
    ->middleware('throttle:6,1')
    ->name('install.store');

Route::post('auth/login', [AuthController::class, 'login'])
    ->withoutMiddleware(['auth:sanctum', EnsureUserIsActive::class])
    ->middleware('throttle:6,1')
    ->name('auth.login');
Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
Route::get('me', [AuthController::class, 'me'])->name('me');
Route::patch('me', [ProfileController::class, 'update'])->name('me.update');
Route::put('me/password', [ProfileController::class, 'password'])->middleware('throttle:6,1')->name('me.password');
Route::get('users/lookup', UserLookupController::class)->name('users.lookup');
Route::get('content-languages', [ContentLanguageController::class, 'index'])->name('content-languages.index');
Route::get('project-roles', [ProjectRoleController::class, 'index'])->name('project-roles.index');
Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
Route::post('notifications/read', [NotificationController::class, 'markRead'])->name('notifications.read');
Route::get('permissions/{scope}', [PermissionController::class, 'index'])->whereIn('scope', ['system', 'project'])->name('permissions.index');

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('settings/stage-template', [SettingsController::class, 'stageTemplate'])->name('settings.stage-template');
    Route::get('settings/content-languages', [ContentLanguageController::class, 'all'])->name('settings.content-languages');
    Route::put('settings/content-languages', [ContentLanguageController::class, 'save'])->name('settings.content-languages.save');
    Route::post('project-roles', [ProjectRoleController::class, 'store'])->name('project-roles.store');
    Route::patch('project-roles/{role}', [ProjectRoleController::class, 'update'])->name('project-roles.update');
    Route::delete('project-roles/{role}', [ProjectRoleController::class, 'destroy'])->name('project-roles.destroy');
    Route::patch('permissions/{scope}/{permission}', [PermissionController::class, 'update'])->whereIn('scope', ['system', 'project'])->name('permissions.update');
    Route::get('system-roles', [SystemRoleController::class, 'index'])->name('system-roles.index');
    Route::post('system-roles', [SystemRoleController::class, 'store'])->name('system-roles.store');
    Route::patch('system-roles/{role}', [SystemRoleController::class, 'update'])->name('system-roles.update');
    Route::delete('system-roles/{role}', [SystemRoleController::class, 'destroy'])->name('system-roles.destroy');
    Route::put('settings/stage-template', [SettingsController::class, 'saveStageTemplate'])->name('settings.stage-template.save');
    Route::get('users', [AdminUserController::class, 'index'])->name('users.index');
    Route::post('users', [AdminUserController::class, 'store'])->name('users.store');
    Route::get('users/{user}', [AdminUserController::class, 'show'])->name('users.show');
    Route::patch('users/{user}', [AdminUserController::class, 'update'])->name('users.update');
    Route::post('users/{user}/reset-password', [AdminUserController::class, 'resetPassword'])->name('users.reset-password');
    Route::get('users/{user}/projects', [AdminUserController::class, 'projects'])->name('users.projects');
});

Route::apiResource('projects', ProjectController::class);
Route::get('projects/{project}/features', ProjectFeatureController::class)->name('projects.features');

// The screen map addresses projects and screens by their codes, as the web app's URLs do.
Route::scopeBindings()->prefix('projects/{project:code}')->name('projects.')->group(function () {
    Route::get('map', ProjectMapController::class)->name('map');
    Route::patch('details', [ProjectController::class, 'update'])->name('details.update');
    Route::post('archive', [ProjectController::class, 'archive'])->name('archive');
    Route::post('unarchive', [ProjectController::class, 'unarchive'])->name('unarchive');
    Route::delete('forever', [ProjectController::class, 'destroyForever'])->name('destroy-forever');
    Route::get('members', [ProjectMemberController::class, 'index'])->name('members.index');
    Route::post('members', [ProjectMemberController::class, 'store'])->name('members.store');
    Route::patch('members/{member}', [ProjectMemberController::class, 'update'])->name('members.update');
    Route::delete('members/{member}', [ProjectMemberController::class, 'destroy'])->name('members.destroy');
    Route::post('concepts', [ConceptController::class, 'store'])->name('concepts.store');
    Route::post('screens', [ScreenController::class, 'store'])->name('screens.store');
    Route::patch('screens/{screen:code}', [ScreenController::class, 'update'])->name('screens.update');
    Route::delete('screens/{screen:code}', [ScreenController::class, 'destroy'])->name('screens.destroy');
    Route::post('screens/{screen:code}/image', [ScreenController::class, 'replaceImage'])->name('screens.image');
    Route::post('screens/{screen:code}/recapture', [ScreenController::class, 'recapture'])->name('screens.recapture');
    Route::put('screens/{screen:code}/points', [ScreenController::class, 'syncPoints'])->name('screens.points');
});

// Plan items and stages are checked against the project in the controller; Laravel cannot scope a stage
// to an item, which it would try to do for the task routes.
Route::prefix('projects/{project:code}/plan')->name('projects.plan.')->group(function () {
    Route::get('/', [PlanController::class, 'show'])->name('show');
    Route::put('stages', [PlanController::class, 'syncStages'])->name('stages');
    Route::post('items', [PlanController::class, 'storeItem'])->name('items.store');
    Route::patch('items/{item}', [PlanController::class, 'updateItem'])->name('items.update');
    Route::delete('items/{item}', [PlanController::class, 'destroyItem'])->name('items.destroy');
    Route::put('items/{item}/screens', [PlanController::class, 'linkScreens'])->name('items.screens');
    Route::put('items/{item}/tasks/{stage}', [PlanController::class, 'saveTask'])->name('tasks.save');
    Route::delete('items/{item}/tasks/{stage}', [PlanController::class, 'destroyTask'])->name('tasks.destroy');
});

Route::post('points/{point}/comments', [PointCommentController::class, 'store'])->name('points.comments.store');
