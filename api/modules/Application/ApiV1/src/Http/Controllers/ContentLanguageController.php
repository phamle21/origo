<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Origo\Core\Project\Support\ContentLanguages;

/** Content languages: everyone reads the active ones (to show fields), admins manage the list. */
class ContentLanguageController
{
    public function index(ContentLanguages $languages): JsonResponse
    {
        return response()->json(['data' => array_values(array_filter($languages->all(), fn (array $language) => $language['isActive']))]);
    }

    public function all(ContentLanguages $languages): JsonResponse
    {
        Gate::authorize('manage-settings');

        return response()->json(['data' => $languages->all()]);
    }

    public function save(Request $request, ContentLanguages $languages): JsonResponse
    {
        Gate::authorize('manage-settings');

        $data = $request->validate([
            'languages' => ['required', 'array', 'min:1', 'max:20'],
            'languages.*.code' => ['required', 'string', 'distinct', 'regex:'.ContentLanguages::CODE_PATTERN],
            'languages.*.name' => ['required', 'string', 'max:60'],
            'languages.*.isActive' => ['required', 'boolean'],
        ]);

        $languages->save($data['languages']);

        return response()->json(['data' => $languages->all()]);
    }
}
