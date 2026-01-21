<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProvinceSeeder extends Seeder
{
    public function run(): void
    {
        $provinces = [
            ['name_id' => 'Aceh', 'name_jp' => 'アチェ'],
            ['name_id' => 'Sumatera Utara', 'name_jp' => '北スマトラ'],
            ['name_id' => 'Sumatera Barat', 'name_jp' => '西スマトラ'],
            ['name_id' => 'Riau', 'name_jp' => 'リアウ'],
            ['name_id' => 'Kepulauan Riau', 'name_jp' => 'リアウ諸島'],
            ['name_id' => 'Jambi', 'name_jp' => 'ジャンビ'],
            ['name_id' => 'Sumatera Selatan', 'name_jp' => '南スマトラ'],
            ['name_id' => 'Bangka Belitung', 'name_jp' => 'バンカ・ブリトゥン'],
            ['name_id' => 'Bengkulu', 'name_jp' => 'ブンクル'],
            ['name_id' => 'Lampung', 'name_jp' => 'ランプン'],
            ['name_id' => 'DKI Jakarta', 'name_jp' => 'ジャカルタ首都特別州'],
            ['name_id' => 'Banten', 'name_jp' => 'バンテン'],
            ['name_id' => 'Jawa Barat', 'name_jp' => '西ジャワ'],
            ['name_id' => 'Jawa Tengah', 'name_jp' => '中部ジャワ'],
            ['name_id' => 'DI Yogyakarta', 'name_jp' => 'ジョグジャカルタ特別州'],
            ['name_id' => 'Jawa Timur', 'name_jp' => '東ジャワ'],
            ['name_id' => 'Bali', 'name_jp' => 'バリ'],
            ['name_id' => 'Nusa Tenggara Barat', 'name_jp' => '西ヌサトゥンガラ'],
            ['name_id' => 'Nusa Tenggara Timur', 'name_jp' => '東ヌサトゥンガラ'],
            ['name_id' => 'Kalimantan Barat', 'name_jp' => '西カリマンタン'],
            ['name_id' => 'Kalimantan Tengah', 'name_jp' => '中部カリマンタン'],
            ['name_id' => 'Kalimantan Selatan', 'name_jp' => '南カリマンタン'],
            ['name_id' => 'Kalimantan Timur', 'name_jp' => '東カリマンタン'],
            ['name_id' => 'Kalimantan Utara', 'name_jp' => '北カリマンタン'],
            ['name_id' => 'Sulawesi Utara', 'name_jp' => '北スラウェシ'],
            ['name_id' => 'Gorontalo', 'name_jp' => 'ゴロンタロ'],
            ['name_id' => 'Sulawesi Tengah', 'name_jp' => '中部スラウェシ'],
            ['name_id' => 'Sulawesi Barat', 'name_jp' => '西スラウェシ'],
            ['name_id' => 'Sulawesi Selatan', 'name_jp' => '南スラウェシ'],
            ['name_id' => 'Sulawesi Tenggara', 'name_jp' => '南東スラウェシ'],
            ['name_id' => 'Maluku', 'name_jp' => 'マルク'],
            ['name_id' => 'Maluku Utara', 'name_jp' => '北マルク'],
            ['name_id' => 'Papua', 'name_jp' => 'パプア'],
            ['name_id' => 'Papua Barat', 'name_jp' => '西パプア'],
            ['name_id' => 'Papua Tengah', 'name_jp' => '中部パプア'],
            ['name_id' => 'Papua Pegunungan', 'name_jp' => 'パプア山地'],
            ['name_id' => 'Papua Selatan', 'name_jp' => '南パプア'],
            ['name_id' => 'Papua Barat Daya', 'name_jp' => '南西パプア'],
        ];

        foreach ($provinces as $province) {
            DB::table('provinces')->insert([
                'name_id' => $province['name_id'],
                'name_jp' => $province['name_jp'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}