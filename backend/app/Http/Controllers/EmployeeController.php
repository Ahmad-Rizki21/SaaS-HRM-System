<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $employees = User::where('company_id', $request->user()->company_id)
            ->with('role')
            ->orderBy('name', 'asc')
            ->paginate(10);
            
        return $this->successResponse($employees, 'Data karyawan berhasil diambil.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role_id' => 'required|exists:roles,id',
            'nik' => 'nullable|string',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'join_date' => 'nullable|date',
        ]);

        $employee = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'company_id' => $request->user()->company_id,
            'role_id' => $request->role_id,
            'nik' => $request->nik,
            'phone' => $request->phone,
            'address' => $request->address,
            'join_date' => $request->join_date,
        ]);

        return $this->successResponse($employee, 'Karyawan baru berhasil ditambahkan.', 201);
    }

    public function show($id)
    {
        $employee = User::findOrFail($id);
        return $this->successResponse($employee, 'Detail karyawan berhasil diambil.');
    }

    public function update(Request $request, $id)
    {
        $employee = User::findOrFail($id);
        
        $request->validate([
            'name' => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'role_id' => 'sometimes|exists:roles,id',
        ]);

        $employee->update($request->all());
        
        if ($request->password) {
            $employee->update(['password' => Hash::make($request->password)]);
        }

        return $this->successResponse($employee, 'Data karyawan berhasil diupdate.');
    }

    public function destroy($id)
    {
        $employee = User::findOrFail($id);
        $employee->delete();
        
        return $this->successResponse(null, 'Karyawan berhasil dihapus.');
    }
}
