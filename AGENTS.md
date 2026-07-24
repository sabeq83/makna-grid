<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SOP Rilis & Auto Git Sync MAKNA Grid

**Target Repository**: `https://github.com/sabeq83/makna-grid.git`

Setiap kali Anda selesai mengimplementasikan fitur, melakukan refaktorisasi, atau memperbaiki bug (setelah tahap verifikasi berhasil), Anda **WAJIB** melakukan prosedur rilis dan sinkronisasi berikut tanpa perlu menunggu instruksi terpisah dari pengguna:

1. **Jalankan Perintah Rilis Tanpa Interaktif (Sangat Direkomendasikan)**:
   - Gunakan perintah rilis non-interaktif untuk mengupdate versi, changelog, commit, tag, dan push otomatis:
     ```bash
     npm run release-non-interactive -- --type patch --title "Judul Rilis Singkat" --points "Poin perubahan 1|Poin perubahan 2"
     ```
   - Parameter yang didukung:
     - `--type`: `patch` (default), `minor`, atau `major`
     - `--title`: Judul rilis singkat
     - `--points`: Poin-poin perubahan dipisahkan oleh tanda pipa (`|`)

2. **Checklist Rilis**:
   - Pastikan versi yang dirilis selaras dengan riwayat versi terbaru pada [sot/global/changelog.md](file:///Users/sabeqmmursyid/_makna-grid/sot/global/changelog.md).
   - Verifikasi bahwa tag rilis (`vX.Y.Z`) dan branch `main` telah terunggah dengan sempurna ke remote repository `https://github.com/sabeq83/makna-grid.git`.

# SOP Inspeksi Multi-Node Server (3-Node Topology)

Gunakan prosedur ini untuk menguji kesehatan atau menginspeksi server 3-node MAKNA Grid:

1. **Konfigurasi SSH & Port**:
   - Node 1 (Ubuntu Gateway): `ssh makna-ui` (`100.65.62.63`)
   - Node 2 (Windows Worker): `ssh vibe-server` (`100.117.59.92`, Port 2222)
   - Node 3 (Storage & DB): `ssh makna-db` (`100.78.186.123`)

2. **Uji Kesehatan Cluster Real-Time**:
   ```bash
   node scripts/test-cluster-health.js
   ```

# Strategic Campaign Engine Architecture Rule

- Strategic Campaign di MAKNA sepenuhnya menggunakan **Single-Pass Engine (1-Call Architecture)**. Dalam 1x call API ke Gemini AI, sistem sekaligus menghasilkan Storyboard, Naskah Voice-Over, 10 Parameter Video DNA, dan Social Media Package (Caption, Hashtags, CTA).
- Pemanggilan **Call 2 secara terpisah SUDAH TIDAK DIGUNAKAN (DEPRECATED)** dalam pipeline eksekusi otomatis (`processStrategicGenerator`).
