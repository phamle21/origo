<?php

namespace App\Enums;

/**
 * What a system role may do outside any single project. Inside a project, the project role decides
 * (see ProjectRole); these permissions only add rights on top of it.
 */
enum SystemPermission: string
{
    case ManageUsers = 'users.manage';
    case ManageSettings = 'settings.manage';
    case CreateProjects = 'projects.create';
    case ViewAllProjects = 'projects.view_all';
    case ManageAllProjects = 'projects.manage_all';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $permission) => $permission->value, self::cases());
    }
}
