<?php

namespace Origo\Application\ApiV1\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Notifications\DatabaseNotification;

/** The signed-in person's own notifications: the latest ones and how many are unread. */
class NotificationController
{
    private const LATEST = 30;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $notifications = $user->notifications()->latest()->limit(self::LATEST)->get();

        return response()->json([
            'data' => $notifications->map(fn (DatabaseNotification $notification) => [
                'id' => $notification->id,
                'data' => $notification->data,
                'isRead' => $notification->read_at !== null,
                'at' => $notification->created_at?->toIso8601ZuluString(),
            ]),
            'meta' => ['unreadCount' => $user->unreadNotifications()->count()],
        ]);
    }

    /** Marks the given notifications read, or all of them when no ids are sent. */
    public function markRead(Request $request): Response
    {
        $data = $request->validate(['ids' => ['sometimes', 'array', 'max:100'], 'ids.*' => ['uuid']]);
        $unread = $request->user()->unreadNotifications();

        if (isset($data['ids'])) {
            $unread->whereIn('id', $data['ids']);
        }

        $unread->update(['read_at' => now()]);

        return response()->noContent();
    }
}
