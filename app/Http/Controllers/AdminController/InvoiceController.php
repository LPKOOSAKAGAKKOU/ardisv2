<?php

namespace App\Http\Controllers\AdminController;

use App\Http\Controllers\Controller;
use App\Models\AcceptingOrganization;
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
            ->with('acceptingOrganization:id,name')
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
                'organization'   => $inv->acceptingOrganization?->name,
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
        $preview = null;
        $organizationId = $request->organization_id;
        $month = $request->month; // format YYYY-MM

        if ($organizationId && $month) {
            $organization = AcceptingOrganization::find($organizationId);
            if ($organization) {
                $monthDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
                $items = $this->billing->previewForMonth($organization, $monthDate);

                $preview = [
                    'organization_id'   => $organization->id,
                    'organization_name' => $organization->name,
                    'month'             => $month,
                    'items'             => $items->values(),
                    'total'             => $items->sum('amount'),
                ];
            }
        }

        return Inertia::render('admin/invoice/Generate', [
            'organizations' => AcceptingOrganization::orderBy('name')->get(['id', 'name']),
            'preview'       => $preview,
            'filters'       => ['organization_id' => $organizationId, 'month' => $month],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'accepting_organization_id' => 'required|exists:accepting_organizations,id',
            'month'                     => 'required|date_format:Y-m',
            'issue_date'                => 'nullable|date',
        ]);

        $organization = AcceptingOrganization::findOrFail($validated['accepting_organization_id']);
        $month = Carbon::createFromFormat('Y-m', $validated['month'])->startOfMonth();
        $issueDate = ! empty($validated['issue_date']) ? Carbon::parse($validated['issue_date']) : null;

        $invoice = $this->billing->generateForMonth($organization, $month, $issueDate);

        if (! $invoice) {
            return redirect()->back()
                ->with('error', 'Tidak ada tagihan yang jatuh tempo pada bulan tersebut.');
        }

        return redirect()->route('admin.invoices.show', $invoice->id)
            ->with('success', "Invoice {$invoice->invoice_number} berhasil dibuat.");
    }

    public function show($id)
    {
        $invoice = Invoice::with(['acceptingOrganization', 'items'])->findOrFail($id);

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
                'organization'   => $invoice->acceptingOrganization,
                'items'          => $invoice->items->map(fn ($it) => [
                    'id'           => $it->id,
                    'company_name' => $it->company_name,
                    'description'  => $it->description,
                    'people'       => $it->people,
                    'months'       => $it->months,
                    'unit_price'   => $it->unit_price,
                    'amount'       => $it->amount,
                ]),
            ],
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
