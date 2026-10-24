<?php

namespace Origo\Core\Screen\Actions;

use App\Models\User;
use App\Notifications\ActivityNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Origo\Core\Screen\Models\PointComment;
use Origo\Core\Screen\Models\ScreenPoint;

class AddPointComment
{
    /**
     * Saves the comment and tells the people tagged in it. Only members of the project can be tagged;
     * anyone else in the list is ignored, as is the author.
     *
     * @param  list<int>  $mentionIds
     */
    public function handle(ScreenPoint $point, User $author, string $body, array $mentionIds = []): PointComment
    {
        $point->loadMissing('screen.project');
        $project = $point->screen->project;

        $mentioned = User::query()
            ->whereIn('id', array_unique($mentionIds))
            ->whereKeyNot($author->id)
            ->whereHas('projectMemberships', fn ($members) => $members->where('project_id', $project->id))
            ->get();

        $comment = DB::transaction(function () use ($point, $author, $body, $mentioned) {
            $comment = PointComment::create(['screen_point_id' => $point->id, 'user_id' => $author->id, 'body' => trim($body)]);
            $comment->mentions()->sync($mentioned->modelKeys());

            return $comment;
        });

        ActivityNotification::send($mentioned, new ActivityNotification(ActivityNotification::MENTION, $author, ActivityNotification::projectRef($project), [
            'screen' => ['code' => $point->screen->code, 'name' => $point->screen->name],
            'point' => ['id' => $point->id, 'number' => $point->number, 'title' => $point->title],
            'excerpt' => Str::limit(trim($body), 140),
        ]));

        return $comment;
    }
}
