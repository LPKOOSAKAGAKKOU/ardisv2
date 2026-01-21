<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JobSectorSeeder extends Seeder
{
    public function run(): void
    {
        $jobSectors = [
            ['name_id' => 'Perawatan Lansia (Kaigo)', 'name_jp' => '介護 (かいご)', 'code' => 'KAIGO'],
            ['name_id' => 'Konstruksi', 'name_jp' => '建設 (けんせつ)', 'code' => 'CONST'],
            ['name_id' => 'Manufaktur', 'name_jp' => '製造業 (せいぞうぎょう)', 'code' => 'MANUF'],
            ['name_id' => 'Pertanian', 'name_jp' => '農業 (のうぎょう)', 'code' => 'AGRI'],
            ['name_id' => 'Perikanan', 'name_jp' => '漁業 (ぎょぎょう)', 'code' => 'FISH'],
            ['name_id' => 'Perhotelan', 'name_jp' => '宿泊業 (しゅくはくぎょう)', 'code' => 'HOTEL'],
            ['name_id' => 'Restoran dan Makanan', 'name_jp' => '外食業 (がいしょくぎょう)', 'code' => 'RESTO'],
            ['name_id' => 'Kebersihan Gedung', 'name_jp' => 'ビルクリーニング', 'code' => 'CLEAN'],
            ['name_id' => 'Pengolahan Makanan', 'name_jp' => '食品製造業 (しょくひんせいぞうぎょう)', 'code' => 'FOOD'],
            ['name_id' => 'Industri Mesin', 'name_jp' => '機械・金属加工 (きかい・きんぞくかこう)', 'code' => 'MACH'],
            ['name_id' => 'Industri Elektronik', 'name_jp' => '電気・電子情報関連産業 (でんき・でんしじょうほうかんれんさんぎょう)', 'code' => 'ELEC'],
            ['name_id' => 'Industri Otomotif', 'name_jp' => '自動車整備業 (じどうしゃせいびぎょう)', 'code' => 'AUTO'],
            ['name_id' => 'Penerbangan', 'name_jp' => '航空業 (こうくうぎょう)', 'code' => 'AVIA'],
            ['name_id' => 'Pelayaran', 'name_jp' => '造船・舶用工業 (ぞうせん・はくようこうぎょう)', 'code' => 'SHIP'],
        ];

        foreach ($jobSectors as $sector) {
            DB::table('job_sectors')->insert([
                'name_id' => $sector['name_id'],
                'name_jp' => $sector['name_jp'],
                'code' => $sector['code'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}