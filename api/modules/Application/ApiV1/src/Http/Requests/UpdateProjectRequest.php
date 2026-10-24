<?php

namespace Origo\Application\ApiV1\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Origo\Core\Project\Support\ContentLanguages;
use Origo\Core\Project\Support\LocalizedText;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('project'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // The name may be left out of an update, but when it is sent it keeps its Vietnamese text.
        $name = LocalizedText::rules('name', required: true, max: 160);
        $name['name'] = ['sometimes', ...$name['name']];
        $name['name.'.ContentLanguages::DEFAULT] = ['required_with:name', 'string', 'max:160'];

        return [
            'code' => ['sometimes', 'string', 'max:16', 'regex:/^[A-Z][A-Z0-9]*$/', Rule::unique('projects', 'code')->ignore($this->route('project'))],
            ...$name,
            ...LocalizedText::rules('description', required: false, max: 5000),
        ];
    }
}
