<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\AcceptingOrganization;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AcceptingOrganizationController extends Controller 
{
    public function index(Request $request)
    {
        $query = AcceptingOrganization::query();

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%")
                  ->orWhere('name_in_japanese', 'like', "%{$request->search}%");
        }

        return Inertia::render('admin/organization/Index', [
            'organizations' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search'])
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/organization/OrganizationForm');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_in_japanese' => 'nullable|string|max:255',
            'type' => 'required|in:kanri_dantai,tsk,both',
            'address' => 'nullable|string',
            'address_in_japanese' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'pic_name' => 'nullable|string|max:255',
            'training_center_name' => 'nullable|string|max:255',
            'training_center_address' => 'nullable|string|max:255',
            'training_center_phone' => 'nullable|string|max:20',
            'training_center_area' => 'nullable|string|max:255',
            'training_center_capacity' => 'nullable|string|max:255',
            'training_center_type' => 'nullable|in:asrama,kos,lainnya',
            
            'allowance_in_first_month' => 'nullable|boolean',
            'allowance_amount' => 'nullable|string|max:255',

            'meal_allowance' => 'nullable|boolean',
            'meal_allowance_amount' => 'nullable|string|max:255',
            'student_pays_meal' => 'nullable|boolean',
            'student_pays_meal_amount' => 'nullable|string|max:255',

            'accommodation_allowance' => 'nullable|boolean',
            'accommodation_allowance_amount' => 'nullable|string|max:255',
            'student_pays_accommodation' => 'nullable|boolean',
            'student_pays_accommodation_amount' => 'nullable|string|max:255',
        ]);

        AcceptingOrganization::create($validated);

        return redirect()->route('admin.organizations.index')->with('success', 'Organisasi berhasil ditambahkan.');
    }

    public function edit($id)
    {
        $organization = AcceptingOrganization::findOrFail($id);
        return Inertia::render('admin/organization/OrganizationForm', [
            'organization' => $organization
        ]);
    }

    public function update(Request $request, $id)
    {
        $organization = AcceptingOrganization::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_in_japanese' => 'nullable|string|max:255',
            'type' => 'required|in:kanri_dantai,tsk,both',
            'address' => 'nullable|string',
            'address_in_japanese' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'pic_name' => 'nullable|string|max:255',
            'training_center_name' => 'nullable|string|max:255',
            'training_center_address' => 'nullable|string|max:255',
            'training_center_phone' => 'nullable|string|max:20',
            'training_center_area' => 'nullable|string|max:255',
            'training_center_capacity' => 'nullable|string|max:255',
            'training_center_type' => 'nullable|in:asrama,kos,lainnya',
            
            'allowance_in_first_month' => 'required|boolean',
            'allowance_amount' => 'nullable|string|max:255',

            'meal_allowance' => 'required|boolean',
            'meal_allowance_amount' => 'nullable|string|max:255',
            'student_pays_meal' => 'required|boolean',
            'student_pays_meal_amount' => 'nullable|string|max:255',

            'accommodation_allowance' => 'required|boolean',
            'accommodation_allowance_amount' => 'nullable|string|max:255',
            'student_pays_accommodation' => 'required|boolean',
            'student_pays_accommodation_amount' => 'nullable|string|max:255',
        ]);

        // --- LOGIKA SANITASI DATA (MEMBERSIHKAN DATA SAMPAH) ---

        // 1. Bersihkan Uang Saku Bulan Pertama
        if (!$validated['allowance_in_first_month']) {
            $validated['allowance_amount'] = null; // atau '0'
        }

        // 2. Bersihkan Tunjangan Makan vs Siswa Bayar Makan
        if ($validated['meal_allowance']) {
            // Jika dapet tunjangan, maka "Siswa Bayar" harus 0/null
            $validated['student_pays_meal'] = false;
            $validated['student_pays_meal_amount'] = null;
        } else {
            // Jika tidak dapet tunjangan, nominal tunjangan harus dihapus
            $validated['meal_allowance_amount'] = null;
        }

        // 3. Bersihkan Tunjangan Akomodasi vs Siswa Bayar Sewa
        if ($validated['accommodation_allowance']) {
            // Jika dapet tunjangan, maka "Siswa Bayar" harus 0/null
            $validated['student_pays_accommodation'] = false;
            $validated['student_pays_accommodation_amount'] = null;
        } else {
            // Jika tidak dapet tunjangan, nominal tunjangan sewa harus dihapus
            $validated['accommodation_allowance_amount'] = null;
        }

        // Eksekusi Update dengan data yang sudah bersih (Sanitized)
        $organization->update($validated);

        return redirect()->route('admin.organizations.index')->with('success', 'Data berhasil diperbarui dan disinkronkan.');
    }

    public function destroy($id)
    {
        $organization = AcceptingOrganization::findOrFail($id);
        $organization->delete();

        return redirect()->route('admin.organizations.index')->with('success', 'Organisasi berhasil dihapus.');
    }
}