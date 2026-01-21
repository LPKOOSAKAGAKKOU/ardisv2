<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MajorSeeder extends Seeder
{
    public function run(): void
    {
        $majors = [
            // Jurusan SMA
            ['name_id' => 'IPA (Ilmu Pengetahuan Alam)', 'name_jp' => '理系 (りけい)'],
            ['name_id' => 'IPS (Ilmu Pengetahuan Sosial)', 'name_jp' => '文系 (ぶんけい)'],
            ['name_id' => 'Bahasa', 'name_jp' => '語学 (ごがく)'],
            
            // Jurusan SMK - Teknologi dan Rekayasa
            ['name_id' => 'Teknik Konstruksi dan Properti', 'name_jp' => '建設・不動産技術 (けんせつ・ふどうさんぎじゅつ)'],
            ['name_id' => 'Teknik Geomatika', 'name_jp' => '測量技術 (そくりょうぎじゅつ)'],
            ['name_id' => 'Teknik Ketenagalistrikan', 'name_jp' => '電力技術 (でんりょくぎじゅつ)'],
            ['name_id' => 'Teknik Mesin', 'name_jp' => '機械技術 (きかいぎじゅつ)'],
            ['name_id' => 'Teknik Otomotif', 'name_jp' => '自動車技術 (じどうしゃぎじゅつ)'],
            ['name_id' => 'Teknik Elektronika', 'name_jp' => '電子技術 (でんしぎじゅつ)'],
            ['name_id' => 'Teknik Kimia', 'name_jp' => '化学技術 (かがくぎじゅつ)'],
            ['name_id' => 'Teknik Pesawat Udara', 'name_jp' => '航空機技術 (こうくうきぎじゅつ)'],
            ['name_id' => 'Teknik Perkapalan', 'name_jp' => '造船技術 (ぞうせんぎじゅつ)'],
            ['name_id' => 'Teknik Tekstil', 'name_jp' => '繊維技術 (せんいぎじゅつ)'],
            ['name_id' => 'Teknik Grafika', 'name_jp' => '印刷技術 (いんさつぎじゅつ)'],
            ['name_id' => 'Teknik Instrumentasi Industri', 'name_jp' => '産業計測技術 (さんぎょうけいそくぎじゅつ)'],
            
            // Jurusan SMK - Energi dan Pertambangan
            ['name_id' => 'Teknik Perminyakan', 'name_jp' => '石油技術 (せきゆぎじゅつ)'],
            ['name_id' => 'Geologi Pertambangan', 'name_jp' => '鉱業地質 (こうぎょうちしつ)'],
            ['name_id' => 'Teknik Energi Terbarukan', 'name_jp' => '再生可能エネルギー技術 (さいせいかのうエネルギーぎじゅつ)'],
            
            // Jurusan SMK - Teknologi Informasi dan Komunikasi
            ['name_id' => 'Teknik Komputer dan Jaringan', 'name_jp' => 'コンピュータネットワーク技術 (コンピュータネットワークぎじゅつ)'],
            ['name_id' => 'Rekayasa Perangkat Lunak', 'name_jp' => 'ソフトウェア開発 (ソフトウェアかいはつ)'],
            ['name_id' => 'Multimedia', 'name_jp' => 'マルチメディア'],
            ['name_id' => 'Sistem Informatika', 'name_jp' => '情報システム (じょうほうシステム)'],
            
            // Jurusan SMK - Kesehatan dan Pekerjaan Sosial
            ['name_id' => 'Asisten Keperawatan', 'name_jp' => '看護助手 (かんごじょしゅ)'],
            ['name_id' => 'Farmasi Klinis', 'name_jp' => '臨床薬学 (りんしょうやくがく)'],
            ['name_id' => 'Teknologi Laboratorium Medik', 'name_jp' => '医療検査技術 (いりょうけんさぎじゅつ)'],
            ['name_id' => 'Fisioterapi', 'name_jp' => '理学療法 (りがくりょうほう)'],
            ['name_id' => 'Dental Asisten', 'name_jp' => '歯科助手 (しかじょしゅ)'],
            ['name_id' => 'Perawatan Sosial', 'name_jp' => '社会福祉 (しゃかいふくし)'],
            
            // Jurusan SMK - Agribisnis dan Agroteknologi
            ['name_id' => 'Agribisnis Tanaman Pangan dan Hortikultura', 'name_jp' => '農業・園芸 (のうぎょう・えんげい)'],
            ['name_id' => 'Agribisnis Tanaman Perkebunan', 'name_jp' => 'プランテーション農業 (プランテーションのうぎょう)'],
            ['name_id' => 'Agribisnis Ternak Ruminansia', 'name_jp' => '畜産 (ちくさん)'],
            ['name_id' => 'Agribisnis Ternak Unggas', 'name_jp' => '家禽飼育 (かきんしいく)'],
            ['name_id' => 'Agribisnis Perikanan', 'name_jp' => '水産業 (すいさんぎょう)'],
            ['name_id' => 'Kehutanan', 'name_jp' => '林業 (りんぎょう)'],
            ['name_id' => 'Teknologi Pengolahan Hasil Pertanian', 'name_jp' => '農産物加工技術 (のうさんぶつかこうぎじゅつ)'],
            
            // Jurusan SMK - Kemaritiman
            ['name_id' => 'Pelayaran Kapal Penangkap Ikan', 'name_jp' => '漁船航海 (ぎょせんこうかい)'],
            ['name_id' => 'Pelayaran Kapal Niaga', 'name_jp' => '商船航海 (しょうせんこうかい)'],
            ['name_id' => 'Teknika Kapal Penangkap Ikan', 'name_jp' => '漁船機関 (ぎょせんきかん)'],
            ['name_id' => 'Teknika Kapal Niaga', 'name_jp' => '商船機関 (しょうせんきかん)'],
            
            // Jurusan SMK - Bisnis dan Manajemen
            ['name_id' => 'Bisnis Daring dan Pemasaran', 'name_jp' => 'オンラインビジネス・マーケティング (オンラインビジネス・マーケティング)'],
            ['name_id' => 'Akuntansi dan Keuangan Lembaga', 'name_jp' => '会計・金融 (かいけい・きんゆう)'],
            ['name_id' => 'Otomatisasi dan Tata Kelola Perkantoran', 'name_jp' => 'オフィス管理 (オフィスかんり)'],
            ['name_id' => 'Manajemen Logistik', 'name_jp' => '物流管理 (ぶつりゅうかんり)'],
            
            // Jurusan SMK - Pariwisata
            ['name_id' => 'Usaha Perjalanan Wisata', 'name_jp' => '観光旅行業 (かんこうりょこうぎょう)'],
            ['name_id' => 'Perhotelan', 'name_jp' => 'ホテル業 (ホテルぎょう)'],
            ['name_id' => 'Wisata Bahari dan Ekowisata', 'name_jp' => '海洋・エコツーリズム (かいよう・エコツーリズム)'],
            
            // Jurusan SMK - Seni dan Ekonomi Kreatif
            ['name_id' => 'Seni Rupa', 'name_jp' => '美術 (びじゅつ)'],
            ['name_id' => 'Desain Komunikasi Visual', 'name_jp' => 'ビジュアルコミュニケーションデザイン (ビジュアルコミュニケーションデザイン)'],
            ['name_id' => 'Desain Interior', 'name_jp' => 'インテリアデザイン (インテリアデザイン)'],
            ['name_id' => 'Animasi', 'name_jp' => 'アニメーション'],
            ['name_id' => 'Produksi Film dan Video', 'name_jp' => '映像制作 (えいぞうせいさく)'],
            ['name_id' => 'Broadcasting', 'name_jp' => '放送 (ほうそう)'],
            ['name_id' => 'Seni Musik', 'name_jp' => '音楽 (おんがく)'],
            ['name_id' => 'Seni Tari', 'name_jp' => '舞踊 (ぶよう)'],
            ['name_id' => 'Seni Teater', 'name_jp' => '演劇 (えんげき)'],
            ['name_id' => 'Seni Karawitan', 'name_jp' => 'ガムラン音楽 (ガムランおんがく)'],
            ['name_id' => 'Pedalangan', 'name_jp' => 'ワヤン (ワヤン)'],
            ['name_id' => 'Seni Peran', 'name_jp' => '演技 (えんぎ)'],
            
            // Jurusan SMK - Tata Boga dan Kuliner
            ['name_id' => 'Kuliner', 'name_jp' => '調理 (ちょうり)'],
            ['name_id' => 'Patiseri', 'name_jp' => '製菓 (せいか)'],
            
            // Jurusan SMK - Tata Busana
            ['name_id' => 'Tata Busana', 'name_jp' => 'ファッションデザイン (ファッションデザイン)'],
            
            // Jurusan SMK - Tata Kecantikan
            ['name_id' => 'Tata Kecantikan Kulit dan Rambut', 'name_jp' => '美容 (びよう)'],
            ['name_id' => 'Spa dan Beauty Therapy', 'name_jp' => 'スパ・ビューティーセラピー (スパ・ビューティーセラピー)'],
        ];

        foreach ($majors as $major) {
            DB::table('majors')->insert([
                'name_id' => $major['name_id'],
                'name_jp' => $major['name_jp'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}