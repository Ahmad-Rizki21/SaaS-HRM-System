<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function show(Request $request)
    {
        $company = Company::with('offices')->findOrFail($request->user()->company_id);
        return $this->successResponse($company, 'Data perusahaan berhasil diambil.');
    }

    public function update(Request $request)
    {
        $company = Company::findOrFail($request->user()->company_id);

        $request->validate([
            'name' => 'sometimes|string',
            'email' => 'sometimes|email',
            'phone' => 'sometimes|string',
            'address' => 'sometimes|string',
            'logo' => 'sometimes|image|max:2048',
            'latitude' => 'sometimes|numeric',
            'longitude' => 'sometimes|numeric',
            'radius_meters' => 'sometimes|numeric',
        ]);

        $data = $request->only(['name', 'email', 'phone', 'address', 'latitude', 'longitude', 'radius_meters']);
        
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('companies', 'public');
            $data['logo'] = $path;
        }

        $company->update($data);

        return $this->successResponse($company, 'Data perusahaan berhasil diperbarui.');
    }
}
