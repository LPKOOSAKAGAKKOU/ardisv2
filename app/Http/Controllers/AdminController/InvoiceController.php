<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\AcceptingOrganization;
use App\Models\Company;
use App\Models\Invoice;
use App\Services\BillingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function __construct(private BillingService $billing)
    {
    }

    public function index(Request $request)
    {
        $query = Invoice::query()
            ->with(['acceptingOrganization:id,name', 'company:id,name,name_in_japanese'])
            ->withCount('items')
            ->latest('issue_date');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->organization_id) {
            $query->where('accepting_organization_id', $request->organization_id);
        }

        if ($request->search) {
            $query->where('invoice_number', 'like', "%{$request->search}%");
        }

        $invoices = $query->paginate(15)->withQueryString()
            ->through(fn (Invoice $inv) => [
                'id'             => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'organization'   => $inv->recipientName(),
                'bill_to'        => $inv->bill_to,
                'issue_date'     => $inv->issue_date?->toDateString(),
                'period_from'    => $inv->period_from?->toDateString(),
                'period_to'      => $inv->period_to?->toDateString(),
                'total_amount'   => $inv->total_amount,
                'status'         => $inv->status,
                'paid_at'        => $inv->paid_at?->toDateString(),
                'items_count'    => $inv->items_count,
            ]);

        return Inertia::render('admin/invoice/Index', [
            'invoices'      => $invoices,
            'organizations' => AcceptingOrganization::orderBy('name')->get(['id', 'name']),
            'filters'       => $request->only(['search', 'status', 'organization_id']),
        ]);
    }

    /**
     * Form generate invoice + preview tagihan yang jatuh tempo pada bulan terpilih.
     */
    public function create(Request $request)
    {
        // recipient_type: organization | company. Backward-compat: link lama memakai organization_id.
        $recipientType = $request->recipient_type ?: ($request->organization_id ? 'organization' : 'organization');
        $recipientId = $request->recipient_id ?: $request->organization_id;
        $month = $request->month; // format YYYY-MM

        $preview = null;
        if ($recipientId && $month) {
            $monthDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth();

            if ($recipientType === 'company') {
                $company = Company::find($recipientId);
                if ($company) {
                    $items = $this->billing->previewForCompany($company, $monthDate);
                    $preview = [
                        'recipient_type' => 'company',
                        'recipient_id'   => $company->id,
                        'recipient_name' => $company->name_in_japanese ?: $company->name,
                        'month'          => $month,
                        'items'          => $items->values(),
                        'total'          => $items->sum('amount'),
                    ];
                }
            } else {
                $organization = AcceptingOrganization::find($recipientId);
                if ($organization) {
                    $items = $this->billing->previewForMonth($organization, $monthDate);
                    $preview = [
                        'recipient_type' => 'organization',
                        'recipient_id'   => $organization->id,
                        'recipient_name' => $organization->name,
                        'month'          => $month,
                        'items'          => $items->values(),
                        'total'          => $items->sum('amount'),
                    ];
                }
            }
        }

        return Inertia::render('admin/invoice/Generate', [
            'organizations' => AcceptingOrganization::orderBy('name')->get(['id', 'name']),
            'companies'     => Company::whereHas('departures')->orderBy('name')->get(['id', 'name', 'name_in_japanese']),
            'preview'       => $preview,
            'filters'       => [
                'recipient_type' => $recipientType,
                'recipient_id'   => $recipientId,
                'month'          => $month,
            ],
        ]);
    }

    public function store(Request $request)
    {
        // Backward-compat: jika hanya accepting_organization_id yang dikirim, anggap recipient organisasi.
        if (! $request->recipient_type && $request->accepting_organization_id) {
            $request->merge([
                'recipient_type' => 'organization',
                'recipient_id'   => $request->accepting_organization_id,
            ]);
        }

        $validated = $request->validate([
            'recipient_type' => 'required|in:organization,company',
            'recipient_id'   => 'required|integer',
            'month'          => 'required|date_format:Y-m',
            'issue_date'     => 'nullable|date',
        ]);

        $month = Carbon::createFromFormat('Y-m', $validated['month'])->startOfMonth();
        $issueDate = ! empty($validated['issue_date']) ? Carbon::parse($validated['issue_date']) : null;

        if ($validated['recipient_type'] === 'company') {
            $company = Company::findOrFail($validated['recipient_id']);
            $invoice = $this->billing->generateForCompany($company, $month, $issueDate);
        } else {
            $organization = AcceptingOrganization::findOrFail($validated['recipient_id']);
            $invoice = $this->billing->generateForMonth($organization, $month, $issueDate);
        }

        if (! $invoice) {
            return redirect()->back()
                ->with('error', 'Tidak ada tagihan yang jatuh tempo pada bulan tersebut.');
        }

        return redirect()->route('admin.invoices.show', $invoice->id)
            ->with('success', "Invoice {$invoice->invoice_number} berhasil dibuat.");
    }

    public function show($id)
    {
        $invoice = Invoice::with(['acceptingOrganization', 'company', 'items'])->findOrFail($id);

        return Inertia::render('admin/invoice/Show', [
            'invoice' => [
                'id'             => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'issue_date'     => $invoice->issue_date?->toDateString(),
                'period_from'    => $invoice->period_from?->toDateString(),
                'period_to'      => $invoice->period_to?->toDateString(),
                'total_amount'   => $invoice->total_amount,
                'status'         => $invoice->status,
                'paid_at'        => $invoice->paid_at?->toDateString(),
                'notes'          => $invoice->notes,
                'bill_to'        => $invoice->bill_to,
                'recipient_name' => $invoice->recipientName(),
                'organization'   => $invoice->acceptingOrganization,
                'items'          => $invoice->items->map(fn ($it) => [
                    'id'           => $it->id,
                    'kind'         => $it->kind,
                    'company_name' => $it->company_name,
                    'description'  => $it->description,
                    'students'     => $it->students ?? [],
                    'people'       => $it->people,
                    'months'       => $it->months,
                    'unit_price'   => $it->unit_price,
                    'amount'       => $it->amount,
                ]),
            ],
        ]);
    }

    /**
     * Halaman cetak bersih (standalone, tanpa shell aplikasi) untuk di-export
     * sebagai PDF lewat dialog cetak browser (Save as PDF).
     */
    public function print($id)
    {
        $invoice = Invoice::with(['acceptingOrganization', 'company', 'items'])->findOrFail($id);

        return view('invoices.print', [
            'invoice'       => $invoice,
            'recipientName' => $invoice->recipientName(),
        ]);
    }

    public function markPaid(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'paid_at' => 'nullable|date',
        ]);

        $invoice->update([
            'status'  => 'paid',
            'paid_at' => ! empty($validated['paid_at']) ? Carbon::parse($validated['paid_at']) : Carbon::today(),
        ]);

        return redirect()->back()->with('success', 'Invoice ditandai lunas.');
    }

    public function markUnpaid($id)
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->update(['status' => 'issued', 'paid_at' => null]);

        return redirect()->back()->with('success', 'Status pembayaran dibatalkan.');
    }

    public function destroy($id)
    {
        Invoice::findOrFail($id)->delete();

        return redirect()->route('admin.invoices.index')
            ->with('success', 'Invoice berhasil dihapus.');
    }
}
