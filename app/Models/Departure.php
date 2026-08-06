<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departure extends Model
{
    protected $fillable = [
        'accepting_organization_id',
        'company_id',
        'interview_id',
        'program_type',
        'company_name',
        'departure_date',
        'people_count',
        'travel_cost',
        'pre_education_fee',
        'shoukairyou_fee',
        'management_fee',
        'notes',
        'status',
    ];

    protected $casts = [
        'departure_date'    => 'date',
        'people_count'      => 'integer',
        'travel_cost'       => 'integer',
        'pre_education_fee' => 'integer',
        'shoukairyou_fee'   => 'integer',
        'management_fee'    => 'integer',
    ];

    public function acceptingOrganization(): BelongsTo
    {
        return $this->belongsTo(AcceptingOrganization::class);
    }

    public function billings(): HasMany
    {
        return $this->hasMany(DepartureBilling::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function interview(): BelongsTo
    {
        return $this->belongsTo(Interview::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(StudentReturn::class);
    }

    /**
     * Tarif efektif: override per keberangkatan, jika null pakai default organisasi penerima.
     */
    public function effectiveManagementFee(): int
    {
        return $this->management_fee ?? (int) ($this->acceptingOrganization->management_fee ?? 0);
    }

    public function effectivePreEducationFee(): int
    {
        return $this->pre_education_fee ?? (int) ($this->acceptingOrganization->pre_education_fee ?? 0);
    }

    public function isTokuteiGinou(): bool
    {
        return $this->program_type === 'tokutei_ginou';
    }

    /**
     * Hitung jumlah siswa aktif (belum pulang) pada bulan/tanggal tertentu.
     * Jika $month diberikan, siswa yang pulang sebelum atau pada bulan tersebut tidak dihitung.
     */
    public function activePeopleCount(?\Illuminate\Support\Carbon $month = null): int
    {
        $total = max(1, (int) $this->people_count);

        if (! $this->relationLoaded('returns')) {
            $this->load('returns');
        }

        $returnedCount = $this->returns
            ->filter(function (StudentReturn $ret) use ($month) {
                if (! $month) {
                    return true;
                }

                // Pulang pada atau sebelum bulan penagihan
                return $ret->return_date && $ret->return_date->endOfMonth()->lte($month->endOfMonth());
            })
            ->count();

        return max(0, $total - $returnedCount);
    }

    /**
     * Otomatis perbarui status keberangkatan: jika seluruh siswa sudah pulang, status = completed.
     */
    public function syncStatusWithReturns(): void
    {
        if ($this->status === 'cancelled') {
            return;
        }

        $active = $this->activePeopleCount();
        if ($active === 0) {
            $this->update(['status' => 'completed']);
        } else {
            $this->update(['status' => 'managing']);
        }
    }
}
