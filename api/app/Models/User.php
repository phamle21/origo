<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\SystemPermission;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Origo\Core\Project\Models\ProjectMember;

#[Fillable(['name', 'email', 'password', 'system_role_id', 'title', 'is_active'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<SystemRole, $this>
     */
    public function systemRole(): BelongsTo
    {
        return $this->belongsTo(SystemRole::class);
    }

    /**
     * @return HasMany<ProjectMember, $this>
     */
    public function projectMemberships(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    /** Holds every system permission (shown as "admin" in the web). */
    public function isAdmin(): bool
    {
        return count($this->permissions()) === count(SystemPermission::cases());
    }

    public function hasPermission(SystemPermission $permission): bool
    {
        return in_array($permission->value, $this->permissions(), true);
    }

    /** @return list<string> */
    public function permissions(): array
    {
        return $this->systemRole?->effectivePermissions() ?? [];
    }

    /** Up to two letters shown in avatars, e.g. "Minh Anh" → "MA". */
    public function initials(): string
    {
        $words = preg_split('/\s+/u', trim($this->name), -1, PREG_SPLIT_NO_EMPTY) ?: ['?'];
        $letters = array_map(fn (string $word) => mb_strtoupper(mb_substr($word, 0, 1)), array_slice($words, 0, 2));

        return implode('', $letters);
    }
}
