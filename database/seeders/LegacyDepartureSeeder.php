<?php

namespace Database\Seeders;

use App\Models\AcceptingOrganization;
use App\Models\Company;
use App\Models\Departure;
use Illuminate\Database\Seeder;

/**
 * Migrasi 13 data keberangkatan lama dari Excel "グロウイール請求書システム"
 * milik organisasi penerima Growwill (グローウイル事業協同組合).
 *
 * Idempoten: aman dijalankan ulang (tidak menggandakan data).
 */
class LegacyDepartureSeeder extends Seeder
{
    /**
     * [nama_perusahaan_jepang, tanggal_berangkat, jumlah_orang, biaya_tiket, catatan]
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

    public function run(): void
    {
        $organization = $this->resolveGrowwill();

        foreach ($this->rows as [$companyName, $date, $people, $travelCost, $notes]) {
            $company = Company::firstOrCreate(
                ['name_in_japanese' => $companyName],
                ['name' => $companyName, 'industry' => '技能実習'],
            );

            Departure::firstOrCreate(
                [
                    'accepting_organization_id' => $organization->id,
                    'company_name'              => $companyName,
                    'departure_date'            => $date,
                ],
                [
                    'company_id'   => $company->id,
                    'people_count' => $people,
                    'travel_cost'  => $travelCost,
                    'notes'        => $notes,
                    'status'       => 'managing',
                ],
            );
        }

        $this->command?->info('Berhasil migrasi ' . count($this->rows) . ' data keberangkatan ke organisasi: ' . $organization->name);
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
