# Nalaro Cowork

Kantor virtual 3D untuk sembilan karyawan Nalaro. Dunia dan aktivitas sehari-hari berjalan lokal. Groq menafsirkan perintah yang belum dikenali parser lokal.

## Menjalankan

```bash
npm ci
npm run dev
```

Buka http://127.0.0.1:5173/. Salin `.env.example` ke `.env` untuk mengaktifkan Groq:

```env
GROQ_API_KEY=isi_key_milikmu
GROQ_MODEL=openai/gpt-oss-20b
```

Mulai ulang Vite setelah mengedit `.env`. Proxy `/api/plan` dan `/api/health` berjalan bersama Vite. Key hanya dibaca oleh Node. Jangan gunakan prefix `VITE_` untuk key. Status koneksi berada dalam Pengaturan dan menunjukkan keberadaan konfigurasi, bukan keberhasilan autentikasi ke Groq.

## Menggunakan kantor

Kantor memenuhi layar. Toolbar SVG di kanan atas membuka Karyawan, Perintah, Objek, Riwayat, dan Pengaturan. Panel krem memakai garis dan bayangan tegas; tidak ada sidebar permanen atau glassmorphism. Escape atau klik di luar panel untuk menutupnya.

Scroll/cubit untuk zoom, geser untuk orbit, klik kanan dan geser untuk pan. Kontrol +/- dan reset berada di kanan bawah. Pilih karyawan, lalu **Dekati** untuk fokus ke aktivitasnya. Nama ditampilkan untuk karyawan yang dipilih/ditunjuk; aktifkan **Semua nama** jika dibutuhkan.

Mezzanine sayap kanan dapat didatangi melalui tangga. Ruang rapat dan lounge atas berada di sana. Matikan **Lantai atas** untuk melihat area di bawahnya. Pilihan **Jeda simulasi** menghentikan aktivitas dunia; preferensi sistem reduced motion memulai simulasi dalam keadaan jeda.

## Perintah

```text
@ulum datangi siswo dan suruh dia push up
@adi dan @sumanto melambai
@agil buat kopi untuk ulum
@ulum minum kopi
@ulin bersihkan meja ulum
@huda naiki kursi lalu kembali ke meja
@fadil pergi ke ruang meeting lalu kembali ke meja
@fadil ambil document_finance lalu taruh di meja ulum
```

Aksi dijalankan sesuai urutan, termasuk pergantian pelaku. Pengantar mendatangi penerima dan berbicara sebelum penerima melakukan instruksi. Pengambilan, pembuatan, pengantaran, dan konsumsi kopi memperbarui kepemilikan serta isi cangkir. Kegagalan satu aksi membatalkan sisa rangkaian tersebut dan dilaporkan di Riwayat.

Klik benda atau buka Objek untuk melihat dan menyalin ID. Meja, kursi, monitor, printer, dokumen, cangkir, tablet, sapu, dan perabot lain memiliki ID tetap. Benda portabel memiliki satu pemilik. Kursi yang sedang digunakan tidak bisa dinaiki orang lain.

Untuk gestur di luar grammar lokal, Groq dapat menyusun `animate` dari 18 pose: misalnya berlutut, mengelap, mengangguk, menunjuk, jongkok, atau merayakan. Rangkaian dibatasi 6 klip dan 45 detik. Ini komposisi gerakan dasar yang tersedia, bukan eksekusi kode AI atau sintesis fisika bebas. Gerakan push up, pembersihan meja, dan naik/turun kursi juga tersedia sebagai aksi khusus.

## Implementasi

- `src/office.js`: geometri, material, registry objek, collider per lantai, A*.
- `src/avatars.js`: rig siku/lutut, transisi pose, tempo dan fase karakter.
- `src/behaviors.js`: idle sesuai pekerjaan, antrean dependensi, kepemilikan objek, navigasi tangga.
- `src/action-contract.js`: kontrak aksi, JSON Schema dan validator bersama server/browser.
- `src/commands.js`: grammar lokal, rangkaian dan delegasi, fallback Groq.
- `src/main.js`: toolbar/popup, kamera dan pemilihan objek/karyawan.
- `server/groq.mjs`: structured output, validasi semantik, percobaan ulang terbatas, timeout/rate limit.

Detail arsitektur dan batasan ada di [docs/OFFICE_V04.md](docs/OFFICE_V04.md).

## Verifikasi

```bash
npm test
npm run build
```

Test mencakup validasi JSON, perbaikan respons model dengan mock provider, delegasi, perpindahan lantai, inventori, kopi, pembersihan, naik/turun kursi, stop, serta 10 menit simulasi idle. Pengujian live Groq membutuhkan API key dan koneksi pengguna.

WebGL2 diperlukan. Pilihan grafis Hemat mengurangi resolusi render. Geometri statis dan bagian rig digabung berdasarkan material untuk menekan draw call. Avatar tetap bergaya voxel; belum memakai IK penuh, rigid body, atau animasi motion capture. Agen tidak memiliki akses ke GitHub atau aplikasi kerja eksternal.
