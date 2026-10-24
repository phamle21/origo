<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use App\Console\Commands\InstallCommand;
use App\Support\AlreadyInstalledException;
use App\Support\Installer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/**
 * The web install screen: open only until the first administrator exists. In production it also needs
 * the INSTALL_TOKEN secret; without one configured, only `php artisan origo:install` can install.
 */
class InstallController
{
    public function status(Installer $installer): JsonResponse
    {
        return response()->json(['data' => [
            'isInstalled' => $installer->isInstalled(),
            'isTokenRequired' => $this->isTokenRequired(),
            'isTokenConfigured' => filled(config('app.install_token')),
        ]]);
    }

    public function store(Request $request, Installer $installer): JsonResponse
    {
        abort_if($installer->isInstalled(), 409, 'Origo is already installed.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255', 'confirmed', Password::min(InstallCommand::PASSWORD_MIN_LENGTH)],
            'token' => ['nullable', 'string', 'max:255'],
        ]);

        if ($this->isTokenRequired()) {
            $expected = (string) config('app.install_token');

            abort_if($expected === '', 403, 'Set INSTALL_TOKEN on the server, or run php artisan origo:install.');

            if (! hash_equals($expected, (string) ($data['token'] ?? ''))) {
                throw ValidationException::withMessages(['token' => 'The install code is incorrect.']);
            }
        }

        try {
            $result = $installer->install(['name' => trim($data['name']), 'email' => $data['email'], 'password' => $data['password']]);
        } catch (AlreadyInstalledException) {
            abort(409, 'Origo is already installed.');
        }

        return response()->json(['data' => ['email' => $result['user']->email]], 201);
    }

    private function isTokenRequired(): bool
    {
        return app()->isProduction() || filled(config('app.install_token'));
    }
}
