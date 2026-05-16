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
            'name' => 'sometimes|nullable|string',
            'email' => 'sometimes|nullable|email',
            'phone' => 'sometimes|nullable|string',
            'address' => 'sometimes|nullable|string',
            'logo' => 'sometimes|nullable|image|max:2048',
            'latitude' => 'sometimes|nullable|numeric',
            'longitude' => 'sometimes|nullable|numeric',
            'radius_meters' => 'sometimes|nullable|numeric',
            'watzap_api_key' => 'sometimes|nullable|string',
            'watzap_number_key' => 'sometimes|nullable|string',
            'watzap_base_url' => 'sometimes|nullable|url',
        ]);

        $data = $request->only(['name', 'email', 'phone', 'address', 'latitude', 'longitude', 'radius_meters', 'watzap_api_key', 'watzap_number_key', 'watzap_base_url']);
        
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('companies', 'public');
            $data['logo'] = $path;
        }

        $company->update($data);

        return $this->successResponse($company, 'Data perusahaan berhasil diperbarui.');
    }
}
