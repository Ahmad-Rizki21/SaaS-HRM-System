<?php

namespace App\Services;

use App\Models\User;
use Google_Client;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FCMService
{
    /**
     * Send a push notification via Firebase Cloud Messaging (v1)
     *
     * @param User $user
     * @param string $title
     * @param string $body
     * @param array $data
     * @return bool
     */
    public static function sendNotification(User $user, string $title, string $body, array $data = [])
    {
        if (!$user->fcm_token) {
            Log::warning("Skipping FCM notification: User ID {$user->id} has no token.");
            return false;
        }

        try {
            $credentials_filepath = storage_path('app/firebase-auth.json');
            
            if (!file_exists($credentials_filepath)) {
                Log::error("FCM Error: Service account JSON file not found at " . $credentials_filepath);
                return false;
            }

            // Get Google Access Token
            $client = new Google_Client();
            $client->setAuthConfig($credentials_filepath);
            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            $accessToken = $client->fetchAccessTokenWithAssertion();
            
            if (!isset($accessToken['access_token'])) {
                Log::error("FCM Error: Failed to fetch access token.");
                return false;
            }

            $token = $accessToken['access_token'];
            $project_id = json_decode(file_get_contents($credentials_filepath))->project_id;

            // Send to FCM v1 API
            $response = Http::withHeaders([
                'Authorization' => "Bearer $token",
                'Content-Type' => 'application/json',
            ])->post("https://fcm.googleapis.com/v1/projects/$project_id/messages:send", [
                'message' => [
                    'token' => $user->fcm_token,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                    ],
                    'data' => !empty($data) ? array_map('strval', $data) : null,
                    'android' => [
                        'notification' => [
                            'sound' => 'default',
                            'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                        ]
                    ]
                ],
            ]);

            if ($response->successful()) {
                Log::info("FCM Notification sent successfully to user {$user->id}");
                return true;
            } else {
                Log::error("FCM Error response: " . $response->body());
                return false;
            }
        } catch (\Exception $e) {
            Log::error("FCM Exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send a broadcast notification to multiple users.
     *
     * @param mixed $users
     * @param string $title
     * @param string $body
     * @param array $data
     * @return void
     */
    public static function broadcastNotification($users, string $title, string $body, array $data = [])
    {
        foreach ($users as $user) {
            self::sendNotification($user, $title, $body, $data);
        }
    }
}
