<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Imports\EmployeeImport;
use Maatwebsite\Excel\Facades\Excel;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        abort_if(!$request->user()->hasPermission('view-employees'), 403, 'Akses ditolak.');

        $query = User::query();
        $user = $request->user();

        if ($user->company_id && !$user->canAccessAllCompanies()) {
            $query->where('company_id', $user->company_id);
        }

        $employees = $query
            ->when($request->search, function($q) use ($request) {
                $q->where(function($qq) use ($request) {
                    $qq->where('name', 'like', "%{$request->search}%")
                      ->orWhere('email', 'like', "%{$request->search}%");
                });
            })
            ->when($request->id, function($q) use ($request) {
                $q->where('id', $request->id);
            })
            ->with('role')
            ->orderBy('name', 'asc')
            ->paginate($request->per_page ?? 10);
            
        return $this->successResponse($employees, 'Data karyawan berhasil diambil.');
    }

    public function store(Request $request)
    {
        abort_if(!$request->user()->hasPermission('create-employees'), 403, 'Akses ditolak.');

        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role_id' => 'required|exists:roles,id',
            'nik' => 'nullable|string',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'join_date' => 'nullable|date',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $path = null;
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('profile-photos', 'public');
        }

        $employee = new User();
        $employee->name = $request->name;
        $employee->email = $request->email;
        $employee->password = Hash::make($request->password);
        $employee->company_id = $request->user()->company_id;
        $employee->role_id = $request->role_id;
        $employee->nik = $request->nik;
        $employee->phone = $request->phone;
        $employee->address = $request->address;
        $employee->join_date = $request->join_date;
        $employee->profile_photo_path = $path;
        $employee->save();

        $this->logActivity('CREATE_EMPLOYEE', "Menambahkan karyawan baru: {$employee->name}", $employee);

        return $this->successResponse($employee, 'Karyawan baru berhasil ditambahkan.', 201);
    }

    public function show($id)
    {
        $employee = User::findOrFail($id);
        return $this->successResponse($employee, 'Detail karyawan berhasil diambil.');
    }

    public function update(Request $request, $id)
    {
        abort_if(!$request->user()->hasPermission('edit-employees'), 403, 'Akses ditolak.');

        $employee = User::findOrFail($id);
        
        $request->validate([
            'name' => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'role_id' => 'sometimes|exists:roles,id',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            if ($employee->profile_photo_path) {
                Storage::disk('public')->delete($employee->profile_photo_path);
            }
            $path = $request->file('photo')->store('profile-photos', 'public');
            $employee->profile_photo_path = $path;
        }

        $employee->update($request->except(['photo', 'password']));
        
        if ($request->password) {
            $employee->update(['password' => Hash::make($request->password)]);
        }

        $this->logActivity('UPDATE_EMPLOYEE', "Memperbarui data karyawan: {$employee->name}", $employee);

        return $this->successResponse($employee, 'Data karyawan berhasil diupdate.');
    }

    public function bulkDestroy(Request $request)
    {
        abort_if(!$request->user()->hasPermission('delete-employees'), 403, 'Akses ditolak.');

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id'
        ]);

        $idsCount = count($request->ids);
        User::whereIn('id', $request->ids)->delete();

        $this->logActivity('BULK_DELETE_EMPLOYEE', "Menghapus {$idsCount} data karyawan secara massal");

        return $this->successResponse(null, "{$idsCount} karyawan berhasil dihapus.");
    }

    public function destroy(Request $request, $id)
    {
        abort_if(!$request->user()->hasPermission('delete-employees'), 403, 'Akses ditolak.');

        $employee = User::findOrFail($id);
        $name = $employee->name;
        $employee->delete();
        
        $this->logActivity('DELETE_EMPLOYEE', "Menghapus data karyawan: {$name} (ID: {$id})");

        return $this->successResponse(null, 'Karyawan berhasil dihapus.');
    }

    public function import(Request $request)
    {
        abort_if(!$request->user()->hasPermission('create-employees'), 403, 'Akses ditolak.');

        $request->validate([
            'file' => 'required|mimes:xlsx,csv,xls|max:5120'
        ]);

        try {
            Excel::import(new EmployeeImport($request->user()->company_id), $request->file('file'));
            
            $this->logActivity('IMPORT_EMPLOYEE', "Mengimpor karyawan secara massal via Excel");
            return $this->successResponse(null, 'Data karyawan berhasil diimpor.');
        } catch (\Exception $e) {
            return $this->errorResponse('Gagal mengimpor: ' . $e->getMessage(), 500);
        }
    }

    public function directory(Request $request)
    {
        $user = $request->user();
        $query = User::where('company_id', $user->company_id);

        $employees = $query
            ->when($request->search, function($q) use ($request) {
                $q->where(function($qq) use ($request) {
                    $qq->where('name', 'like', "%{$request->search}%")
                      ->orWhere('email', 'like', "%{$request->search}%");
                });
            })
            ->with(['role', 'company'])
            ->orderBy('name', 'asc')
            ->paginate($request->per_page ?? 20);

        return $this->successResponse($employees, 'Data direktori karyawan berhasil diambil.');
    }
}
