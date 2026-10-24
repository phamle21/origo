<?php

namespace Origo\Core\Project\Enums;

/**
 * What a project role may do inside one project. The list is fixed because each value is checked by
 * code; admins build roles by ticking these and may rename them (see the permission catalog).
 */
enum ProjectPermission: string
{
    case Read = 'project.read';
    case EditPlan = 'plan.edit';
    case EditDesign = 'design.edit';
    case ManageMembers = 'members.manage';
    case EditProject = 'project.edit';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $permission) => $permission->value, self::cases());
    }

    /**
     * Every change needs reading first, so any other permission brings "read" with it.
     *
     * @param  list<string>  $permissions
     * @return list<string>
     */
    public static function normalize(array $permissions): array
    {
        $kept = array_values(array_intersect(self::values(), $permissions));

        if ($kept !== [] && ! in_array(self::Read->value, $kept, true)) {
            array_unshift($kept, self::Read->value);
        }

        return $kept;
    }
}
