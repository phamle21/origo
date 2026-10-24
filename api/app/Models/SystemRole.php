<?php

namespace App\Models;

use App\Enums\SystemPermission;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A named set of system permissions given to people, such as "Admin", "Member" or a custom "PMO".
 * Every role is ordinary data admins create, rename, re-tick or delete; one of them is the default
 * for new accounts. The system refuses changes that would leave nobody able to manage settings.
 */
#[Fillable(['key', 'name', 'description', 'permissions', 'is_default'])]
class SystemRole extends Model
{
    use HasUlids;

    /** Keys of the roles the seeder creates; only seeding and tests rely on them. */
    public const ADMIN = 'admin';

    public const MEMBER = 'member';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['name' => 'array', 'description' => 'array', 'permissions' => 'array', 'is_default' => 'boolean'];
    }

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /** @return list<string> */
    public function effectivePermissions(): array
    {
        return array_values(array_intersect(SystemPermission::values(), $this->permissions ?? []));
    }

    public static function idFor(string $key): string
    {
        return static::query()->where('key', $key)->value('id');
    }

    /** A role holding every system permission, for the first administrator; null if none exists. */
    public static function fullAccessId(): ?string
    {
        return static::query()
            ->get()
            ->first(fn (SystemRole $role) => count($role->effectivePermissions()) === count(SystemPermission::cases()))
            ?->id;
    }

    /** The role a new account gets when none is chosen. */
    public static function defaultId(): ?string
    {
        return static::query()->where('is_default', true)->value('id');
    }
}
