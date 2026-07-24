# 📜 Standard Operating Procedure (SOP): Panduan Menjalankan MAKNA Grid (3-Node Cluster)

**Dokumen**: Standard Operating Procedure (SOP)  
**Sistem Target**: MAKNA Grid (AI Video Content Generator Multi-Node Cluster)  
**Versi SOP**: 1.0  
**Tanggal Rilis**: 24 Juli 2026  
**Status**: Authoritative & Active  

---

## 📌 1. Pendahuluan & Filosofi Operasional

MAKNA Grid menggunakan **Decoupled 3-Node Architecture** untuk memisahkan beban kerja antarmuka pengguna (UI/Gemini AI), pemrosesan GPU/Video Render, dan penyimpanan data terpusat (Database/Storage Vault).

Panduan ini mengatur tata cara standar untuk mengaktifkan, menguji, dan memelihara seluruh node cluster agar beroperasi secara harmonis dan bebas hambatan (*seamless execution*).

---

## 📐 2. Ringkasan Topologi Cluster & SSH Quick Access

| Node | Peran Cluster | Operating System | IP Address | Port Utama | SSH Command | Path Repository |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Node 1** | **UI Gateway** | Ubuntu Desktop (NUC) | `100.65.62.63` | `:3000` (Web UI) | `ssh makna-ui` | `/home/sabeqmursyid/makna-grid` |
| **Node 2** | **Worker GPU** | Windows PC | `100.117.59.92` | `:3000` (Worker Engine), `:8765` (G-Labs) | `ssh vibe-server -p 2222` | `D:\server\makna-grid` |
| **Node 3** | **DB & Vault** | Linux Storage | `100.78.186.123` | `:3001` (ContentFlow), `:5432` (PostgreSQL) | `ssh makna-db` | `/var/www/contentflow` |

---

## ⚙️ 3. Konfigurasi Variable Lingkungan (`.env.local`)

Sebelum startup, pastikan file `.env.local` pada masing-masing node telah sesuai dengan spesifikasi arsitektur:

### 🖥️ Node 1 (Ubuntu Gateway UI — `100.65.62.63`)
```env
NODE_ENV=production
NODE_ROLE=gateway
ENABLE_SCHEDULER_WORKER=false
PORT=3005
DATABASE_HOST=100.78.186.123
CONTENT_FLOW_API_URL=http://100.78.186.123:3001/api/v1/content/ingest
```
> **Catatan Port**: Untuk pengujian lokal di komputer development agar tidak bentrok dengan `maknagen` yang menggunakan Port `3000`, gunakan Port **`3005`** (`PORT=3005`). Node 1 **TIDAK** menjalankan Background Queue Worker (`ENABLE_SCHEDULER_WORKER=false`).

### 💻 Node 2 (Windows Worker GPU — `100.117.59.92`)
```env
NODE_ENV=production
NODE_ROLE=worker
ENABLE_SCHEDULER_WORKER=true
PORT=3000
WEBHOOK_PORT=8765
WEBHOOK_HOST=127.0.0.1
DATABASE_HOST=100.78.186.123
CONTENT_FLOW_API_URL=http://100.78.186.123:3001/api/v1/content/ingest
```
> **Catatan**: Node 2 bertindak sebagai mesin komputasi GPU yang mengeksekusi T2I (Start Frame PNG), I2V (Video Veo MP4), TTS Studio, dan Muxing FFmpeg Smart Sync.

---

## 🚀 4. Urutan Menjalankan Cluster (Startup Sequence)

Ikuti urutan startup berantai berikut untuk memastikan ketergantungan database dan GPU webhook siap sebelum menerima beban kerja:

### 🟢 Langkah 1: Aktivasi Node 3 (Storage & Central DB Master)
1. Sambungkan via SSH:
   ```bash
   ssh makna-db
   ```
2. Pastikan layanan PostgreSQL dan ContentFlow Ingestion Service aktif pada port `:5432` dan `:3001`.
3. Verifikasi API Ingestion endpoint:
   ```bash
   curl -I http://100.78.186.123:3001/api/v1/content/ingest
   ```
   *(Ekspektasi response: HTTP 405 Method Not Allowed / HTTP 200 OK).*

---

### 🟢 Langkah 2: Aktivasi Node 2 (Windows Worker GPU Compute)
1. Sambungkan via SSH ke Windows PC:
   ```bash
   ssh vibe-server -p 2222
   ```
2. **Pastikan Aplikasi G-Labs Webhook Aktif**:
   - Pastikan G-Labs local server telah berjalan di Windows pada `http://127.0.0.1:8765`.
3. **Inisialisasi Environment Worker**:
   - Jalankan skrip bootstrap atau persiapkan file `.env.local`:
     ```cmd
     scripts\setup-node2-worker.bat
     ```
4. **Jalankan Worker Service**:
   ```cmd
   cd D:\server\makna-grid
   npm run dev
   ```
5. Node 2 akan mulai melakukan polling ke Central DB (Node 3) untuk memproses queue item berstatus `approved` atau `pending`.

---

### 🟢 Langkah 3: Aktivasi Node 1 (Ubuntu UI Gateway)
1. Sambungkan via SSH ke NUC Gateway:
   ```bash
   ssh makna-ui
   ```
2. **Inisialisasi Environment Gateway**:
   ```bash
   bash scripts/setup-node1-gateway.sh
   ```
3. **Jalankan UI Gateway Service**:
   ```bash
   cd /home/sabeqmursyid/makna-grid
   npm run dev
   ```
4. Akses Web UI melalui browser di: `http://100.65.62.63:3000` (atau `http://localhost:3000` jika diakses secara lokal di Node 1).

---

## 🩺 5. Uji Kesehatan & Inspeksi Cluster Real-Time

Setiap kali cluster diaktifkan atau setelah pembaruan kode, **WAJIB** mengeksekusi skrip pengujian kesehatan cluster:

```bash
node scripts/test-cluster-health.js
```

### 📋 Checklist Verifikasi Standar (Clean Pass):
- [ ] **Node 1 (Gateway)**: `Role: GATEWAY` | `Worker Polling: NO 🚫`
- [ ] **Node 2 (Worker)**: `Role: WORKER` | `Worker Polling: YES ✅` | `G-Labs Webhook: RESPONDING`
- [ ] **Node 3 (Storage/DB)**: `Central DB: CONNECTED` | `ContentFlow API: ONLINE`

---

## 🛠️ 6. Troubleshooting & Isolasi Sistem Legacy

1. **G-Labs Webhook Tidak Merespon di Node 2**:
   - Pastikan software G-Labs berjalan di sesi UI Windows (`127.0.0.1:8765`).
   - Uji koneksi lokal G-Labs: `curl http://127.0.0.1:8765/health`.
2. **Isolasi Terhadap System Legacy (`maknagen`)**:
   - MAKNA Grid berjalan di folder terpisah (`_makna-grid` & `D:\server\makna-grid`).
   - Database MAKNA Grid terpisah (`data/makna_grid.db` / Central DB `makna_grid`).
   - G-Labs Webhook (`127.0.0.1:8765`) bersifat stateless dan melayani `makna-grid` secara independen.

---

## 🔄 7. SOP Rilis Pasca-Perubahan Kode

Setelah menyelesaikan perbaikan atau penambahan fitur di `makna-grid` dan verifikasi `test-cluster-health.js` berhasil:
Jalankan rilis non-interaktif otomatis:

```bash
npm run release-non-interactive -- --type patch --title "Judul Perubahan" --points "Detail poin 1|Detail poin 2"
```

---
*Dokumen ini merupakan SOP Resmi Operasional MAKNA Grid Multi-Node Cluster.*
