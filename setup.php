<?php
/**
 * INCOME — Coffee & Bakery
 * Skrip Inisialisasi Database Otomatis
 * Jalankan file ini via browser (misal: http://localhost/web_income/setup.php)
 * atau via CLI: php setup.php
 */

$host = 'localhost';
$user = 'root';
$pass = '';
$port = '3306';
$dbname = 'income_db';
$sqlFile = __DIR__ . '/database/income_db.sql';

$status = [];
$error = null;
$success = false;

try {
    // 1. Hubungkan ke MySQL server tanpa memilih database dulu
    $pdo = new PDO("mysql:host=$host;port=$port;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $status[] = "Berhasil terhubung ke server MySQL ($host:$port).";

    // 2. Baca isi file SQL
    if (!file_exists($sqlFile)) {
        throw new Exception("File SQL tidak ditemukan di: $sqlFile");
    }
    $sqlContent = file_get_contents($sqlFile);
    $status[] = "File database/income_db.sql berhasil dibaca.";

    // 3. Jalankan query SQL
    $pdo->exec($sqlContent);
    $status[] = "Database `$dbname` dan seluruh tabel berhasil dibuat!";
    $status[] = "Data awal (menu, ticker, signatures, testimonials, store_settings) berhasil dimasukkan.";

    $success = true;
} catch (Exception $e) {
    $error = $e->getMessage();
}

// Jika dijalankan dari CLI
if (php_sapi_name() === 'cli') {
    echo "========================================\n";
    echo " INCOME — Setup Database\n";
    echo "========================================\n";
    foreach ($status as $msg) {
        echo "[OK] $msg\n";
    }
    if ($error) {
        echo "[ERROR] $error\n";
    } else {
        echo "\nSetup selesai! Database siap digunakan.\n";
    }
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Setup Database — INCOME Coffee &amp; Bakery</title>
  <link rel="icon" type="image/png" href="assets/img/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,700;1,500;1,700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
  <style>
    :root {
      --ink: #1B160E;
      --paper: #E8E0CC;
      --paper-card: #F1EAD9;
      --brass: #A07C3E;
      --wine: #7A2A2A;
      --line: rgba(27, 22, 14, 0.18);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--ink);
      color: var(--paper);
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: var(--paper-card);
      color: var(--ink);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: clamp(24px, 5vw, 40px);
      max-width: 580px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .tag {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--brass);
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    h1 {
      font-family: 'Fraunces', serif;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 12px;
      line-height: 1.2;
    }
    p {
      font-size: 14px;
      color: #4A4128;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .log-box {
      background: #1B160E;
      color: #E8E0CC;
      border-radius: 6px;
      padding: 16px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 13px;
      line-height: 1.8;
      margin-bottom: 24px;
    }
    .log-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .log-item i {
      color: #4CAF50;
      margin-top: 4px;
    }
    .log-item.error i {
      color: #F44336;
    }
    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      border-radius: 999px;
      transition: all 0.25s ease;
      cursor: pointer;
    }
    .btn-primary {
      background: var(--ink);
      color: var(--paper);
      border: 1px solid var(--ink);
    }
    .btn-primary:hover {
      background: var(--brass);
      border-color: var(--brass);
      color: #fff;
    }
    .btn-secondary {
      background: transparent;
      color: var(--ink);
      border: 1px solid var(--ink);
    }
    .btn-secondary:hover {
      background: var(--ink);
      color: var(--paper);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="tag"><i class="fa-solid fa-database"></i> Setup Database</div>
    <h1>INCOME — Inisialisasi Database</h1>
    <p>Halaman ini otomatis membuat database <code>income_db</code>, seluruh tabel yang dibutuhkan, serta data awal (seed) dari menu INCOME.</p>

    <div class="log-box">
      <?php foreach ($status as $msg): ?>
        <div class="log-item">
          <i class="fa-solid fa-circle-check"></i>
          <span><?= htmlspecialchars($msg) ?></span>
        </div>
      <?php endforeach; ?>

      <?php if ($error): ?>
        <div class="log-item error">
          <i class="fa-solid fa-circle-xmark"></i>
          <span><strong>Error:</strong> <?= htmlspecialchars($error) ?></span>
        </div>
      <?php endif; ?>
    </div>

    <div class="actions">
      <?php if ($success): ?>
        <a href="index.php" class="btn btn-primary">
          Buka Website <i class="fa-solid fa-arrow-right"></i>
        </a>
        <a href="admin/index.php" class="btn btn-secondary">
          Kelola Menu (Admin) <i class="fa-solid fa-sliders"></i>
        </a>
      <?php else: ?>
        <a href="setup.php" class="btn btn-primary">
          <i class="fa-solid fa-rotate-right"></i> Coba Lagi
        </a>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
