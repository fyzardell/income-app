<?php
/**
 * INCOME — Coffee & Bakery
 * Konfigurasi Database & Koneksi PDO Native
 */

// Konfigurasi Database (Default Laragon / XAMPP)
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'income_db');
define('DB_PORT', '3306');

$pdo = null;
$db_connected = false;
$db_error = null;

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    $db_connected = true;
} catch (PDOException $e) {
    $db_connected = false;
    $db_error = $e->getMessage();
}

/**
 * Fallback data jika database belum diimport/dijalankan
 */
$fallback_data = [
    'categories' => [
        [
            'id' => 1,
            'name' => 'Coffee',
            'slug' => 'coffee',
            'icon' => 'fa-mug-hot',
            'items' => [
                ['name' => 'Gula Aren Latte', 'price' => '45K', 'image' => 'assets/img/gula_aren.jpg'],
                ['name' => 'Caramel Latte',   'price' => '42K', 'image' => 'assets/img/caramel.jpg'],
                ['name' => 'Espresso',        'price' => '25K', 'image' => 'assets/img/gula_aren.jpg'],
                ['name' => 'Americano',       'price' => '28K', 'image' => 'assets/img/caramel.jpg'],
                ['name' => 'Cappuccino',      'price' => '35K', 'image' => 'assets/img/gula_aren.jpg'],
                ['name' => 'Mocha',           'price' => '38K', 'image' => 'assets/img/caramel.jpg'],
                ['name' => 'Cold Brew',       'price' => '33K', 'image' => 'assets/img/gula_aren.jpg'],
                ['name' => 'Matcha Latte',    'price' => '40K', 'image' => 'assets/img/caramel.jpg'],
            ]
        ],
        [
            'id' => 2,
            'name' => 'Bakery',
            'slug' => 'bakery',
            'icon' => 'fa-bread-slice',
            'items' => [
                ['name' => 'Butter Croissant', 'price' => '35K', 'image' => 'assets/img/caramel.jpg'],
                ['name' => 'Almond Croissant', 'price' => '42K', 'image' => 'assets/img/gula_aren.jpg'],
                ['name' => 'Pain au Chocolat', 'price' => '38K', 'image' => 'assets/img/caramel.jpg'],
                ['name' => 'Banana Bread',     'price' => '30K', 'image' => 'assets/img/gula_aren.jpg'],
                ['name' => 'Cinnamon Roll',    'price' => '32K', 'image' => 'assets/img/caramel.jpg'],
                ['name' => 'Chocolate Cookie', 'price' => '22K', 'image' => 'assets/img/gula_aren.jpg'],
                ['name' => 'Sourdough Loaf',   'price' => '55K', 'image' => 'assets/img/caramel.jpg'],
            ]
        ]
    ],
    'ticker' => [
        ['name' => 'Gula Aren', 'price' => '45K', 'is_down' => 0],
        ['name' => 'Croissant', 'price' => '35K', 'is_down' => 0],
        ['name' => 'Espresso', 'price' => '25K', 'is_down' => 1],
        ['name' => 'Sourdough', 'price' => '55K', 'is_down' => 0],
        ['name' => 'Cold Brew', 'price' => '33K', 'is_down' => 0],
        ['name' => 'Cinnamon Roll', 'price' => '32K', 'is_down' => 1],
    ],
    'signatures' => [
        [
            'ledger_no' => 'No. 01',
            'label' => 'Signature Coffee',
            'title_prefix' => 'Gula Aren',
            'title_accent' => 'Latte',
            'chips' => ['Sweet', 'Creamy', 'Bold'],
            'price' => '45K',
            'image' => 'assets/img/gula_aren.jpg',
            'category_name' => 'Coffee',
            'category_icon' => 'fa-mug-hot',
            'blurb' => 'Palm sugar meets slow espresso. A little sweet, a little bold — the entry that opened the book.',
            'wa_order_text' => 'Halo INCOME! Saya mau pesan Gula Aren Latte.',
            'theme' => 'light'
        ],
        [
            'ledger_no' => 'No. 02',
            'label' => 'Signature Bakery',
            'title_prefix' => 'Butter',
            'title_accent' => 'Croissant',
            'chips' => ['Flaky', 'Warm', 'Buttery'],
            'price' => '35K',
            'image' => 'assets/img/caramel.jpg',
            'category_name' => 'Bakery',
            'category_icon' => 'fa-bread-slice',
            'blurb' => 'Laminated, baked, and gone before noon. Every batch is closed out while the oven is still warm.',
            'wa_order_text' => 'Halo INCOME! Saya mau pesan Butter Croissant.',
            'theme' => 'dark'
        ]
    ],
    'testimonials' => [
        [
            'quote' => '“Best gula aren latte in Serang, hands down. I come back every weekend.”',
            'author_name' => 'Rizky',
            'author_role' => 'Mahasiswa'
        ],
        [
            'quote' => '“The croissant sells out fast — come early or cry. Trust me.”',
            'author_name' => 'Salsa',
            'author_role' => 'Content Creator'
        ],
        [
            'quote' => '“Tempat paling nyaman buat kerja. Kopinya konsisten, rotinya hangat.”',
            'author_name' => 'Bagus',
            'author_role' => 'Young Professional'
        ]
    ]
];

/**
 * Fungsi helper untuk mengambil data menu per kategori
 */
function getMenuCategoriesWithItems($pdo) {
    global $fallback_data, $db_connected;

    if (!$db_connected || !$pdo) {
        return $fallback_data['categories'];
    }

    try {
        $stmtCat = $pdo->query("SELECT * FROM categories ORDER BY sort_order ASC, id ASC");
        $categories = $stmtCat->fetchAll();

        if (empty($categories)) {
            return $fallback_data['categories'];
        }

        foreach ($categories as &$cat) {
            $stmtItems = $pdo->prepare("SELECT * FROM menu_items WHERE category_id = ? AND is_available = 1 ORDER BY sort_order ASC, id ASC");
            $stmtItems->execute([$cat['id']]);
            $cat['items'] = $stmtItems->fetchAll();
        }
        unset($cat);

        return $categories;
    } catch (Exception $e) {
        return $fallback_data['categories'];
    }
}

/**
 * Fungsi helper untuk mengambil ticker items
 */
function getTickerItems($pdo) {
    global $fallback_data, $db_connected;

    if (!$db_connected || !$pdo) {
        return $fallback_data['ticker'];
    }

    try {
        $stmt = $pdo->query("SELECT * FROM ticker_items ORDER BY sort_order ASC, id ASC");
        $items = $stmt->fetchAll();
        return !empty($items) ? $items : $fallback_data['ticker'];
    } catch (Exception $e) {
        return $fallback_data['ticker'];
    }
}

/**
 * Fungsi helper untuk mengambil signature products
 */
function getSignatures($pdo) {
    global $fallback_data, $db_connected;

    if (!$db_connected || !$pdo) {
        return $fallback_data['signatures'];
    }

    try {
        $stmt = $pdo->query("SELECT * FROM signatures ORDER BY sort_order ASC, id ASC");
        $items = $stmt->fetchAll();
        if (empty($items)) return $fallback_data['signatures'];

        foreach ($items as &$item) {
            $item['chips'] = array_map('trim', explode(',', $item['chips']));
        }
        unset($item);

        return $items;
    } catch (Exception $e) {
        return $fallback_data['signatures'];
    }
}

/**
 * Fungsi helper untuk mengambil testimonials
 */
function getTestimonials($pdo) {
    global $fallback_data, $db_connected;

    if (!$db_connected || !$pdo) {
        return $fallback_data['testimonials'];
    }

    try {
        $stmt = $pdo->query("SELECT * FROM testimonials ORDER BY sort_order ASC, id ASC");
        $items = $stmt->fetchAll();
        return !empty($items) ? $items : $fallback_data['testimonials'];
    } catch (Exception $e) {
        return $fallback_data['testimonials'];
    }
}

/**
 * Fungsi helper untuk mengambil pengaturan toko
 */
function getStoreSettings($pdo) {
    global $db_connected;

    $defaults = [
        'store_name' => 'INCOME',
        'tagline' => 'A daily ledger of good things — coffee and bread, brewed and baked fresh.',
        'est_year' => '2026',
        'city' => 'Serang, Banten — Indonesia',
        'address' => 'Serang, Banten — Indonesia',
        'opening_hours' => '07.00 — 22.00',
        'phone' => '+62 812-3456-7890',
        'whatsapp_url' => 'https://wa.me/6281234567890?text=Halo%20INCOME!%20Saya%20mau%20pesan.',
        'maps_url' => 'https://maps.google.com/?q=Serang+Banten+Indonesia',
        'maps_embed' => 'https://maps.google.com/maps?q=Serang%2C%20Banten%2C%20Indonesia&z=13&output=embed',
        'instagram_url' => 'https://www.instagram.com/',
        'tiktok_url' => 'https://www.tiktok.com/'
    ];

    if (!$db_connected || !$pdo) {
        return $defaults;
    }

    try {
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM store_settings");
        $rows = $stmt->fetchAll();
        if (!empty($rows)) {
            foreach ($rows as $row) {
                $defaults[$row['setting_key']] = $row['setting_value'];
            }
        }
    } catch (Exception $e) {
        // Abaikan error dan gunakan defaults
    }

    return $defaults;
}
