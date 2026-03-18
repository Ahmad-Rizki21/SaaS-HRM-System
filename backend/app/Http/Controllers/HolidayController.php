<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    public function index(Request $request)
    {
        $holidays = Holiday::where(function($q) use ($request) {
            $q->whereNull('company_id') // National
              ->orWhere('company_id', $request->user()->company_id);
        })->orderBy('date', 'asc')->get();

        return $this->successResponse($holidays, 'Daftar hari libur berhasil diambil.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'date' => 'required|date',
        ]);

        $holiday = Holiday::create([
            'company_id' => $request->user()->company_id,
            'name' => $request->name,
            'date' => $request->date,
        ]);

        return $this->successResponse($holiday, 'Hari libur berhasil ditambahkan.', 201);
    }
    public function update(Request $request, $id)
    {
        $holiday = Holiday::findOrFail($id);
        
        if (!$holiday->company_id && $request->user()->role_id !== 7) { // Role 7 is Super Admin
            return $this->errorResponse('Anda tidak bisa mengedit hari libur nasional.', 403);
        }

        $holiday->update($request->all());
        return $this->successResponse($holiday, 'Hari libur berhasil diperbarui.');
    }

    public function destroy(Request $request, $id)
    {
        $holiday = Holiday::findOrFail($id);
        
        // Prevent deletion of national holidays if they are company users
        if (!$holiday->company_id && $request->user()->role_id !== 1) {
            return $this->errorResponse('Anda tidak bisa menghapus hari libur nasional.', 403);
        }

        $holiday->delete();
        return $this->successResponse(null, 'Hari libur berhasil dihapus.');
    }
}
