<?php

namespace Origo\Application\ApiV1\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Origo\Core\Project\Support\LocalizedText;

class StoreScreenRequest extends FormRequest
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
        return [
            ...LocalizedText::rules('name', required: true, max: 120),
            ...LocalizedText::rules('flow', required: false, max: 120),
            ...LocalizedText::rules('purpose', required: false, max: 1000),
            ...ScreenSourceRules::rules(),
        ];
    }
}
