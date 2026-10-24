<?php

namespace Origo\Application\ApiV1\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Origo\Core\Project\Support\LocalizedText;

class SyncScreenPointsRequest extends FormRequest
{
    public const MAX_POINTS = 60;

    /** Smallest box, in percent, that is still visible and clickable on a typical screenshot. */
    private const MIN_BOX_SIZE = 0.5;

    public function authorize(): bool
    {
        return Gate::allows('editDesign', $this->route('project'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $screen = $this->route('screen');

        return [
            'points' => ['present', 'array', 'max:'.self::MAX_POINTS],
            'points.*.id' => ['nullable', 'string', Rule::exists('screen_points', 'id')->where('screen_id', $screen->id)],
            'points.*.box' => ['required', 'array', 'size:4'],
            'points.*.box.*' => ['required', 'numeric', 'between:0,100'],
            ...LocalizedText::rules('points.*.title', required: true, max: 200),
            ...LocalizedText::rules('points.*.basic.summary', required: false, max: 2000),
            'points.*.basic.rules' => ['array', 'max:30'],
            ...LocalizedText::rules('points.*.basic.rules.*', required: true, max: 1000),
            'points.*.detail.rows' => ['array', 'max:50'],
            ...LocalizedText::rules('points.*.detail.rows.*.item', required: true, max: 200),
            ...LocalizedText::rules('points.*.detail.rows.*.spec', required: false, max: 2000),
            'points.*.detail.endpoints' => ['array', 'max:20'],
            'points.*.detail.endpoints.*' => ['string', 'max:200'],
            'points.*.tests' => ['array', 'max:50'],
            ...LocalizedText::rules('points.*.tests.*.given', required: true, max: 1000),
            ...LocalizedText::rules('points.*.tests.*.when', required: true, max: 1000),
            ...LocalizedText::rules('points.*.tests.*.then', required: true, max: 1000),
            'points.*.history' => ['array', 'max:30'],
            'points.*.history.*.phase' => ['required', 'string', 'max:40'],
            ...LocalizedText::rules('points.*.history.*.note', required: true, max: 1000),
            'points.*.concepts' => ['array', 'max:20'],
            'points.*.concepts.*' => ['string', Rule::exists('concepts', 'key')->where('project_id', $screen->project_id)],
            'points.*.dependsOn' => ['array', 'max:30'],
            'points.*.dependsOn.*' => ['string', 'exists:screen_points,id'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                foreach ($this->input('points', []) as $index => $point) {
                    [$left, $top, $width, $height] = array_map('floatval', array_pad((array) ($point['box'] ?? []), 4, 0));

                    if ($width < self::MIN_BOX_SIZE || $height < self::MIN_BOX_SIZE || $left + $width > 100.01 || $top + $height > 100.01) {
                        $validator->errors()->add("points.{$index}.box", 'The box must lie inside the image.');
                    }
                }
            },
        ];
    }
}
