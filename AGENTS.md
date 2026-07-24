<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SOP Pasca-Update: Rilis & Sinkronisasi Git Otomatis

Setiap kali Anda selesai mengimplementasikan fitur, melakukan refaktorisasi, atau memperbaiki bug (setelah tahap verifikasi berhasil), Anda **WAJIB** melakukan prosedur rilis dan sinkronisasi berikut tanpa perlu menunggu instruksi terpisah dari pengguna:

1. **Jalankan Perintah Rilis Tanpa Interaktif (Sangat Direkomendasikan)**:
   - Gunakan perintah rilis non-interaktif untuk menghindari dialog interaktif yang memerlukan `send_input`:
     ```bash
     npm run release-non-interactive -- --type patch --title "Judul Rilis Singkat" --points "Poin perubahan 1|Poin perubahan 2"
     ```
   - Contoh penggunaan:
     ```bash
     npm run release-non-interactive -- --type patch --title "Fix Image Path Resolution" --points "Memperbaiki fileToBase64 path resolution di API regenerate|Mengganti image model ke nano_banana_pro"
     ```
   - Parameter yang didukung:
     - `--type`: `patch` (default), `minor`, atau `major`
     - `--title`: Judul rilis singkat
     - `--points`: Poin-poin perubahan dipisahkan oleh tanda pipa (`|`)

2. **Metode Alternatif (Interaktif)**:
   - Gunakan `npm run release` jika ingin berinteraksi secara manual menjawab pertanyaan rilis melalui stdin menggunakan action `send_input` pada tool `manage_task` secara sekuensial.

3. **Daftar Check-off Rilis**:
   - Pastikan versi yang dirilis selaras dengan riwayat versi terbaru pada [sot/global/changelog.md](file:///Users/sabeqmmursyid/_maknagen/sot/global/changelog.md).
   - Pastikan changelog telah merinci fitur-fitur baru dengan format yang rapi dan informatif sebelum push dilakukan.
   - Verifikasi bahwa rilis tag (`git push origin v[versi]`) telah terunggah dengan sempurna ke remote repository.

# SOP Inspeksi Database Server Produksi (Windows - vibe-server)

Gunakan prosedur ini setiap kali pengguna memberikan instruksi untuk melakukan inspeksi/checking database produksi atau mencari penyebab kampanye terhenti:

1. **Konfigurasi SSH & Port**:
   - Host target: `vibe-server` (sudah terdaftar di `~/.ssh/config` dengan port `2222` dan user `Sabeq`).
   - Tes koneksi remote: `ssh vibe-server "echo Connected"`

2. **Metode 1: Salin Database ke Lokal (Safe Inspection)**:
   - Lokasi database di Windows PC: `D:\server\maknagen\data\makna.db`
   - AI **DILARANG** melakukan modifikasi/write langsung ke database remote menggunakan metode salin ini.
   - Salin file database ke Mac lokal menggunakan perintah:
     ```bash
     scp vibe-server:"D:/server/maknagen/data/makna.db" ./makna_production.db
     ```

3. **Metode 3: Menggunakan Helper Script Lokal (Sangat Direkomendasikan untuk Menghindari Prompt Izin Berulang)**:
   - Gunakan skrip pembungkus (wrapper helper) lokal `scripts/prod-db.js` untuk interaksi database. Ini mempersingkat perintah dan mengurangi perlunya menyetujui popup izin manual yang berulang-ulang di IDE.
   - **Query/Read Data**:
     ```bash
     node scripts/prod-db.js query "SELECT id, campaign_name, status FROM re_campaigns;"
     ```
   - **Download/Salin Database**:
     ```bash
     node scripts/prod-db.js download
     ```

4. **Gunakan Script Query Lokal** (Jika menggunakan Metode 1):
   - Buat skrip sementara (`scratch/check_production_db_local.js`) untuk memuat data lokal `./makna_production.db` menggunakan `better-sqlite3`.
   - Query informasi berikut secara detail:
     - Status Kampanye (`status` di `re_campaigns` — periksa apakah statusnya `running`, `paused`, dll.).
     - Status Item Kampanye (`scrape_status`, `analyze_status`, `workflow_status`, `retry_count` di `re_campaign_items` untuk melacak baris mana yang terhenti/gagal).
     - Log Error (`system_audit_logs` berdasarkan `reference_id` or `created_at` terbaru).

5. **Pembersihan Workspace (Cleanup)**:
   - Setelah selesai melakukan analisis menggunakan Metode 1, AI **WAJIB** menghapus berkas `./makna_production.db` dan skrip query sementara menggunakan perintah `rm` agar workspace tetap bersih.

# Strategic Campaign Engine Architecture Rule

- Strategic Campaign di MAKNA sepenuhnya menggunakan **Single-Pass Engine (1-Call Architecture)**. Dalam 1x call API ke Gemini AI, sistem sekaligus menghasilkan Storyboard, Naskah Voice-Over, 10 Parameter Video DNA, dan Social Media Package (Caption, Hashtags, CTA).
- Pemanggilan **Call 2 secara terpisah SUDAH TIDAK DIGUNAKAN (DEPRECATED)** dalam pipeline eksekusi otomatis (`processStrategicGenerator`). Jangan menyajikan Call 2 sebagai bagian dari alur aktif saat menganalisis atau menjelaskan alur Strategic Campaign.


