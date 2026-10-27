-- ============================================================
-- INCOME — Coffee & Bakery
-- Database Schema & Initial Data
-- ============================================================

CREATE DATABASE IF NOT EXISTS `income_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `income_db`;

-- 1. Tabel Kategori Menu
DROP TABLE IF EXISTS `menu_items`;
DROP TABLE IF EXISTS `categories`;

CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(50) NOT NULL UNIQUE,
  `icon` VARCHAR(50) NOT NULL DEFAULT 'fa-mug-hot',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `sort_order`) VALUES
(1, 'Coffee', 'coffee', 'fa-mug-hot', 1),
(2, 'Bakery', 'bakery', 'fa-bread-slice', 2);

-- 2. Tabel Menu Items
CREATE TABLE `menu_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `price` VARCHAR(20) NOT NULL,
  `price_num` INT NOT NULL DEFAULT 0,
  `image` VARCHAR(255) NOT NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_menu_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `menu_items` (`category_id`, `name`, `price`, `price_num`, `image`, `is_available`, `sort_order`) VALUES
-- Coffee Items
(1, 'Gula Aren Latte', '45K', 45000, 'assets/img/gula_aren.jpg', 1, 1),
(1, 'Caramel Latte', '42K', 42000, 'assets/img/caramel.jpg', 1, 2),
(1, 'Espresso', '25K', 25000, 'assets/img/gula_aren.jpg', 1, 3),
(1, 'Americano', '28K', 28000, 'assets/img/caramel.jpg', 1, 4),
(1, 'Cappuccino', '35K', 35000, 'assets/img/gula_aren.jpg', 1, 5),
(1, 'Mocha', '38K', 38000, 'assets/img/caramel.jpg', 1, 6),
(1, 'Cold Brew', '33K', 33000, 'assets/img/gula_aren.jpg', 1, 7),
(1, 'Matcha Latte', '40K', 40000, 'assets/img/caramel.jpg', 1, 8),
-- Bakery Items
(2, 'Butter Croissant', '35K', 35000, 'assets/img/caramel.jpg', 1, 1),
(2, 'Almond Croissant', '42K', 42000, 'assets/img/gula_aren.jpg', 1, 2),
(2, 'Pain au Chocolat', '38K', 38000, 'assets/img/caramel.jpg', 1, 3),
(2, 'Banana Bread', '30K', 30000, 'assets/img/gula_aren.jpg', 1, 4),
(2, 'Cinnamon Roll', '32K', 32000, 'assets/img/caramel.jpg', 1, 5),
(2, 'Chocolate Cookie', '22K', 22000, 'assets/img/gula_aren.jpg', 1, 6),
(2, 'Sourdough Loaf', '55K', 55000, 'assets/img/caramel.jpg', 1, 7);

-- 3. Tabel Marquee Ticker
DROP TABLE IF EXISTS `ticker_items`;
CREATE TABLE `ticker_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `price` VARCHAR(20) NOT NULL,
  `is_down` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `ticker_items` (`name`, `price`, `is_down`, `sort_order`) VALUES
('Gula Aren', '45K', 0, 1),
('Croissant', '35K', 0, 2),
('Espresso', '25K', 1, 3),
('Sourdough', '55K', 0, 4),
('Cold Brew', '33K', 0, 5),
('Cinnamon Roll', '32K', 1, 6);

-- 4. Tabel Signature Products
DROP TABLE IF EXISTS `signatures`;
CREATE TABLE `signatures` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ledger_no` VARCHAR(20) NOT NULL,
  `label` VARCHAR(50) NOT NULL,
  `title_prefix` VARCHAR(50) NOT NULL,
  `title_accent` VARCHAR(50) NOT NULL,
  `chips` VARCHAR(100) NOT NULL,
  `price` VARCHAR(20) NOT NULL,
  `image` VARCHAR(255) NOT NULL,
  `category_name` VARCHAR(50) NOT NULL,
  `category_icon` VARCHAR(50) NOT NULL,
  `blurb` TEXT NOT NULL,
  `wa_order_text` VARCHAR(255) NOT NULL,
  `theme` ENUM('light', 'dark') NOT NULL DEFAULT 'light',
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `signatures` (`ledger_no`, `label`, `title_prefix`, `title_accent`, `chips`, `price`, `image`, `category_name`, `category_icon`, `blurb`, `wa_order_text`, `theme`, `sort_order`) VALUES
('No. 01', 'Signature Coffee', 'Gula Aren', 'Latte', 'Sweet,Creamy,Bold', '45K', 'assets/img/gula_aren.jpg', 'Coffee', 'fa-mug-hot', 'Palm sugar meets slow espresso. A little sweet, a little bold — the entry that opened the book.', 'Halo INCOME! Saya mau pesan Gula Aren Latte.', 'light', 1),
('No. 02', 'Signature Bakery', 'Butter', 'Croissant', 'Flaky,Warm,Buttery', '35K', 'assets/img/caramel.jpg', 'Bakery', 'fa-bread-slice', 'Laminated, baked, and gone before noon. Every batch is closed out while the oven is still warm.', 'Halo INCOME! Saya mau pesan Butter Croissant.', 'dark', 2);

-- 5. Tabel Testimonials
DROP TABLE IF EXISTS `testimonials`;
CREATE TABLE `testimonials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quote` TEXT NOT NULL,
  `author_name` VARCHAR(100) NOT NULL,
  `author_role` VARCHAR(100) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `testimonials` (`quote`, `author_name`, `author_role`, `sort_order`) VALUES
('“Best gula aren latte in Serang, hands down. I come back every weekend.”', 'Rizky', 'Mahasiswa', 1),
('“The croissant sells out fast — come early or cry. Trust me.”', 'Salsa', 'Content Creator', 2),
('“Tempat paling nyaman buat kerja. Kopinya konsisten, rotinya hangat.”', 'Bagus', 'Young Professional', 3);

-- 6. Tabel Pengaturan / Info Toko
DROP TABLE IF EXISTS `store_settings`;
CREATE TABLE `store_settings` (
  `setting_key` VARCHAR(50) PRIMARY KEY,
  `setting_value` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `store_settings` (`setting_key`, `setting_value`) VALUES
('store_name', 'INCOME'),
('tagline', 'A daily ledger of good things — coffee and bread, brewed and baked fresh.'),
('est_year', '2026'),
('city', 'Serang, Banten — Indonesia'),
('address', 'Serang, Banten — Indonesia'),
('opening_hours', '07.00 — 22.00'),
('phone', '+62 812-3456-7890'),
('whatsapp_url', 'https://wa.me/6281234567890?text=Halo%20INCOME!%20Saya%20mau%20pesan.'),
('maps_url', 'https://maps.google.com/?q=Serang+Banten+Indonesia'),
('maps_embed', 'https://maps.google.com/maps?q=Serang%2C%20Banten%2C%20Indonesia&z=13&output=embed'),
('instagram_url', 'https://www.instagram.com/'),
('tiktok_url', 'https://www.tiktok.com/');
