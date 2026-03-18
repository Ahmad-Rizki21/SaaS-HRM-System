<?php

namespace App\Traits;

use App\Models\Notification;
use App\Models\User;
use App\Mail\UserNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

trait Notifiable
{
    /**
     * Send both database and email notification to a user
     */
    public function notify(User $user, string $title, string $message, string $type = 'info', string $link = null)
    {
        // 1. Create database notification
        Notification::create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'is_read' => false,
            'link' => $link
        ]);

        // 2. Send email if email is present
        if ($user->email) {
            try {
                Mail::to($user->email)->send(new UserNotification($user, $title, $message));
            } catch (\Exception $e) {
                Log::error("Failed to send email to {$user->email}: " . $e->getMessage());
            }
        }
    }
}
