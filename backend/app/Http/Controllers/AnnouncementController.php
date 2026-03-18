<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $announcements = Announcement::where('company_id', $request->user()->company_id)
            ->with('user')
            ->orderBy('id', 'desc')
            ->get();
            
        return $this->successResponse($announcements, 'Daftar pengumuman berhasil diambil.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'content' => 'required|string',
        ]);

        $announcement = Announcement::create([
            'company_id' => $request->user()->company_id,
            'user_id' => $request->user()->id,
            'title' => $request->title,
            'content' => $request->content,
        ]);

        return $this->successResponse($announcement, 'Pengumuman berhasil dipublish.', 201);
    }

    public function update(Request $request, $id)
    {
        $announcement = Announcement::where('company_id', $request->user()->company_id)->findOrFail($id);
        
        $request->validate([
            'title' => 'sometimes|string',
            'content' => 'sometimes|string',
        ]);

        $announcement->update($request->all());

        return $this->successResponse($announcement, 'Pengumuman berhasil diperbarui.');
    }

    public function destroy(Request $request, $id)
    {
        $announcement = Announcement::where('company_id', $request->user()->company_id)->findOrFail($id);
        $announcement->delete();
        return $this->successResponse(null, 'Pengumuman berhasil dihapus.');
    }
}
