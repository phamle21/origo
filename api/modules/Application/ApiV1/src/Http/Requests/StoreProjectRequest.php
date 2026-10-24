<?php

namespace Origo\Application\ApiV1\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Origo\Core\Project\Models\Project;
use Origo\Core\Project\Support\LocalizedText;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Project::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:16', 'regex:/^[A-Z][A-Z0-9]*$/', 'unique:projects,code'],
            ...LocalizedText::rules('name', required: true, max: 160),
            ...LocalizedText::rules('description', required: false, max: 5000),
            'managerId' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
