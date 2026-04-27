<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class RefreshToken extends Model
{
    protected $fillable = [
        'user_id',
        'token_hash',
        'device_id',
        'ip_address',
        'user_agent',
        'is_revoked',
        'expires_at',
        'last_used_at',
    ];

    protected function casts(): array
    {
        return [
            'is_revoked' => 'boolean',
            'expires_at' => 'datetime',
            'last_used_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate a new refresh token string (plain) and store its hash.
     */
    public static function generateFor(
        User $user,
        ?string $deviceId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        int $expiresInDays = 30
    ): array {
        $plainToken = Str::random(64);
        $tokenHash = hash('sha256', $plainToken);

        $refreshToken = self::create([
            'user_id' => $user->id,
            'token_hash' => $tokenHash,
            'device_id' => $deviceId,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'expires_at' => now()->addDays($expiresInDays),
        ]);

        return [
            'plain_token' => $plainToken,
            'model' => $refreshToken,
        ];
    }

    /**
     * Find a valid (non-revoked, non-expired) token by its plain text value.
     */
    public static function findValidToken(string $plainToken): ?self
    {
        $tokenHash = hash('sha256', $plainToken);

        return self::where('token_hash', $tokenHash)
            ->where('is_revoked', false)
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Revoke this token.
     */
    public function revoke(): void
    {
        $this->update(['is_revoked' => true]);
    }

    /**
     * Revoke all tokens for a user (e.g., on password change or logout-all).
     */
    public static function revokeAllForUser(int $userId): void
    {
        self::where('user_id', $userId)
            ->where('is_revoked', false)
            ->update(['is_revoked' => true]);
    }

    /**
     * Revoke all tokens for a user on a specific device.
     */
    public static function revokeForDevice(int $userId, string $deviceId): void
    {
        self::where('user_id', $userId)
            ->where('device_id', $deviceId)
            ->where('is_revoked', false)
            ->update(['is_revoked' => true]);
    }

    /**
     * Clean up expired tokens (for scheduled task).
     */
    public static function purgeExpired(): int
    {
        return self::where('expires_at', '<', now())
            ->orWhere('is_revoked', true)
            ->delete();
    }

    /**
     * Mark token as used (update last_used_at).
     */
    public function markAsUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }
}
