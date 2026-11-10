# INCOME Coffee & Bakery — Multi-Branch Dine-in System

Project **INCOME Coffee & Bakery** telah dimodernisasi sesuai **PRD (Product Requirement Document)** dan **ERD (Entity Relationship Diagram)** dengan arsitektur tech stack modern:
- **Frontend:** React 18 + Vite (SPA dengan estetika khas *The Daily Ledger* & Kraft Paper)
- **Backend:** Go (Golang REST API, Clean Architecture, High Performance)
- **Database:** SQL (MySQL 8.0+ / MariaDB via Laragon)
- **Cache & Rate Limiting:** Redis (caching katalog cabang, sesi, rate limiting OTP, dan invalidasi otomatis saat stok/harga diperbarui)
- **Payment Gateway:** Adapter Pattern (Cash saat ambil pesanan, QRIS Instant, Virtual Account Bank, E-Wallet) dengan idempotensi webhook
- **Speaker Calling System:** Web Speech API (Suara Bahasa Indonesia) + Chime Tone generator dengan pencatatan audit trail

---

## 🏗️ Tech Stack & Arsitektur

```
web_income/
├── backend/                      # Go Backend REST API
│   ├── cmd/server/main.go        # Entrypoint server & graceful shutdown
│   ├── internal/
│   │   ├── config/               # Environment & setting
│   │   ├── database/             # Koneksi MySQL & auto-migrasi schema.sql
│   │   ├── cache/                # Redis client + In-Memory Threadsafe Fallback
│   │   ├── models/               # Struct Domain sesuai ERD
│   │   ├── repository/           # Query SQL & snapshot transaksi
│   │   ├── service/              # Business logic (Order, OTP, Payment, Speaker, Cancel)
│   │   ├── handler/              # HTTP REST Handlers
│   │   ├── middleware/           # JWT Auth, Role Guard, CORS, Logger, Recoverer
│   │   └── gateway/              # Adapter Payment Gateway (QRIS, VA, Webhook Idempotent)
│   ├── server.exe                # Binary executable siap pakai
│   ├── go.mod & go.sum
│   └── .env
├── frontend/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/           # Navbar, MarqueeTicker, CartDrawer, AuthModal, ProductCustomizer
│   │   ├── context/              # AuthContext, BranchContext, CartContext
│   │   ├── pages/                # LandingPage, OrderStatusPage, CashierDashboard, AdminDashboard, MyOrders, TableQRPrint
│   │   ├── services/api.js       # Client HTTP ke backend Go
│   │   ├── styles/ & legacy      # Desain otentik Kraft Ledger & IBM Plex Mono
│   │   └── App.jsx
│   ├── dist/                     # Hasil kompilasi produksi
│   └── package.json
├── database/
│   ├── schema.sql                # Skema lengkap PRD/ERD & Data Seed Awal
│   └── income_db.sql             # Skrip database lama (backup)
├── run-all.bat                   # Script 1-klik jalankan Backend & Frontend sekaligus
├── run-backend.bat               # Script 1-klik jalankan Backend Go (:8080)
├── run-frontend.bat              # Script 1-klik jalankan Frontend Vite (:5173)
└── README.md
```

---

## 🚀 Fitur Sesuai PRD & ERD

### 1. Dine-in & Validasi QR Meja
- Setiap meja memiliki token QR acak unik (`qr_token`), bukan ID urut biasa.
- Pelanggan membuka website melalui link/scan QR meja (contoh: `/?token=inc_srg_tb01_7f8a9e`).
- Sistem memvalidasi token meja dan mengikatnya ke cabang aktif.
- Keranjang memvalidasi agar produk hanya berasal dari satu cabang tunggal.

### 2. Autentikasi WhatsApp OTP & Profil
- Login pelanggan via nomor WhatsApp dengan kode OTP 6 digit.
- Hash OTP disimpan di database (`otp_verifications`) dengan masa kedaluwarsa 5 menit, batas percobaan, dan rate limiting di Redis.
- Pada mode simulasi lokal, kode OTP langsung ditampilkan di notifikasi untuk mempermudah pengujian cepat.
- Pelanggan dapat mengatur nama profil untuk identifikasi pemanggilan.

### 3. Pemisahan Status Sesuai PRD
- **Status Pesanan (`order_status`):** `pending_payment` → `placed` → `preparing` → `ready` → `completed` (atau `cancelled`).
- **Status Pembayaran (`payment_status`):** `pending`, `paid`, `failed`, `expired`, `refund_pending`, `refunded`.
- **Status Pembatalan (`cancellation_requests`):** `requested`, `approved`, `rejected`.
- **Status Speaker (`speaker_announcements`):** `queued`, `sent`, `failed`, `retried`.

### 4. Pembayaran Cash & Gateway Online
- **Cash:** Pesanan berstatus `placed` dengan pembayaran `pending`. Kasir mengonfirmasi saat customer membayar di kasir ketika pesanan `ready`.
- **Online (QRIS, VA Bank, E-Wallet):** Pesanan baru masuk proses setelah webhook payment gateway diverifikasi secara kriptografis dan idempotent.
- Tombol simulator webhook disediakan di halaman tracking pesanan untuk memverifikasi callback pembayaran instan.

### 5. Dashboard Kasir & Pemanggilan Speaker
- Kasir dibatasi ke cabang penugasannya (`staff_branch_assignments`).
- Mengubah alur pesanan: `placed` → `preparing` → `ready` → `completed`.
- **Tombol Panggil Speaker:** Membunyikan *sound chime* dan melafalkan pengumuman suara bahasa Indonesia via Web Speech API (*"Panggilan untuk pesanan nomor INC-XXXX atas nama Budi di Meja 01, silakan mengambil pesanan Anda di kasir"*).
- Kasir dapat menandai menu **Habis / Tersedia** khusus untuk cabangnya, yang seketika menghapus cache Redis cabang tersebut.
- Kasir memproses dan memutuskan permohonan pembatalan dari customer.

### 6. Admin Pusat & Cetak QR Meja
- Memantau laporan pendapatan dan volume pesanan lintas cabang.
- Mengatur harga khusus per cabang (`branch_products.price`).
- Mengelola status buka/tutup cabang.
- Generator kartu QR Meja siap cetak (PDF) untuk ditempel di meja kafe.

### 7. Strategi Redis Caching
- Cache katalog menu cabang: `branch:menu:{branch_id}` (TTL 10 menit).
- Rate limit OTP: `otp:ratelimit:{phone}`.
- **Cache Invalidation:** Saat kasir mengubah stok habis atau admin mengubah harga, cache Redis cabang tersebut langsung dibersihkan otomatis.
- **Graceful Fallback:** Jika Redis belum dinyalakan di Laragon, sistem otomatis beralih ke *threadsafe In-Memory Cache* tanpa crash sedikit pun!

---

## ⚡ Cara Menjalankan

### Persiapan:
1. Buka aplikasi **Laragon** dan klik **Start All** (menjalankan MySQL pada port 3306).
2. Jika database `income_db` belum ada, Go backend akan **otomatis membuat database dan mengeksekusi migrasi tabel + data awal dari `database/schema.sql`** saat pertama kali dijalankan.

### Menjalankan Aplikasi:

#### Opsi A: Jalankan Menggunakan Script 1-Klik
- Dobel klik **`run-all.bat`** (otomatis membuka Go Backend & React Vite di window terpisah)
- Atau secara terpisah:
  - Dobel klik **`run-backend.bat`** (menjalankan Go Backend pada `http://localhost:8080`)
  - Dobel klik **`run-frontend.bat`** (menjalankan React + Vite pada `http://localhost:5173`)
- Buka browser di **`http://localhost:5173`**

#### Opsi B: Jalankan Mode Single Binary (All-in-One)
Go backend sudah dilengkapi fitur penyajian SPA build (`frontend/dist`). Cukup jalankan:
```powershell
cd backend
.\server.exe
```
Lalu buka browser di:
👉 **`http://localhost:8080`** (website React dan REST API berjalan dalam 1 port!)

---

## 🔑 Akun Demo Staf & Evaluasi

Untuk mempermudah pengujian, sistem telah menyediakan akun demo siap pakai:

| Role | Nomor WhatsApp | Password | Cabang |
|---|---|---|---|
| **Admin Pusat** | `081111111111` | `admin123` | Seluruh Cabang (Pusat) |
| **Kasir Serang** | `082222222222` | `kasir123` | INCOME Serang Pusat (Cabang 1) |
| **Kasir Cilegon** | `083333333333` | `kasir123` | INCOME Cilegon (Cabang 2) |
| **Customer Demo** | `081234567890` | *(OTP WhatsApp)* | Bebas pilih cabang / scan QR |

*(Di modal login staf, sudah tersedia tombol 1-klik untuk langsung mengisi kredensial di atas tanpa perlu mengetik).*
