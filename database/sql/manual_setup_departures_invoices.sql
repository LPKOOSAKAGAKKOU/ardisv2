-- =====================================================================
-- SETUP MANUAL: modul Data Keberangkatan & Data Penagihan
-- Jalankan SQL ini langsung di database (phpMyAdmin / Adminer / MySQL CLI)
-- jika `php artisan migrate` tidak bisa dijalankan.
--
-- Setelah SQL ini sukses, sisa satu perintah saja:
--   php artisan db:seed --class=LegacyDepartureSeeder
--
-- Aman untuk MySQL/MariaDB (utf8mb4, InnoDB, foreign key sesuai migration).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Tambah kolom tarif ke accepting_organizations
--    (migration 2026_06_05_000001)
-- ---------------------------------------------------------------------
ALTER TABLE `accepting_organizations`
    ADD COLUMN `pre_education_fee` INT UNSIGNED NOT NULL DEFAULT 15000 AFTER `pic_name`,
    ADD COLUMN `management_fee`    INT UNSIGNED NOT NULL DEFAULT 5000  AFTER `pre_education_fee`;

-- ---------------------------------------------------------------------
-- 2) Tabel departures (migration 2026_06_05_000002)
-- ---------------------------------------------------------------------
CREATE TABLE `departures` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `accepting_organization_id` BIGINT UNSIGNED NOT NULL,
    `company_id`   BIGINT UNSIGNED NULL,
    `interview_id` BIGINT UNSIGNED NULL,
    `company_name` VARCHAR(255) NOT NULL,
    `departure_date` DATE NOT NULL,
    `people_count` INT UNSIGNED NOT NULL DEFAULT 1,
    `travel_cost`  INT UNSIGNED NOT NULL DEFAULT 0,
    `pre_education_fee` INT UNSIGNED NULL,
    `management_fee`    INT UNSIGNED NULL,
    `notes` TEXT NULL,
    `status` ENUM('managing','completed','cancelled') NOT NULL DEFAULT 'managing',
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `departures_accepting_organization_id_foreign` (`accepting_organization_id`),
    KEY `departures_company_id_foreign` (`company_id`),
    KEY `departures_interview_id_foreign` (`interview_id`),
    CONSTRAINT `departures_accepting_organization_id_foreign`
        FOREIGN KEY (`accepting_organization_id`) REFERENCES `accepting_organizations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `departures_company_id_foreign`
        FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
    CONSTRAINT `departures_interview_id_foreign`
        FOREIGN KEY (`interview_id`) REFERENCES `interviews` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3) Tabel invoices (migration 2026_06_05_000003)
-- ---------------------------------------------------------------------
CREATE TABLE `invoices` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `accepting_organization_id` BIGINT UNSIGNED NOT NULL,
    `invoice_number` VARCHAR(255) NOT NULL,
    `issue_date`  DATE NOT NULL,
    `period_from` DATE NOT NULL,
    `period_to`   DATE NOT NULL,
    `total_amount` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `status` ENUM('draft','issued','paid') NOT NULL DEFAULT 'draft',
    `paid_at` DATE NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `invoices_invoice_number_unique` (`invoice_number`),
    KEY `invoices_accepting_organization_id_foreign` (`accepting_organization_id`),
    CONSTRAINT `invoices_accepting_organization_id_foreign`
        FOREIGN KEY (`accepting_organization_id`) REFERENCES `accepting_organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4) Tabel invoice_items (migration 2026_06_05_000004)
-- ---------------------------------------------------------------------
CREATE TABLE `invoice_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `invoice_id`   BIGINT UNSIGNED NOT NULL,
    `departure_id` BIGINT UNSIGNED NULL,
    `company_name` VARCHAR(255) NOT NULL,
    `description`  VARCHAR(255) NULL,
    `people`     INT UNSIGNED NOT NULL DEFAULT 1,
    `months`     INT UNSIGNED NOT NULL DEFAULT 3,
    `unit_price` INT UNSIGNED NOT NULL DEFAULT 0,
    `amount`     BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `invoice_items_invoice_id_foreign` (`invoice_id`),
    KEY `invoice_items_departure_id_foreign` (`departure_id`),
    CONSTRAINT `invoice_items_invoice_id_foreign`
        FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
    CONSTRAINT `invoice_items_departure_id_foreign`
        FOREIGN KEY (`departure_id`) REFERENCES `departures` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4b) Kolom tambahan invoice_items: jenis baris & daftar nama siswa
--     (migration 2026_06_05_000005). `kind`: management|travel|pre_education.
-- ---------------------------------------------------------------------
ALTER TABLE `invoice_items`
    ADD COLUMN `kind` VARCHAR(255) NOT NULL DEFAULT 'management' AFTER `departure_id`,
    ADD COLUMN `students` JSON NULL AFTER `description`;

-- ---------------------------------------------------------------------
-- 5) Tandai migration sebagai SUDAH dijalankan, supaya `php artisan migrate`
--    di kemudian hari tidak mencoba membuat tabel ini lagi.
--    Batch dihitung otomatis = batch terakhir + 1.
-- ---------------------------------------------------------------------
SET @next_batch = (SELECT COALESCE(MAX(batch), 0) + 1 FROM (SELECT batch FROM `migrations`) AS b);

INSERT INTO `migrations` (`migration`, `batch`) VALUES
    ('2026_06_05_000001_add_billing_fields_to_accepting_organizations_table', @next_batch),
    ('2026_06_05_000002_create_departures_table',                            @next_batch),
    ('2026_06_05_000003_create_invoices_table',                             @next_batch),
    ('2026_06_05_000004_create_invoice_items_table',                        @next_batch),
    ('2026_06_05_000005_add_kind_students_to_invoice_items_table',          @next_batch);
