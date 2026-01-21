<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobSector extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_id', 
        'name_jp', 
        'code'
    ];
}