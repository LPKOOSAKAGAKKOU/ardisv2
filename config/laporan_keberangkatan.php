<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Terjemahan istilah Jepang -> Indonesia untuk laporan Kemnaker
    |--------------------------------------------------------------------------
    |
    | `companies.industry` dan `companies.prefecture` disimpan dalam kanji
    | (nilai dropdown pada form perusahaan), sedangkan laporan keberangkatan
    | harus berbahasa Indonesia / huruf latin. Peta di bawah menjembataninya.
    |
    | `name`  -> kolom 14 (KBJI) & 24 (Sub Jenis Kerja)
    | `group` -> kolom 23 (Kelompok Jenis Kerja)
    |
    | Silakan sesuaikan bila Kemnaker memakai istilah yang berbeda; nilai yang
    | tidak ada di peta akan ditulis apa adanya (kapital).
    |
    */

    /*
    | Jenjang pendidikan (`student_educations.level`) juga tersimpan dalam
    | kanji. Pendidikan terakhir dipilih dari tanggal kelulusan terbaru, dengan
    | `rank` hanya sebagai pemecah seri bila tanggalnya sama atau kosong. Jenjang
    | baru (D3, S2, dsb.) cukup ditambahkan di sini tanpa mengubah kode; yang
    | belum terdaftar pun tetap terbaca dan ditulis apa adanya.
    */
    'educations' => [
        '小学校' => ['name' => 'SD', 'rank' => 1],
        '中学校' => ['name' => 'SMP', 'rank' => 2],
        '高校'  => ['name' => 'SMA/SMK', 'rank' => 3],
        '大学'  => ['name' => 'S1', 'rank' => 4],
    ],

    'job_types' => [

        // PERTANIAN
        '耕種農業'               => ['name' => 'PERTANIAN TANAMAN', 'group' => 'PERTANIAN'],
        '畜産農業'               => ['name' => 'PETERNAKAN', 'group' => 'PERTANIAN'],

        // PERIKANAN
        '漁船漁業'               => ['name' => 'PERIKANAN KAPAL', 'group' => 'PERIKANAN'],
        '養殖業'                => ['name' => 'BUDIDAYA PERIKANAN', 'group' => 'PERIKANAN'],

        // KONSTRUKSI
        'さく井'                => ['name' => 'PENGEBORAN SUMUR', 'group' => 'KONSTRUKSI'],
        '建築板金'               => ['name' => 'PELAT LOGAM BANGUNAN', 'group' => 'KONSTRUKSI'],
        '冷凍空調機器施工'           => ['name' => 'PEMASANGAN AC DAN MESIN PENDINGIN', 'group' => 'KONSTRUKSI'],
        '建具製作'               => ['name' => 'PERANGKAT BANGUNAN', 'group' => 'KONSTRUKSI'],
        '建築大工'               => ['name' => 'TUKANG KAYU', 'group' => 'KONSTRUKSI'],
        '型枠施工'               => ['name' => 'PEKERJAAN BEKISTING', 'group' => 'KONSTRUKSI'],
        '鉄筋施工'               => ['name' => 'PEKERJAAN TULANGAN', 'group' => 'KONSTRUKSI'],
        'とび'                 => ['name' => 'PERANCAH BANGUNAN', 'group' => 'KONSTRUKSI'],
        '石材施工'               => ['name' => 'PEKERJAAN BATU', 'group' => 'KONSTRUKSI'],
        'タイル張り'              => ['name' => 'PEMASANGAN UBIN', 'group' => 'KONSTRUKSI'],
        'かわらぶき'              => ['name' => 'PEMASANGAN GENTENG', 'group' => 'KONSTRUKSI'],
        '左官'                 => ['name' => 'PLESTERAN', 'group' => 'KONSTRUKSI'],
        '配管'                 => ['name' => 'PEMASANGAN PIPA', 'group' => 'KONSTRUKSI'],
        '熱絶縁施工'              => ['name' => 'PEKERJAAN ISOLASI PANAS', 'group' => 'KONSTRUKSI'],
        '内装仕上げ施工'            => ['name' => 'PENYELESAIAN INTERIOR', 'group' => 'KONSTRUKSI'],
        'サッシ施工'              => ['name' => 'PEMASANGAN KUSEN ALUMINIUM', 'group' => 'KONSTRUKSI'],
        '防水施工'               => ['name' => 'PEKERJAAN KEDAP AIR', 'group' => 'KONSTRUKSI'],
        'コンクリート圧送施工'         => ['name' => 'PENGECORAN BETON', 'group' => 'KONSTRUKSI'],
        'ウェルポイント施工'          => ['name' => 'PEKERJAAN WELL POINT', 'group' => 'KONSTRUKSI'],
        '表装'                 => ['name' => 'PEMASANGAN WALLPAPER', 'group' => 'KONSTRUKSI'],
        '建設機械施工'             => ['name' => 'OPERATOR ALAT BERAT KONSTRUKSI', 'group' => 'KONSTRUKSI'],
        '畳製作'                => ['name' => 'PEMBUATAN TATAMI', 'group' => 'KONSTRUKSI'],

        // PENGOLAHAN MAKANAN
        '缶詰巻締'               => ['name' => 'PENYEGELAN KALENG', 'group' => 'PENGOLAHAN MAKANAN'],
        '食鳥処理加工業'            => ['name' => 'PENGOLAHAN UNGGAS', 'group' => 'PENGOLAHAN MAKANAN'],
        '加熱性水産加工'            => ['name' => 'PENGOLAHAN HASIL LAUT DENGAN PEMANASAN', 'group' => 'PENGOLAHAN MAKANAN'],
        '非加熱性水産加工'           => ['name' => 'PENGOLAHAN HASIL LAUT TANPA PEMANASAN', 'group' => 'PENGOLAHAN MAKANAN'],
        '水産練り製品製造'           => ['name' => 'OLAHAN IKAN GILING', 'group' => 'PENGOLAHAN MAKANAN'],
        '牛豚食肉処理加工業'          => ['name' => 'PENGOLAHAN DAGING SAPI DAN BABI', 'group' => 'PENGOLAHAN MAKANAN'],
        'ハム・ソーセージ・ベーコン製造'    => ['name' => 'PEMBUATAN HAM, SOSIS, DAN BACON', 'group' => 'PENGOLAHAN MAKANAN'],
        'パン製造'               => ['name' => 'PEMBUATAN ROTI', 'group' => 'PENGOLAHAN MAKANAN'],
        'そう菜製造業'             => ['name' => 'MAKANAN SIAP SAJI', 'group' => 'PENGOLAHAN MAKANAN'],
        '農産物漬物製造業'           => ['name' => 'INDUSTRI ACAR', 'group' => 'PENGOLAHAN MAKANAN'],
        '医療・福祉施設給食製造'        => ['name' => 'PENYEDIAAN MAKANAN FASILITAS MEDIS', 'group' => 'PENGOLAHAN MAKANAN'],

        // TEKSTIL DAN PAKAIAN
        '紡績運転'               => ['name' => 'PEMINTALAN', 'group' => 'TEKSTIL DAN PAKAIAN'],
        '織布運転'               => ['name' => 'TENUN', 'group' => 'TEKSTIL DAN PAKAIAN'],
        '染色'                 => ['name' => 'PEWARNAAN KAIN', 'group' => 'TEKSTIL DAN PAKAIAN'],
        'ニット製品製造'            => ['name' => 'BARANG RAJUTAN', 'group' => 'TEKSTIL DAN PAKAIAN'],
        'たて編ニット生地製造'         => ['name' => 'PEMBUATAN KAIN RAJUT LUSI', 'group' => 'TEKSTIL DAN PAKAIAN'],
        '婦人子供服製造'            => ['name' => 'PAKAIAN WANITA & ANAK', 'group' => 'TEKSTIL DAN PAKAIAN'],
        '紳士服製造'              => ['name' => 'PAKAIAN PRIA', 'group' => 'TEKSTIL DAN PAKAIAN'],
        '下着類製造'              => ['name' => 'PAKAIAN DALAM', 'group' => 'TEKSTIL DAN PAKAIAN'],
        '寝具製作'               => ['name' => 'ALAT TIDUR', 'group' => 'TEKSTIL DAN PAKAIAN'],
        'カーペット製造'            => ['name' => 'PEMBUATAN KARPET', 'group' => 'TEKSTIL DAN PAKAIAN'],
        '帆布製品製造'             => ['name' => 'PRODUK KANVAS', 'group' => 'TEKSTIL DAN PAKAIAN'],
        '布はく縫製'              => ['name' => 'PENJAHITAN TENUN', 'group' => 'TEKSTIL DAN PAKAIAN'],
        '座席シート縫製'            => ['name' => 'PENJAHITAN JOK', 'group' => 'TEKSTIL DAN PAKAIAN'],

        // MANUFAKTUR
        '鋳造'                 => ['name' => 'PENGECORAN', 'group' => 'MANUFAKTUR'],
        '鍛造'                 => ['name' => 'PENEMPAAN', 'group' => 'MANUFAKTUR'],
        'ダイカスト'              => ['name' => 'PENGECORAN CETAK TEKAN', 'group' => 'MANUFAKTUR'],
        '機械加工'               => ['name' => 'PEMROSESAN MESIN', 'group' => 'MANUFAKTUR'],
        '金属プレス加工'            => ['name' => 'PENGEPRESAN LOGAM', 'group' => 'MANUFAKTUR'],
        '鉄工'                 => ['name' => 'PEKERJAAN BESI', 'group' => 'MANUFAKTUR'],
        '工場板金'               => ['name' => 'PELAT LOGAM PABRIK', 'group' => 'MANUFAKTUR'],
        'めっき'                => ['name' => 'PELAPISAN LOGAM', 'group' => 'MANUFAKTUR'],
        'アルミニウム陽極酸化処理'       => ['name' => 'ANODISASI ALUMINIUM', 'group' => 'MANUFAKTUR'],
        '仕上げ'                => ['name' => 'PENYELESAIAN AKHIR LOGAM', 'group' => 'MANUFAKTUR'],
        '機械検査'               => ['name' => 'PEMERIKSAAN MESIN', 'group' => 'MANUFAKTUR'],
        '機械保全'               => ['name' => 'PEMELIHARAAN MESIN', 'group' => 'MANUFAKTUR'],
        '電子機器組立て'            => ['name' => 'PERAKITAN ELEKTRONIK', 'group' => 'MANUFAKTUR'],
        '電気機器組立て'            => ['name' => 'PERAKITAN LISTRIK', 'group' => 'MANUFAKTUR'],
        'プリント配線板製造'          => ['name' => 'PEMBUATAN PAPAN SIRKUIT CETAK', 'group' => 'MANUFAKTUR'],
        'アルミニウム圧延・押出製品製造'    => ['name' => 'PENGEROLAN DAN EKSTRUSI ALUMINIUM', 'group' => 'MANUFAKTUR'],
        '金属熱処理業'             => ['name' => 'PERLAKUAN PANAS LOGAM', 'group' => 'MANUFAKTUR'],
        '家具製作'               => ['name' => 'FURNITUR', 'group' => 'MANUFAKTUR'],
        '印刷'                 => ['name' => 'PERCETAKAN', 'group' => 'MANUFAKTUR'],
        '製本'                 => ['name' => 'PENJILIDAN', 'group' => 'MANUFAKTUR'],
        'プラスチック成形'           => ['name' => 'PEMBENTUKAN PLASTIK', 'group' => 'MANUFAKTUR'],
        '強化プラスチック成形'         => ['name' => 'PLASTIK DIPERKUAT', 'group' => 'MANUFAKTUR'],
        '塗装'                 => ['name' => 'PENGECATAN', 'group' => 'MANUFAKTUR'],
        '溶接'                 => ['name' => 'PENGELASAN', 'group' => 'MANUFAKTUR'],
        '工業包装'               => ['name' => 'PENGEMASAN INDUSTRI', 'group' => 'MANUFAKTUR'],
        '紙器・段ボール箱製造'         => ['name' => 'KOTAK KARTON', 'group' => 'MANUFAKTUR'],
        '陶磁器工業製品製造'          => ['name' => 'PRODUK KERAMIK', 'group' => 'MANUFAKTUR'],

        // JASA
        '自動車整備'              => ['name' => 'PERAWATAN MOBIL', 'group' => 'JASA'],
        'ビルクリーニング'           => ['name' => 'PEMBERSIHAN GEDUNG', 'group' => 'JASA'],
        '介護'                 => ['name' => 'PERAWATAN LANSIA (KAIGO)', 'group' => 'JASA'],
        'リネンサプライ'            => ['name' => 'PENYEDIAAN LINEN', 'group' => 'JASA'],

        // MANUFAKTUR
        'コンクリート製品製造'         => ['name' => 'PRODUK BETON', 'group' => 'MANUFAKTUR'],

        // JASA
        '宿泊'                 => ['name' => 'PERHOTELAN', 'group' => 'JASA'],

        // MANUFAKTUR
        'RPF製造'              => ['name' => 'PEMBUATAN BAHAN BAKAR PADAT (RPF)', 'group' => 'MANUFAKTUR'],

        // JASA
        '産業洗浄業務'             => ['name' => 'PENCUCIAN INDUSTRI', 'group' => 'JASA'],

        // MANUFAKTUR
        'ゴム製品製造'             => ['name' => 'PRODUK KARET', 'group' => 'MANUFAKTUR'],

        // JASA
        '鉄道車両整備'             => ['name' => 'PERAWATAN KERETA API', 'group' => 'JASA'],

        // MANUFAKTUR
        '木材加工'               => ['name' => 'PEMROSESAN KAYU', 'group' => 'MANUFAKTUR'],

        // JASA
        '空港グランドハンドリング（社内検定）' => ['name' => 'PENANGANAN DARAT BANDARA', 'group' => 'JASA'],
        'ボイラーメンテナンス（社内検定）'   => ['name' => 'PEMELIHARAAN BOILER', 'group' => 'JASA'],
    ],

    'prefectures' => [
        '北海道' => 'HOKKAIDO',
        '青森県' => 'AOMORI',
        '岩手県' => 'IWATE',
        '宮城県' => 'MIYAGI',
        '秋田県' => 'AKITA',
        '山形県' => 'YAMAGATA',
        '福島県' => 'FUKUSHIMA',
        '茨城県' => 'IBARAKI',
        '栃木県' => 'TOCHIGI',
        '群馬県' => 'GUNMA',
        '埼玉県' => 'SAITAMA',
        '千葉県' => 'CHIBA',
        '東京都' => 'TOKYO',
        '神奈川県' => 'KANAGAWA',
        '新潟県' => 'NIIGATA',
        '富山県' => 'TOYAMA',
        '石川県' => 'ISHIKAWA',
        '福井県' => 'FUKUI',
        '山梨県' => 'YAMANASHI',
        '長野県' => 'NAGANO',
        '岐阜県' => 'GIFU',
        '静岡県' => 'SHIZUOKA',
        '愛知県' => 'AICHI',
        '三重県' => 'MIE',
        '滋賀県' => 'SHIGA',
        '京都府' => 'KYOTO',
        '大阪府' => 'OSAKA',
        '兵庫県' => 'HYOGO',
        '奈良県' => 'NARA',
        '和歌山県' => 'WAKAYAMA',
        '鳥取県' => 'TOTTORI',
        '島根県' => 'SHIMANE',
        '岡山県' => 'OKAYAMA',
        '広島県' => 'HIROSHIMA',
        '山口県' => 'YAMAGUCHI',
        '徳島県' => 'TOKUSHIMA',
        '香川県' => 'KAGAWA',
        '愛媛県' => 'EHIME',
        '高知県' => 'KOCHI',
        '福岡県' => 'FUKUOKA',
        '佐賀県' => 'SAGA',
        '長崎県' => 'NAGASAKI',
        '熊本県' => 'KUMAMOTO',
        '大分県' => 'OITA',
        '宮崎県' => 'MIYAZAKI',
        '鹿児島県' => 'KAGOSHIMA',
        '沖縄県' => 'OKINAWA',
    ],
];
