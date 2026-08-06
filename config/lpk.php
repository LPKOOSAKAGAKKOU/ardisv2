<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Identitas LPK / SO
    |--------------------------------------------------------------------------
    |
    | Dipakai untuk mengisi kolom penyelenggara pada laporan resmi ke
    | Kemnaker (mis. Laporan Keberangkatan Peserta Magang Luar Negeri).
    | Nama harus ditulis kapital dan tidak disingkat, sesuai nama di SK.
    |
    */

    'name' => env('LPK_NAME', 'LPK OOSAKA GAKKOU'),

    // "LPK / SO" untuk penyelenggara dari SO, atau "LPK" saja.
    'provider_type' => env('LPK_PROVIDER_TYPE', 'LPK / SO'),

    // Negara tujuan pemagangan (kolom 12 laporan).
    'destination_country' => env('LPK_DESTINATION_COUNTRY', 'JEPANG'),
];
