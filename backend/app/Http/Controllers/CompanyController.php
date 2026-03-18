<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function show(Request $request)
    {
        $company = Company::findOrFail($request->user()->company_id);
        return $this->successResponse($company, 'Data perusahaan berhasil diambil.');
    }

    public function update(Request $request)
    {
        $company = Company::findOrFail($request->user()->company_id);

        $request->validate([
            'name' => 'sometimes|string',
            'email' => 'sometimes|email',
            'address' => 'sometimes|string',
            'default_radius' => 'sometimes|integer',
        ]);

        $company->update($request->all());

        // Handle Logo Upload if needed later, for now simple update
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('companies', 'public');
            $company->update(['logo' => $path]);
        }

        return $this->successResponse($company, 'Data perusahaan berhasil diupdate.');
    }
}
