-- ========================================================
-- INCOME Coffee & Bakery — Production SQL Schema (PRD & ERD)
-- Multi-Branch Dine-in System with QR, Redis Cache & Gateways
-- ========================================================

CREATE DATABASE IF NOT EXISTS `income_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `income_db`;

-- 1. USERS & AUTH
DROP TABLE IF EXISTS `refunds`;
DROP TABLE IF EXISTS `speaker_announcements`;
DROP TABLE IF EXISTS `cancellation_requests`;
DROP TABLE IF EXISTS `order_status_history`;
DROP TABLE IF EXISTS `payment_webhook_events`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `order_item_options`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `branch_products`;
DROP TABLE IF EXISTS `product_options`;
DROP TABLE IF EXISTS `product_option_groups`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `staff_branch_assignments`;
DROP TABLE IF EXISTS `dining_tables`;
DROP TABLE IF EXISTS `branches`;
DROP TABLE IF EXISTS `otp_verifications`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `ticker_items`;
DROP TABLE IF EXISTS `testimonials`;

CREATE TABLE `users` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `whatsapp_number` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `role` ENUM('customer', 'cashier', 'admin') NOT NULL DEFAULT 'customer',
  `password_hash` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `otp_verifications` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `whatsapp_number` VARCHAR(20) NOT NULL,
  `otp_hash` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `is_used` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_otp_lookup` (`whatsapp_number`, `is_used`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BRANCHES & DINING TABLES
CREATE TABLE `branches` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `is_open` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `dining_tables` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `branch_id` BIGINT NOT NULL,
  `table_code` VARCHAR(20) NOT NULL,
  `qr_token` VARCHAR(64) NOT NULL UNIQUE,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tables_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  INDEX `idx_table_branch` (`branch_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `staff_branch_assignments` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `branch_id` BIGINT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_staff_branch` (`user_id`, `branch_id`),
  CONSTRAINT `fk_staff_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_staff_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. MENU & CATALOG
CREATE TABLE `categories` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(50) NOT NULL UNIQUE,
  `icon` VARCHAR(50) NOT NULL DEFAULT 'fa-mug-hot',
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `category_id` BIGINT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `image` VARCHAR(255) NOT NULL,
  `base_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `is_signature` TINYINT(1) NOT NULL DEFAULT 0,
  `signature_badge` VARCHAR(50) NULL,
  `signature_chips` VARCHAR(100) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  INDEX `idx_product_cat` (`category_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_option_groups` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `product_id` BIGINT NULL,
  `category_id` BIGINT NULL,
  `name` VARCHAR(50) NOT NULL,
  `is_required` TINYINT(1) NOT NULL DEFAULT 0,
  `min_selection` INT NOT NULL DEFAULT 0,
  `max_selection` INT NOT NULL DEFAULT 1,
  INDEX `idx_pog_target` (`product_id`, `category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_options` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `option_group_id` BIGINT NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `price_adjustment` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_po_group` FOREIGN KEY (`option_group_id`) REFERENCES `product_option_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `branch_products` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `branch_id` BIGINT NOT NULL,
  `product_id` BIGINT NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY `uk_branch_product` (`branch_id`, `product_id`),
  CONSTRAINT `fk_bp_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ORDERS & ORDER ITEMS (IMMUTABLE SNAPSHOTS)
CREATE TABLE `orders` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` BIGINT NOT NULL,
  `branch_id` BIGINT NOT NULL,
  `dining_table_id` BIGINT NOT NULL,
  `customer_name_snapshot` VARCHAR(100) NOT NULL,
  `order_status` ENUM('pending_payment', 'placed', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'placed',
  `payment_status` ENUM('pending', 'paid', 'failed', 'expired', 'refund_pending', 'refunded', 'partially_refunded') NOT NULL DEFAULT 'pending',
  `subtotal` DECIMAL(12, 2) NOT NULL,
  `tax_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_order_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_order_table` FOREIGN KEY (`dining_table_id`) REFERENCES `dining_tables` (`id`),
  INDEX `idx_order_branch_status` (`branch_id`, `order_status`, `created_at`),
  INDEX `idx_order_user` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT NOT NULL,
  `product_id` BIGINT NOT NULL,
  `product_name_snapshot` VARCHAR(100) NOT NULL,
  `unit_price` DECIMAL(12, 2) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  `notes` VARCHAR(255) NULL,
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_item_options` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_item_id` BIGINT NOT NULL,
  `option_id` BIGINT NULL,
  `group_name_snapshot` VARCHAR(50) NOT NULL,
  `option_name_snapshot` VARCHAR(50) NOT NULL,
  `price_adjustment` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_oio_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. PAYMENTS & GATEWAY EVENTS
CREATE TABLE `payments` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT NOT NULL,
  `method` VARCHAR(30) NOT NULL,
  `provider` VARCHAR(50) NOT NULL,
  `provider_transaction_id` VARCHAR(100) NULL UNIQUE,
  `amount` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('pending', 'paid', 'failed', 'expired', 'refund_pending', 'refunded', 'partially_refunded') NOT NULL DEFAULT 'pending',
  `payment_url` VARCHAR(255) NULL,
  `qr_string` TEXT NULL,
  `va_number` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  INDEX `idx_payment_status` (`order_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payment_webhook_events` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `payment_id` BIGINT NULL,
  `provider_event_id` VARCHAR(100) NOT NULL UNIQUE,
  `event_type` VARCHAR(50) NOT NULL,
  `payload` TEXT NOT NULL,
  `processed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pwe_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ORDER STATUS AUDIT TRAIL
CREATE TABLE `order_status_history` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT NOT NULL,
  `changed_by` BIGINT NULL,
  `old_status` VARCHAR(50) NOT NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_osh_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. CANCELLATION & REFUNDS
CREATE TABLE `cancellation_requests` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT NOT NULL,
  `requested_by` BIGINT NOT NULL,
  `decided_by` BIGINT NULL,
  `reason` TEXT NOT NULL,
  `decision_notes` TEXT NULL,
  `status` ENUM('requested', 'approved', 'rejected') NOT NULL DEFAULT 'requested',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `decided_at` TIMESTAMP NULL,
  CONSTRAINT `fk_cr_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cr_req_user` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_cr_dec_user` FOREIGN KEY (`decided_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `refunds` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT NOT NULL,
  `payment_id` BIGINT NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `reason` VARCHAR(255) NULL,
  `status` ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_rf_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rf_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. SPEAKER ANNOUNCEMENTS (AUDIT & RE-CALL)
CREATE TABLE `speaker_announcements` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT NOT NULL,
  `triggered_by` BIGINT NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('queued', 'sent', 'failed', 'retried') NOT NULL DEFAULT 'queued',
  `attempt_count` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_spk_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_spk_user` FOREIGN KEY (`triggered_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. WEBSITE DYNAMIC BRAND ELEMENTS
CREATE TABLE `ticker_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `price` VARCHAR(20) NOT NULL,
  `is_down` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `testimonials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quote` TEXT NOT NULL,
  `author_name` VARCHAR(100) NOT NULL,
  `author_title` VARCHAR(100) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- SEED INITIAL DATA
-- ========================================================

-- Users (passwords hashed with bcrypt cost 10 for 'admin123', 'kasir123')
-- $2a$10$fV3zT2.uM84LwS17P0wO/ec91b2qT0d3/fT2G8d/pMcb9a3K18Oqy (admin123)
-- $2a$10$wE0v2Gq5c2jC6sP1H.4E8OhE9jRzE7L.7pQ2A4fV0a3sX7mO1bK8m (kasir123)
INSERT INTO `users` (`id`, `whatsapp_number`, `name`, `role`, `password_hash`) VALUES
(1, '081111111111', 'Admin Pusat (INCOME)', 'admin', '$2a$10$wT0/4R5r1YQ5L9bL4h8Hte5HkHqG8B4zZ/wJ9qY2F5sN8K1P0pAiu'),
(2, '082222222222', 'Kasir Budi (Serang)', 'cashier', '$2a$10$wT0/4R5r1YQ5L9bL4h8Hte5HkHqG8B4zZ/wJ9qY2F5sN8K1P0pAiu'),
(3, '083333333333', 'Kasir Siti (Cilegon)', 'cashier', '$2a$10$wT0/4R5r1YQ5L9bL4h8Hte5HkHqG8B4zZ/wJ9qY2F5sN8K1P0pAiu'),
(4, '081234567890', 'Rizky Ramadhan', 'customer', NULL);

-- Branches
INSERT INTO `branches` (`id`, `name`, `address`, `phone`, `is_open`) VALUES
(1, 'INCOME — Serang Pusat', 'Jl. Veteran No. 42, Serang, Banten', '+62 812-3456-7890', 1),
(2, 'INCOME — Cilegon Branch', 'Jl. Ahmad Yani No. 18, Cilegon, Banten', '+62 813-9876-5432', 1);

-- Staff assignments
INSERT INTO `staff_branch_assignments` (`user_id`, `branch_id`) VALUES
(2, 1),
(3, 2);

-- Dining tables & QR Tokens
INSERT INTO `dining_tables` (`id`, `branch_id`, `table_code`, `qr_token`, `is_active`) VALUES
(1, 1, 'Meja 01', 'inc_srg_tb01_7f8a9e', 1),
(2, 1, 'Meja 02', 'inc_srg_tb02_3b4c5d', 1),
(3, 1, 'Meja 03', 'inc_srg_tb03_8e9f0a', 1),
(4, 1, 'Meja 04', 'inc_srg_tb04_1a2b3c', 1),
(5, 1, 'Meja VIP 01', 'inc_srg_tbvip_9d8e7f', 1),
(6, 2, 'Meja 01', 'inc_clg_tb01_6a5b4c', 1),
(7, 2, 'Meja 02', 'inc_clg_tb02_2e3f4a', 1),
(8, 2, 'Meja 03', 'inc_clg_tb03_5d6e7f', 1);

-- Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `sort_order`) VALUES
(1, 'Coffee', 'coffee', 'fa-mug-hot', 1),
(2, 'Bakery', 'bakery', 'fa-bread-slice', 2),
(3, 'Non-Coffee', 'non-coffee', 'fa-glass-water', 3);

-- Products
INSERT INTO `products` (`id`, `category_id`, `name`, `description`, `image`, `base_price`, `is_signature`, `signature_badge`, `signature_chips`, `is_active`, `sort_order`) VALUES
(1, 1, 'Gula Aren Latte', 'Palm sugar meets slow espresso. A little sweet, a little bold — the entry that opened the book.', '/assets/img/gula_aren.jpg', 45000.00, 1, 'Signature Coffee', 'Sweet,Creamy,Bold', 1, 1),
(2, 1, 'Caramel Latte', 'Silky espresso with buttery handcrafted caramel infusion.', '/assets/img/caramel.jpg', 42000.00, 0, NULL, NULL, 1, 2),
(3, 1, 'Espresso', 'Pure, concentrated extraction of single-origin beans.', '/assets/img/gula_aren.jpg', 25000.00, 0, NULL, NULL, 1, 3),
(4, 1, 'Americano', 'Espresso diluted with hot artisanal mineral water, clean and crisp.', '/assets/img/caramel.jpg', 28000.00, 0, NULL, NULL, 1, 4),
(5, 1, 'Cappuccino', 'Harmonious third: espresso, steamed milk, and velvety microfoam.', '/assets/img/gula_aren.jpg', 35000.00, 0, NULL, NULL, 1, 5),
(6, 1, 'Mocha', 'Dark couverture Belgian chocolate paired with rich espresso.', '/assets/img/caramel.jpg', 38000.00, 0, NULL, NULL, 1, 6),
(7, 1, 'Cold Brew', 'Steeped for 18 hours in cold filtered water, smooth and low acid.', '/assets/img/gula_aren.jpg', 33000.00, 0, NULL, NULL, 1, 7),
(8, 3, 'Matcha Latte', 'Ceremonial grade Uji matcha whisked with fresh whole milk.', '/assets/img/caramel.jpg', 40000.00, 0, NULL, NULL, 1, 8),
(9, 2, 'Butter Croissant', 'Laminated, baked, and gone before noon. Every batch closed out while the oven is still warm.', '/assets/img/caramel.jpg', 35000.00, 1, 'Signature Bakery', 'Flaky,Warm,Buttery', 1, 9),
(10, 2, 'Almond Croissant', 'Twice-baked with almond frangipane cream and toasted sliced almonds.', '/assets/img/gula_aren.jpg', 42000.00, 0, NULL, NULL, 1, 10),
(11, 2, 'Pain au Chocolat', 'French viennoiserie pastry enclosing twin batons of bittersweet chocolate.', '/assets/img/caramel.jpg', 38000.00, 0, NULL, NULL, 1, 11),
(12, 2, 'Banana Bread', 'Moist loaf baked with ripe cavendish bananas and fragrant walnuts.', '/assets/img/gula_aren.jpg', 30000.00, 0, NULL, NULL, 1, 12),
(13, 2, 'Cinnamon Roll', 'Warm pillowy spiral with brown sugar ceylon cinnamon and cream cheese glaze.', '/assets/img/caramel.jpg', 32000.00, 0, NULL, NULL, 1, 13),
(14, 2, 'Chocolate Cookie', 'Crispy edges, chewy gooey center with Valrhona 70% dark chocolate chunks.', '/assets/img/gula_aren.jpg', 22000.00, 0, NULL, NULL, 1, 14),
(15, 2, 'Sourdough Loaf', 'Naturally leavened 36-hour slow fermentation with blistered crust.', '/assets/img/caramel.jpg', 55000.00, 0, NULL, NULL, 1, 15);

-- Option groups & options
INSERT INTO `product_option_groups` (`id`, `product_id`, `category_id`, `name`, `is_required`, `min_selection`, `max_selection`) VALUES
(1, NULL, 1, 'Size', 1, 1, 1),
(2, NULL, 1, 'Sugar Level', 1, 1, 1),
(3, NULL, 1, 'Ice Level', 1, 1, 1),
(4, NULL, 1, 'Milk Option', 0, 0, 1),
(5, NULL, 1, 'Extra Add-ons', 0, 0, 2),
(6, NULL, 2, 'Serving Temperature', 1, 1, 1);

INSERT INTO `product_options` (`option_group_id`, `name`, `price_adjustment`) VALUES
-- Size
(1, 'Regular (12 oz)', 0.00),
(1, 'Large (16 oz)', 5000.00),
-- Sugar Level
(2, 'Normal Sweet (100%)', 0.00),
(2, 'Less Sweet (50%)', 0.00),
(2, 'No Sugar (0%)', 0.00),
-- Ice Level
(3, 'Normal Ice', 0.00),
(3, 'Less Ice', 0.00),
(3, 'No Ice / Hot', 0.00),
-- Milk
(4, 'Fresh Milk (Default)', 0.00),
(4, 'Oat Milk (Oatly)', 6000.00),
(4, 'Almond Milk', 7000.00),
-- Extra Add-ons
(5, 'Extra Espresso Shot', 8000.00),
(5, 'Caramel Drizzle', 4000.00),
(5, 'Vanilla Syrup', 4000.00),
-- Bakery Serving Temperature
(6, 'Warm (Reheated in Oven)', 0.00),
(6, 'Room Temperature', 0.00);

-- Branch Products (Prices and availability)
-- Serang Branch
INSERT INTO `branch_products` (`branch_id`, `product_id`, `price`, `is_available`) VALUES
(1, 1, 45000.00, 1),
(1, 2, 42000.00, 1),
(1, 3, 25000.00, 1),
(1, 4, 28000.00, 1),
(1, 5, 35000.00, 1),
(1, 6, 38000.00, 1),
(1, 7, 33000.00, 1),
(1, 8, 40000.00, 1),
(1, 9, 35000.00, 1),
(1, 10, 42000.00, 1),
(1, 11, 38000.00, 1),
(1, 12, 30000.00, 1),
(1, 13, 32000.00, 1),
(1, 14, 22000.00, 1),
(1, 15, 55000.00, 1),
-- Cilegon Branch (slightly adjusted promotional prices)
(2, 1, 45000.00, 1),
(2, 2, 42000.00, 1),
(2, 3, 25000.00, 1),
(2, 4, 28000.00, 1),
(2, 5, 35000.00, 1),
(2, 6, 38000.00, 1),
(2, 7, 33000.00, 1),
(2, 8, 40000.00, 1),
(2, 9, 35000.00, 1),
(2, 10, 42000.00, 1),
(2, 11, 38000.00, 1),
(2, 12, 30000.00, 1),
(2, 13, 32000.00, 1),
(2, 14, 22000.00, 1),
(2, 15, 55000.00, 1);

-- Website Ticker & Testimonials
INSERT INTO `ticker_items` (`id`, `name`, `price`, `is_down`, `sort_order`) VALUES
(1, 'Gula Aren', '45K', 0, 1),
(2, 'Croissant', '35K', 0, 2),
(3, 'Espresso', '25K', 1, 3),
(4, 'Sourdough', '55K', 0, 4),
(5, 'Cold Brew', '33K', 0, 5),
(6, 'Cinnamon Roll', '32K', 1, 6);

INSERT INTO `testimonials` (`id`, `quote`, `author_name`, `author_title`, `sort_order`) VALUES
(1, 'Best gula aren latte in Serang, hands down. I come back every weekend.', 'Rizky', 'Mahasiswa', 1),
(2, 'The croissant sells out fast — come early or cry. Trust me.', 'Salsa', 'Content Creator', 2),
(3, 'Tempat paling nyaman buat kerja. Kopinya konsisten, rotinya hangat.', 'Bagus', 'Young Professional', 3);

-- Sample initial order for demonstration
INSERT INTO `orders` (`id`, `order_number`, `user_id`, `branch_id`, `dining_table_id`, `customer_name_snapshot`, `order_status`, `payment_status`, `subtotal`, `tax_amount`, `total_amount`, `notes`) VALUES
(1, 'INC-20261110-001', 4, 1, 1, 'Rizky Ramadhan', 'ready', 'pending', 80000.00, 0.00, 80000.00, 'Kurangi es untuk gula aren');

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name_snapshot`, `unit_price`, `quantity`, `subtotal`, `notes`) VALUES
(1, 1, 1, 'Gula Aren Latte', 45000.00, 1, 45000.00, 'Less Ice'),
(2, 1, 9, 'Butter Croissant', 35000.00, 1, 35000.00, 'Warm');

INSERT INTO `order_item_options` (`order_item_id`, `option_id`, `group_name_snapshot`, `option_name_snapshot`, `price_adjustment`) VALUES
(1, 1, 'Size', 'Regular (12 oz)', 0.00),
(1, 4, 'Ice Level', 'Less Ice', 0.00),
(2, 12, 'Serving Temperature', 'Warm (Reheated in Oven)', 0.00);

INSERT INTO `payments` (`id`, `order_id`, `method`, `provider`, `amount`, `status`) VALUES
(1, 1, 'cash', 'cashier', 80000.00, 'pending');

INSERT INTO `order_status_history` (`order_id`, `changed_by`, `old_status`, `new_status`, `notes`) VALUES
(1, 4, 'none', 'placed', 'Order dibuat customer melalui QR Meja 01'),
(1, 2, 'placed', 'preparing', 'Pesanan mulai disiapkan di barista'),
(1, 2, 'preparing', 'ready', 'Pesanan siap diambil di pick-up counter');

INSERT INTO `speaker_announcements` (`id`, `order_id`, `triggered_by`, `message`, `status`, `attempt_count`) VALUES
(1, 1, 2, 'Panggilan untuk pesanan nomor INC-20261110-001 atas nama Rizky Ramadhan di Meja 01, silakan mengambil pesanan Anda di kasir.', 'sent', 1);

