<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\ProvinceSeeder;
use Database\Seeders\JobSectorSeeder;
use Database\Seeders\MajorSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            ProvinceSeeder::class,
            JobSectorSeeder::class,
            MajorSeeder::class,
        ]);
    }
}
