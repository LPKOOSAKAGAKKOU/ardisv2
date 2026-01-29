<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Interview extends Model
{
    protected $fillable = [
        'interviewer_title',
        'company_id',
        'accepting_organization_id',
        'type',
        'description',
        'group_chat_link',
        'kyuujinhyou_yunerva_uuid',
        'interview_announcement_date',
        'interview_registration_deadline',
        'interview_date',
        'date_fly_to_japan',
        'ginou_1_34_uuid', 
        'ginou_1_10_uuid',
        'ginou_1_23_uuid',
        'ginou_1_23_req_uuid',
        'ginou_1_13_uuid',
        'ginou_4_8_uuid',
        'ginou_1_29_uuid',
        'stmt_jp_teacher_uuid',
        'stmt_kg_teacher_uuid',
        'cv_jp_teacher_uuid',
        'cv_kg_teacher_uuid',
        'schedule_detail_uuid',
    ];

    /**
     * Relasi ke Perusahaan (Kumiai/Perusahaan Jepang)
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Relasi ke Accepting Organization
     */
    public function acceptingOrganization(): BelongsTo
    {
        return $this->belongsTo(AcceptingOrganization::class);
    }

    /**
     * Relasi ke daftar siswa yang ikut interview ini
     */
    public function details(): HasMany
    {
        return $this->hasMany(InterviewDetail::class);
    }
}