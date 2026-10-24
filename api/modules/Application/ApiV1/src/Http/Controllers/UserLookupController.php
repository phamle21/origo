<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Origo\Application\ApiV1\Http\Resources\UserResource;

/** Finds active people by name or email, e.g. to add them to a project. */
class UserLookupController
{
    private const MAX_RESULTS = 20;

    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $query = trim($request->string('q')->toString());

        if (mb_strlen($query) < 2) {
            return UserResource::collection([]);
        }

        $pattern = '%'.mb_strtolower(addcslashes($query, '%_\\')).'%';

        return UserResource::collection(User::query()
            ->where('is_active', true)
            ->where(fn ($builder) => $builder->whereRaw('lower(name) like ?', [$pattern])->orWhereRaw('lower(email) like ?', [$pattern]))
            ->orderBy('name')
            ->limit(self::MAX_RESULTS)
            ->get());
    }
}
