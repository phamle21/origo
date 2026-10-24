<?php

namespace Origo\Application\ApiV1\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

/** Replaces the screenshot from any source; the points keep their places. */
class ReplaceScreenImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('editDesign', $this->route('project'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return ScreenSourceRules::rules();
    }
}
