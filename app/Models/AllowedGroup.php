<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AllowedGroup extends Model
{
    use HasFactory;

    // Menentukan nama tabel secara eksplisit
    protected $table = 'allowed_groups';

    /**
     * Kolom yang dapat diisi (Mass Assignment)
     */
    protected $fillable = [
        'id_group_wa',
        'nama_group',
    ];

    /**
     * Jika Anda ingin menghubungkan grup ini dengan tabel Chat,
     * Anda bisa menambahkan relasi hasMany di sini.
     */
    public function chats()
    {
        // Relasi ke model Chat berdasarkan group_id (id_group_wa)
        return $this->hasMany(Chat::class, 'group_id', 'id_group_wa');
    }
}