<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Origo\Core\Plan\Models\WorkCalendarDay;
use Origo\Core\Plan\Support\WorkCalendar;

/** Public holidays and make-up working days: everyone reads them, admins edit them. */
class WorkCalendarController
{
    public function index(WorkCalendar $calendar): JsonResponse
    {
        return response()->json(['data' => $calendar->all()]);
    }

    public function save(Request $request, WorkCalendar $calendar): Response
    {
        Gate::authorize('manage-settings');

        $data = $request->validate([
            'days' => ['present', 'array', 'max:1000'],
            'days.*.date' => ['required', 'date_format:Y-m-d', 'distinct'],
            'days.*.kind' => ['required', Rule::in([WorkCalendarDay::HOLIDAY, WorkCalendarDay::WORKDAY])],
            'days.*.name' => ['nullable', 'string', 'max:80'],
        ]);

        $calendar->save($data['days']);

        return response()->noContent();
    }
}
