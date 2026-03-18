<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index()
    {
        /** @var User $user */
        $user = Auth::user();
        $notifications = $user->notifications()->latest()->limit(20)->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $notifications
        ]);
    }

    public function markAsRead($id)
    {
        /** @var User $user */
        $user = Auth::user();
        $notification = $user->notifications()->findOrFail($id);
        $notification->update(['is_read' => true]);
        
        return response()->json([
            'status' => 'success',
            'message' => 'Notification marked as read'
        ]);
    }

    public function markAllAsRead()
    {
        /** @var User $user */
        $user = Auth::user();
        $user->notifications()->where('is_read', false)->update(['is_read' => true]);
        
        return response()->json([
            'status' => 'success',
            'message' => 'All notifications marked as read'
        ]);
    }
}
