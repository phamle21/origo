<?php

namespace Origo\Application\ApiV1\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** A deactivated account is refused even with a token issued before it was deactivated. */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && ! $user->is_active) {
            $user->currentAccessToken()?->delete();
            abort(401, 'This account is deactivated.');
        }

        return $next($request);
    }
}
