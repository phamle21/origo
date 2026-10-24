<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * One line under the bell: something someone did that concerns the person. The data keeps everything
 * the web needs to word it and to link to the place (project, screen and point, or the plan), so a
 * notification still reads correctly after names change.
 */
class ActivityNotification extends Notification
{
    use Queueable;

    public const MENTION = 'mention';

    public const MEMBER_ADDED = 'memberAdded';

    public const ROLE_CHANGED = 'roleChanged';

    public const TASK_ASSIGNED = 'taskAssigned';

    /**
     * @param  array<string, mixed>  $details  kind-specific fields (screen, point, excerpt, role, task)
     */
    public function __construct(
        public readonly string $kind,
        public readonly User $actor,
        public readonly array $project,
        public readonly array $details = [],
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'kind' => $this->kind,
            'actor' => ['id' => $this->actor->id, 'name' => $this->actor->name, 'initials' => $this->actor->initials()],
            'project' => $this->project,
            ...$this->details,
        ];
    }

    /**
     * @param  iterable<User>  $people
     */
    public static function send(iterable $people, self $notification): void
    {
        foreach ($people as $person) {
            // Nobody is told about their own action, and locked accounts are left alone.
            if ($person->isNot($notification->actor) && $person->is_active) {
                $person->notify($notification);
            }
        }
    }

    /**
     * @param  object{code: string, name: array<string, mixed>}  $project
     * @return array{code: string, name: array<string, mixed>}
     */
    public static function projectRef(object $project): array
    {
        return ['code' => $project->code, 'name' => $project->name];
    }
}
