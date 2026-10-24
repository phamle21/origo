<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rules\Password;
use Laravel\Sanctum\PersonalAccessToken;
use Origo\Application\ApiV1\Http\Resources\UserResource;
use Origo\Core\Account\Actions\ChangeOwnPassword;

/** The signed-in person's own profile. Email, job title and rights stay with the admin. */
class ProfileController
{
    public function update(Request $request): UserResource
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:120']]);

        $request->user()->update(['name' => trim($data['name'])]);

        return new UserResource($request->user()->refresh());
    }

    public function password(Request $request, ChangeOwnPassword $changePassword): Response
    {
        $data = $request->validate([
            'currentPassword' => ['required', 'string', 'current_password'],
            'password' => ['required', 'string', 'confirmed', 'different:currentPassword', Password::min(10)],
        ]);

        $token = $request->user()->currentAccessToken();
        $changePassword->handle($request->user(), $data['password'], $token instanceof PersonalAccessToken ? $token->id : null);

        return response()->noContent();
    }
}
