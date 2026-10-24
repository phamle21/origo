<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Origo\Application\ApiV1\Http\Requests\LoginRequest;
use Origo\Application\ApiV1\Http\Resources\UserResource;

/**
 * Token login for the web app's server, which keeps the token in an httpOnly cookie; the browser never
 * sees it. Tokens expire after TOKEN_DAYS.
 */
class AuthController
{
    private const TOKEN_DAYS = 14;

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', mb_strtolower($request->string('email')->toString()))->first();

        // A deactivated account gets the same answer as a wrong password, so it reveals nothing.
        if (! $user || ! $user->is_active || ! Hash::check($request->string('password')->toString(), $user->password)) {
            throw ValidationException::withMessages(['email' => __('auth.failed')]);
        }

        $token = $user->createToken('origo-web', ['*'], now()->addDays(self::TOKEN_DAYS))->plainTextToken;

        return response()->json(['token' => $token, 'user' => (new UserResource($user))->resolve($request)]);
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->noContent();
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}
