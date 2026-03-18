<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $shifts = Shift::where('company_id', $request->user()->company_id)->get();
        return $this->successResponse($shifts, 'Daftar shift berhasil diambil.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'start_time' => 'required',
            'end_time' => 'required',
        ]);

        $shift = Shift::create([
            'company_id' => $request->user()->company_id,
            'name' => $request->name,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
        ]);

        return $this->successResponse($shift, 'Shift berhasil dibuat.', 201);
    }

    public function update(Request $request, $id)
    {
        $shift = Shift::findOrFail($id);
        $shift->update($request->all());
        return $this->successResponse($shift, 'Shift berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $shift = Shift::findOrFail($id);
        $shift->delete();
        return $this->successResponse(null, 'Shift berhasil dihapus.');
    }
}
