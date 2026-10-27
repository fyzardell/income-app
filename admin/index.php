<?php
/**
 * INCOME — Coffee & Bakery
 * Admin Panel: Kelola Menu & Database
 */
require_once __DIR__ . '/../config/database.php';

$message = '';
$messageType = '';

// Proses Aksi: Tambah Menu
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add') {
    if (!$db_connected) {
        $message = "Database belum terhubung! Silakan jalankan MySQL di Laragon.";
        $messageType = "error";
    } else {
        $name        = trim($_POST['name'] ?? '');
        $categoryId  = (int)($_POST['category_id'] ?? 1);
        $price       = trim($_POST['price'] ?? '');
        $priceNum    = (int)preg_replace('/[^0-9]/', '', $price);
        $image       = trim($_POST['image'] ?? 'assets/img/gula_aren.jpg');
        $isAvailable = isset($_POST['is_available']) ? 1 : 0;
        $sortOrder   = (int)($_POST['sort_order'] ?? 0);

        if (!empty($name) && !empty($price)) {
            try {
                $stmt = $pdo->prepare("INSERT INTO menu_items (category_id, name, price, price_num, image, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$categoryId, $name, $price, $priceNum, $image, $isAvailable, $sortOrder]);
                $message = "Menu '$name' berhasil ditambahkan ke database!";
                $messageType = "success";
            } catch (Exception $e) {
                $message = "Gagal menambah menu: " . $e->getMessage();
                $messageType = "error";
            }
        } else {
            $message = "Nama menu dan harga tidak boleh kosong.";
            $messageType = "error";
        }
    }
}

// Proses Aksi: Edit Menu
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'edit') {
    if (!$db_connected) {
        $message = "Database belum terhubung!";
        $messageType = "error";
    } else {
        $id          = (int)($_POST['id'] ?? 0);
        $name        = trim($_POST['name'] ?? '');
        $categoryId  = (int)($_POST['category_id'] ?? 1);
        $price       = trim($_POST['price'] ?? '');
        $priceNum    = (int)preg_replace('/[^0-9]/', '', $price);
        $image       = trim($_POST['image'] ?? 'assets/img/gula_aren.jpg');
        $isAvailable = isset($_POST['is_available']) ? 1 : 0;
        $sortOrder   = (int)($_POST['sort_order'] ?? 0);

        if ($id > 0 && !empty($name) && !empty($price)) {
            try {
                $stmt = $pdo->prepare("UPDATE menu_items SET category_id = ?, name = ?, price = ?, price_num = ?, image = ?, is_available = ?, sort_order = ? WHERE id = ?");
                $stmt->execute([$categoryId, $name, $price, $priceNum, $image, $isAvailable, $sortOrder, $id]);
                $message = "Menu '$name' berhasil diperbarui!";
                $messageType = "success";
            } catch (Exception $e) {
                $message = "Gagal memperbarui menu: " . $e->getMessage();
                $messageType = "error";
            }
        }
    }
}

// Proses Aksi: Hapus Menu
if (isset($_GET['delete']) && is_numeric($_GET['delete'])) {
    if (!$db_connected) {
        $message = "Database belum terhubung!";
        $messageType = "error";
    } else {
        $deleteId = (int)$_GET['delete'];
        try {
            $stmt = $pdo->prepare("DELETE FROM menu_items WHERE id = ?");
            $stmt->execute([$deleteId]);
            $message = "Item menu berhasil dihapus!";
            $messageType = "success";
        } catch (Exception $e) {
            $message = "Gagal menghapus: " . $e->getMessage();
            $messageType = "error";
        }
    }
}

// Ambil Kategori & Data Menu
$categories = [];
$allItems = [];
if ($db_connected) {
    try {
        $stmt = $pdo->query("SELECT * FROM categories ORDER BY sort_order ASC, id ASC");
        $categories = $stmt->fetchAll();

        $stmtItems = $pdo->query("
            SELECT m.*, c.name AS category_name, c.icon AS category_icon 
            FROM menu_items m 
            JOIN categories c ON m.category_id = c.id 
            ORDER BY c.sort_order ASC, m.sort_order ASC, m.id ASC
        ");
        $allItems = $stmtItems->fetchAll();
    } catch (Exception $e) {
        // Fallback jika query error
    }
} else {
    // Gunakan fallback
    $categories = $fallback_data['categories'];
    foreach ($fallback_data['categories'] as $c) {
        foreach ($c['items'] as $it) {
            $allItems[] = [
                'id' => rand(100, 999),
                'name' => $it['name'],
                'category_name' => $c['name'],
                'category_id' => $c['id'],
                'price' => $it['price'],
                'image' => $it['image'],
                'is_available' => 1,
                'sort_order' => 0
            ];
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard — INCOME Coffee &amp; Bakery</title>
  <link rel="icon" type="image/png" href="../assets/img/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,700;1,600&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
  <style>
    :root {
      --ink: #1B160E;
      --paper: #E8E0CC;
      --paper-card: #F1EAD9;
      --brass: #A07C3E;
      --wine: #7A2A2A;
      --gray: #8C8064;
      --line: rgba(27, 22, 14, 0.15);
      --ease: cubic-bezier(0.22, 1, 0.36, 1);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #14100A;
      color: var(--paper);
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header.topbar {
      background: var(--ink);
      border-bottom: 1px solid var(--line);
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--paper);
    }
    .brand img {
      height: 32px;
    }
    .brand-title {
      font-family: 'Fraunces', serif;
      font-weight: 700;
      font-size: 18px;
      letter-spacing: -0.01em;
    }
    .brand-badge {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10px;
      padding: 3px 8px;
      background: rgba(160, 124, 62, 0.2);
      color: var(--brass);
      border-radius: 999px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn-link {
      color: var(--paper);
      text-decoration: none;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: 1px solid rgba(232, 224, 204, 0.3);
      border-radius: 999px;
      transition: all 0.25s var(--ease);
    }
    .btn-link:hover {
      background: var(--paper);
      color: var(--ink);
    }
    .container {
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
      padding: 32px 20px;
      flex: 1;
    }
    .db-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      padding: 6px 12px;
      border-radius: 999px;
      margin-bottom: 24px;
    }
    .db-badge.connected {
      background: rgba(76, 175, 80, 0.15);
      color: #81C784;
      border: 1px solid rgba(76, 175, 80, 0.3);
    }
    .db-badge.disconnected {
      background: rgba(244, 67, 54, 0.15);
      color: #E57373;
      border: 1px solid rgba(244, 67, 54, 0.3);
    }
    .alert {
      padding: 12px 18px;
      border-radius: 6px;
      font-size: 13px;
      font-family: 'IBM Plex Mono', monospace;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .alert-success {
      background: rgba(76, 175, 80, 0.2);
      border: 1px solid #4CAF50;
      color: #A5D6A7;
    }
    .alert-error {
      background: rgba(244, 67, 54, 0.2);
      border: 1px solid #F44336;
      color: #FFCDD2;
    }
    .grid-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 32px;
      align-items: start;
    }
    @media (max-width: 860px) {
      .grid-layout {
        grid-template-columns: 1fr;
      }
    }
    .card {
      background: var(--paper-card);
      color: var(--ink);
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    .card-title {
      font-family: 'Fraunces', serif;
      font-size: 20px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .table-responsive {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      text-align: left;
      padding: 12px 10px;
      border-bottom: 2px solid var(--line);
      color: var(--gray);
    }
    td {
      padding: 12px 10px;
      border-bottom: 1px solid var(--line);
      vertical-align: middle;
    }
    .item-media {
      width: 44px;
      height: 44px;
      border-radius: 4px;
      object-fit: cover;
      background: #eee;
    }
    .item-name {
      font-weight: 600;
      display: block;
    }
    .item-cat {
      font-size: 11px;
      color: var(--gray);
      font-family: 'IBM Plex Mono', monospace;
    }
    .badge {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-avail {
      background: #E8F5E9;
      color: #2E7D32;
    }
    .badge-unavail {
      background: #FFEBEE;
      color: #C62828;
    }
    .btn-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: 1px solid var(--line);
      background: #fff;
      color: var(--ink);
      text-decoration: none;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-action:hover {
      background: var(--ink);
      color: #fff;
    }
    .btn-action.delete:hover {
      background: var(--wine);
      border-color: var(--wine);
      color: #fff;
    }
    /* Form */
    .form-group {
      margin-bottom: 14px;
    }
    label {
      display: block;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
      color: #4A4128;
    }
    input[type="text"], input[type="number"], select {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid rgba(27, 22, 14, 0.25);
      border-radius: 4px;
      font-family: inherit;
      font-size: 13px;
      background: #fff;
      color: var(--ink);
    }
    input[type="text"]:focus, input[type="number"]:focus, select:focus {
      outline: none;
      border-color: var(--brass);
      box-shadow: 0 0 0 2px rgba(160, 124, 62, 0.2);
    }
    .form-check {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      margin-top: 8px;
    }
    .btn-submit {
      width: 100%;
      padding: 12px;
      background: var(--ink);
      color: var(--paper);
      border: none;
      border-radius: 999px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.25s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 10px;
    }
    .btn-submit:hover {
      background: var(--brass);
      color: #fff;
    }
  </style>
</head>
<body>

  <header class="topbar">
    <a href="../index.php" class="brand">
      <img src="../assets/img/logo_income.png" alt="INCOME">
      <span class="brand-title">INCOME</span>
      <span class="brand-badge">Admin Ledger</span>
    </a>
    <div class="topbar-actions">
      <a href="../setup.php" class="btn-link" title="Jalankan Ulang Setup Database">
        <i class="fa-solid fa-database"></i> Setup DB
      </a>
      <a href="../index.php" class="btn-link" target="_blank">
        <i class="fa-solid fa-arrow-up-right"></i> Lihat Website
      </a>
    </div>
  </header>

  <main class="container">
    <?php if ($db_connected): ?>
      <div class="db-badge connected">
        <i class="fa-solid fa-circle-check"></i>
        <span>Database Terhubung (<strong>income_db</strong> di localhost:3306)</span>
      </div>
    <?php else: ?>
      <div class="db-badge disconnected">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>Database Belum Aktif — Menampilkan Data Mockup. Jalankan MySQL di Laragon lalu klik <a href="../setup.php" style="color: inherit; text-decoration: underline; margin-left: 4px;">Setup Database</a>.</span>
      </div>
    <?php endif; ?>

    <?php if (!empty($message)): ?>
      <div class="alert alert-<?= $messageType ?>">
        <i class="fa-solid fa-<?= $messageType === 'success' ? 'circle-check' : 'circle-xmark' ?>"></i>
        <span><?= htmlspecialchars($message) ?></span>
      </div>
    <?php endif; ?>

    <div class="grid-layout">
      <!-- Tabel List Menu -->
      <section class="card">
        <h2 class="card-title">
          <i class="fa-solid fa-book-open"></i> Daftar Menu (<?= count($allItems) ?> item)
        </h2>
        
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Foto</th>
                <th>Nama Menu</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($allItems as $item): ?>
              <tr>
                <td>
                  <img src="../<?= htmlspecialchars($item['image']) ?>" alt="<?= htmlspecialchars($item['name']) ?>" class="item-media">
                </td>
                <td>
                  <span class="item-name"><?= htmlspecialchars($item['name']) ?></span>
                </td>
                <td>
                  <span class="item-cat"><?= htmlspecialchars($item['category_name']) ?></span>
                </td>
                <td>
                  <strong style="font-family: 'IBM Plex Mono', monospace;"><?= htmlspecialchars($item['price']) ?></strong>
                </td>
                <td>
                  <?php if (!empty($item['is_available'])): ?>
                    <span class="badge badge-avail">Tersedia</span>
                  <?php else: ?>
                    <span class="badge badge-unavail">Habis</span>
                  <?php endif; ?>
                </td>
                <td>
                  <?php if ($db_connected): ?>
                    <a href="?delete=<?= $item['id'] ?>" class="btn-action delete" title="Hapus menu" onclick="return confirm('Yakin ingin menghapus menu <?= htmlspecialchars(addslashes($item['name'])) ?>?');">
                      <i class="fa-solid fa-trash"></i>
                    </a>
                  <?php else: ?>
                    <span style="font-size: 11px; color: var(--gray);">Demo</span>
                  <?php endif; ?>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Form Tambah Menu -->
      <aside class="card">
        <h2 class="card-title">
          <i class="fa-solid fa-plus-circle"></i> Tambah Menu
        </h2>

        <form method="POST" action="index.php">
          <input type="hidden" name="action" value="add">

          <div class="form-group">
            <label for="name">Nama Menu</label>
            <input type="text" id="name" name="name" placeholder="Misal: Vanilla Latte" required>
          </div>

          <div class="form-group">
            <label for="category_id">Kategori</label>
            <select id="category_id" name="category_id" required>
              <?php foreach ($categories as $cat): ?>
                <option value="<?= $cat['id'] ?>"><?= htmlspecialchars($cat['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="form-group">
            <label for="price">Harga (Format Tampilan)</label>
            <input type="text" id="price" name="price" placeholder="Misal: 40K atau Rp 40.000" required>
          </div>

          <div class="form-group">
            <label for="image">Foto Produk</label>
            <select id="image" name="image">
              <option value="assets/img/gula_aren.jpg">assets/img/gula_aren.jpg (Coffee)</option>
              <option value="assets/img/caramel.jpg">assets/img/caramel.jpg (Bakery / Caramel)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="sort_order">Urutan (Angka)</label>
            <input type="number" id="sort_order" name="sort_order" value="10">
          </div>

          <div class="form-check">
            <input type="checkbox" id="is_available" name="is_available" value="1" checked>
            <label for="is_available" style="margin-bottom: 0; text-transform: none; cursor: pointer;">Tersedia di Menu</label>
          </div>

          <button type="submit" class="btn-submit">
            <i class="fa-solid fa-save"></i> Simpan ke Database
          </button>
        </form>
      </aside>
    </div>
  </main>

</body>
</html>
