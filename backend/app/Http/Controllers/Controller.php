<?php

namespace App\Http\Controllers;

abstract class Controller
{
    public function successResponse($data, $message = null, $code = 200)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ], $code);
    }

    public function errorResponse($message, $code = 400)
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
        ], $code);
    }

    protected function logActivity($action, $description, $model = null)
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user) return; // Skip if no user session (e.g. before login)

        \App\Models\ActivityLog::create([
            'company_id' => $user->company_id,
            'user_id' => $user->id,
            'action' => $action,
            'description' => $description,
            'model_type' => $model ? get_class($model) : null,
            'model_id' => $model ? $model->id : null,
        ]);
    }

    protected function sendNotification($userId, $title, $message, $type = 'general', $link = null, $category = 'GENERAL')
    {
        $notification = \App\Models\Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'category' => $category,
            'link' => $link,
            'is_read' => false
        ]);

        // Send FCM Push Notification
        try {
            $user = \App\Models\User::find($userId);
            if ($user && $user->fcm_token) {
                \App\Services\FCMService::sendNotification($user, $title, $message, [
                    'type' => $type,
                    'category' => $category,
                    'link' => $link,
                    'notification_id' => (string) $notification->id
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("FCM failed in Controller: " . $e->getMessage());
        }

        // Real-time broadcast for UI update
        try {
            event(new \App\Events\NotificationCreated($notification));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Broadcast failed in Controller: " . $e->getMessage());
        }

        return $notification;
    }
}
