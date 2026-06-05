<?php

namespace Database\Seeders;

use App\Models\AcceptingOrganization;
use App\Models\Company;
use App\Models\Departure;
use App\Models\Interview;
use App\Models\InterviewDetail;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Migrasi 13 data keberangkatan lama dari Excel "グロウイール請求書システム"
 * milik organisasi penerima Growwill (グローウイル事業協同組合).
 *
 * Selain keberangkatan, seeder ini juga membuat:
 *  - Data siswa (User role=student + StudentProfile) dari nama-nama di kolom 備考.
 *  - Data wawancara (Interview) per keberangkatan + pesertanya (InterviewDetail).
 *  - Menautkan keberangkatan -> interview, sehingga daftar siswa keberangkatan
 *    terbaca dari peserta interview yang lulus.
 *
 * Field siswa diisi placeholder seperlunya (yang penting nama) dan bisa
 * diedit manual lewat halaman manajemen siswa.
 *
 * Idempoten: aman dijalankan ulang (tidak menggandakan data).
 */
class LegacyDepartureSeeder extends Seeder
{
    /**
     * [nama_perusahaan_jepang, tanggal_berangkat, jumlah_orang, biaya_tiket, catatan/nama_siswa]
     */
    private array $rows = [
        ['株式会社匠建',           '2025-05-10', 2, 32000, 'BIMO, NURUL'],
        ['医療法人豊生会',         '2025-06-02', 2, 30000, 'DEWI NIHA, NOVIA'],
        ['株式会社GLAD',           '2025-08-26', 1, 30000, 'FIO LETA'],
        ['株式会社川端組',         '2025-10-01', 1, 30000, 'DIMAS BAMBANG'],
        ['株式会社イワブチ工業',   '2025-10-27', 1, 30000, 'EKSAN, BAGUS, RIZKI'],
        ['JUN TECH',               '2025-10-28', 1, 30000, 'FALAH'],
        ['株式会社Aoi',            '2025-11-11', 3, 30000, 'ANDRE, FIRMAN, DAVID'],
        ['株式会社ORRES',          '2025-11-14', 4, 30000, 'SITI, LAILA, FINA, ICHA'],
        ['株式会社YUUSHIN',        '2025-11-30', 1, 30000, 'HILMI'],
        ['株式会社WAGO',           '2026-01-08', 2, 30000, 'HUDA, ROJAK'],
        ['株式会社松栄テクノ １期生', '2026-02-09', 1, 30000, 'SALIS'],
        ['株式会社オアシス',       '2026-02-25', 2, 20000, 'LURIA, DILA'],
        ['株式会社タイセイ',       '2026-04-11', 4, 30000, 'HILAL, ZAKKI, LEO, KEVIN'],
    ];

    private int $studentSeq = 0;

    public function run(): void
    {
        $organization = $this->resolveGrowwill();

        foreach ($this->rows as [$companyName, $date, $people, $travelCost, $notes]) {
            $company = Company::firstOrCreate(
                ['name_in_japanese' => $companyName],
                ['name' => $companyName, 'industry' => '技能実習'],
            );

            $interview = Interview::firstOrCreate(
                [
                    'company_id'                => $company->id,
                    'accepting_organization_id' => $organization->id,
                    'interview_date'            => $date,
                ],
                [
                    'interviewer_title' => $companyName,
                    'type'              => 'ginoujisshuu',
                    'description'       => 'Migrasi data wawancara lama (legacy).',
                    'date_fly_to_japan' => $date,
                ],
            );

            $this->seedStudents($interview, $notes);

            $departure = Departure::firstOrCreate(
                [
                    'accepting_organization_id' => $organization->id,
                    'company_name'              => $companyName,
                    'departure_date'            => $date,
                ],
                [
                    'company_id'   => $company->id,
                    'interview_id' => $interview->id,
                    'people_count' => $people,
                    'travel_cost'  => $travelCost,
                    'notes'        => $notes,
                    'status'       => 'managing',
                ],
            );

            // Pastikan keberangkatan lama tetap tertaut ke interview-nya.
            if (! $departure->interview_id) {
                $departure->update(['interview_id' => $interview->id]);
            }
        }

        $this->command?->info('Berhasil migrasi ' . count($this->rows) . ' keberangkatan + siswa + wawancara ke organisasi: ' . $organization->name);
    }

    /**
     * Buat siswa (User + StudentProfile) dari daftar nama di kolom catatan,
     * lalu daftarkan sebagai peserta interview yang lulus.
     */
    private function seedStudents(Interview $interview, ?string $notes): void
    {
        $names = collect(explode(',', (string) $notes))
            ->map(fn ($n) => trim($n))
            ->filter()
            ->values();

        foreach ($names as $order => $name) {
            $this->studentSeq++;

            $email = 'legacy' . $this->studentSeq . '@ardis.local';

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name'     => $name,
                    'role'     => 'student',
                    'password' => Hash::make(Str::random(16)),
                ],
            );

            StudentProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'nik'             => 'LEGACY' . str_pad((string) $this->studentSeq, 4, '0', STR_PAD_LEFT),
                    'full_name'       => $name,
                    'pob'             => '-',
                    'pob_province'    => '-',
                    'dob'             => '2000-01-01',
                    'gender'          => 'Laki-laki',
                    'address_ktp'     => '-',
                    'phone_student'   => '-',
                    'phone_parent'    => '-',
                    'tattoo'          => 'tidak',
                    'smoking'         => 'tidak merokok',
                    'alcohol'         => 'tidak minum',
                    'family_in_japan' => 'tidak',
                    'height'          => 0,
                    'weight'          => 0,
                    'blood_type'      => 'O',
                    'religion'        => 'Islam',
                    'marital_status'  => 'Belum Menikah',
                    'tbc_history'     => 'tidak',
                    'color_blind'     => 'normal',
                    'has_passport'    => 'tidak',
                ],
            );

            InterviewDetail::firstOrCreate(
                ['interview_id' => $interview->id, 'user_id' => $user->id],
                ['order_number' => $order + 1, 'result' => 'passed'],
            );
        }
    }

    private function resolveGrowwill(): AcceptingOrganization
    {
        $org = AcceptingOrganization::query()
            ->where('name', 'like', '%GROWWILL BUSSINESS COOPERATIVE%')
            ->orWhere('name', 'like', '%Growwill%')
            ->orWhere('name_in_japanese', 'like', '%グローウイル%')
            ->orWhere('name_in_japanese', 'like', '%グロウイール%')
            ->first();

        if ($org) {
            return $org;
        }

        return AcceptingOrganization::create([
            'name'              => 'Growwill',
            'name_in_japanese'  => 'グローウイル事業協同組合',
            'type'              => 'kanri_dantai',
            'pre_education_fee' => 15000,
            'management_fee'    => 5000,
        ]);
    }
}
