# Panduan Menggunakan INCOME (PHP Native + MySQL)

Proyek ini telah dikonversi dari HTML statis menjadi **PHP Native** dinamis yang terhubung ke database **MySQL / MariaDB** (menggunakan PDO), **tanpa mengubah desain, tata letak, warna, tipografi, maupun animasi aslinya sedikit pun**.

---

## 📁 Struktur File Baru

```
web_income/
├── admin/
│   └── index.php              # Panel admin untuk kelola menu (Tambah, Hapus, Status)
├── assets/
│   └── img/                   # Gambar produk & logo
├── config/
│   └── database.php           # Koneksi PDO native, query helper & data fallback
├── css/
│   └── style.css              # Style asli (tidak diubah)
├── database/
│   └── income_db.sql          # File skrip SQL database & data awal (seed)
├── js/
│   └── main.js                # Interaksi & animasi asli (tidak diubah)
├── index.html                 # Cadangan file HTML asli
├── index.php                  # Halaman utama INCOME berbasis PHP dinamis
├── koneksi.php                # Shortcut koneksi database
├── setup.php                  # Halaman inisialisasi database otomatis (1-klik)
└── README.md                  # Petunjuk ini
```

---

## 🚀 Langkah Cepat Menjalankan

### 1. Jalankan Laragon / XAMPP
- Buka aplikasi **Laragon**
- Klik tombol **Start All** (untuk menyalakan Apache & MySQL)
- Pastikan folder proyek `web_income` berada di dalam folder `C:\laragon\www\web_income`.
  *(Di Laragon, Anda juga bisa mengaksesnya via Pretty URL seperti `http://web_income.test`)*.

### 2. Buat Database Otomatis (Hanya Sekali)
Anda dapat membuat database `income_db` dan mengisi data awalnya dengan **salah satu dari 2 cara**:

#### Cara A: Melalui Browser (Paling Mudah)
Buka URL berikut di browser:
👉 **`http://localhost/web_income/setup.php`**
*(Halaman akan langsung membuat database `income_db`, seluruh tabel, dan mengisi data menu)*.

#### Cara B: Melalui phpMyAdmin / HeidiSQL
1. Buka phpMyAdmin (`http://localhost/phpmyadmin`)
2. Masuk ke tab **Import**
3. Pilih file: `database/income_db.sql`
4. Klik **Import / Kirim**

---

## ☕ Akses Halaman Web

1. **Halaman Pengunjung (Website Utama)**
   👉 **`http://localhost/web_income/index.php`**
   *(atau cukup `http://localhost/web_income/`)*
   - Menampilkan menu kopi & roti, harga, ticker marquee, dan testimoni secara langsung dari database.
   - Hover / klik menu tetap menampilkan preview foto produk dengan interaksi yang mulus.

2. **Panel Admin (Kelola Menu)**
   👉 **`http://localhost/web_income/admin/index.php`**
   - Melihat daftar menu yang tersimpan di database.
   - Menambah menu baru (nama, kategori Coffee/Bakery, harga, foto, ketersediaan).
   - Menghapus menu.
   - Tampilan didesain selaras dengan estetika kraft & ledger khas INCOME.

---

## 🛡️ Fitur Graceful Fallback
Jika MySQL belum dinyalakan atau database belum diimport, website `index.php` **tidak akan error/blank putih**, melainkan otomatis menampilkan data default sehingga website tetap tampil prima kapan pun dibuka.
