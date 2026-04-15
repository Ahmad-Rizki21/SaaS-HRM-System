<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;

use App\Traits\Notifiable;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class AnnouncementController extends Controller
{
    use Notifiable;

    public function index(Request $request)
    {
        $announcements = Announcement::where('company_id', $request->user()->company_id)
            ->with('user')
            ->orderBy('id', 'desc')
            ->paginate(10);
            
        return $this->successResponse($announcements, 'Daftar pengumuman berhasil diambil.');
    }

    public function store(Request $request)
    {
        abort_if(!$request->user()->hasPermission('manage-announcements'), 403, 'Akses ditolak.');
        $request->validate([
            'title' => 'required|string',
            'content' => 'required|string',
        ]);

        $announcement = Announcement::create([
            'company_id' => $request->user()->company_id,
            'user_id' => $request->user()->id,
            'title' => $request->input('title'),
            'content' => $request->input('content'),
        ]);

        // Broadcast to all company members
        $members = User::where('company_id', $request->user()->company_id)
            ->where('id', '!=', $request->user()->id)
            ->get();

        foreach ($members as $member) {
            /** @var \App\Models\User $member */
            // 1. In-App Notification (Kotak Pesan)
            $this->notify(
                $member, 
                "PENGUMUMAN: {$request->title}", 
                "Terdapat pengumuman resmi baru: {$request->title}", 
                'info',
                '/dashboard/announcements',
                'mail', // Category KOTAK PESAN
                false 
            );

            // 2. Real-time Push Notification (FCM)
            \App\Services\FCMService::sendNotification(
                $member, 
                "Pengumuman Baru: {$request->title}", 
                "Buka aplikasi untuk melihat detail pengumuman terbaru."
            );

            // 3. Premium Email Notification
            try {
                Mail::send('emails.premium_announcement', [
                    'member' => $member,
                    'title' => $request->input('title'),
                    'announcement_content' => $request->input('content')
                ], function ($message) use ($member, $request) {
                    $message->to($member->email)
                        ->subject("PENGUMUMAN RESMI: {$request->title}");
                });
            } catch (\Exception $e) {
                // Silently skip email if fails
            }
        }

        $this->logActivity('CREATE_ANNOUNCEMENT', "Membuat pengumuman baru: {$request->title}", $announcement);

        return $this->successResponse($announcement, 'Pengumuman berhasil dipublish.', 201);
    }

    public function update(Request $request, $id)
    {
        abort_if(!$request->user()->hasPermission('manage-announcements'), 403, 'Akses ditolak.');
        $announcement = Announcement::where('company_id', $request->user()->company_id)->findOrFail($id);
        
        $request->validate([
            'title' => 'sometimes|string',
            'content' => 'sometimes|string',
        ]);

        $announcement->update($request->all());

        $this->logActivity('UPDATE_ANNOUNCEMENT', "Memperbarui pengumuman: {$announcement->title}", $announcement);

        return $this->successResponse($announcement, 'Pengumuman berhasil diperbarui.');
    }

    public function destroy(Request $request, $id)
    {
        abort_if(!$request->user()->hasPermission('manage-announcements'), 403, 'Akses ditolak.');
        $announcement = Announcement::where('company_id', $request->user()->company_id)->findOrFail($id);
        $title = $announcement->title;
        $announcement->delete();
        
        $this->logActivity('DELETE_ANNOUNCEMENT', "Menghapus pengumuman: {$title}");

        return $this->successResponse(null, 'Pengumuman berhasil dihapus.');
    }
}
