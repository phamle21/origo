<?php

namespace Origo\Application\ApiV1\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Every signed-in reader may comment; that is how Dev, QA and the customer give feedback. */
class StorePointCommentRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'text' => ['required', 'string', 'max:2000'],
            'mentionIds' => ['sometimes', 'array', 'max:20'],
            'mentionIds.*' => ['integer'],
        ];
    }
}
