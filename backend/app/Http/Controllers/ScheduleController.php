<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = Schedule::with(['user', 'shift']);

        // Filter by company's users
        $query->whereHas('user', function($q) use ($request) {
            $q->where('company_id', $request->user()->company_id);
        });

        if ($request->date) {
            $query->where('date', $request->date);
        }

        return $this->successResponse($query->get(), 'Daftar jadwal berhasil diambil.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'shift_id' => 'required|exists:shifts,id',
            'date' => 'required|date',
        ]);

        // Cek apakah user ada di perusahaan yang sama
        $user = \App\Models\User::findOrFail($request->user_id);
        if ($user->company_id !== $request->user()->company_id) {
            return $this->errorResponse('Anda tidak bisa membuat jadwal untuk karyawan luar perusahaan.', 403);
        }

        $schedule = Schedule::updateOrCreate(
            ['user_id' => $request->user_id, 'date' => $request->date],
            ['shift_id' => $request->shift_id]
        );

        return $this->successResponse($schedule, 'Jadwal berhasil diperbarui.', 201);
    }

    public function destroy($id)
    {
        $schedule = Schedule::findOrFail($id);
        $schedule->delete();
        return $this->successResponse(null, 'Jadwal berhasil dihapus.');
    }
}
