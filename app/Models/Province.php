<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    // Jika nama tabel Anda 'provinces', Laravel otomatis mendeteksinya.
    // Tapi jika berbeda, definisikan di sini:
    // protected $table = 'nama_tabel_provinsi';

    protected $fillable = ['name'];
}