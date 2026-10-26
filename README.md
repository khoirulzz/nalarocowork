# Nalaro Cowork

Kantor virtual 3D Minecraft/Roblox-inspired untuk tim Nalaro. Simulasi berjalan lokal di browser, **Groq hanya dipakai untuk menafsirkan perintah bahasa natural yang belum dikenali parser lokal**.

### Mulai (satu terminal)

```bash
git clone https://github.com/khoirulzz/nalarocowork.git
cd nalarocowork
npm install
npm run dev
```

Buka **http://127.0.0.1:5173/**. Tanpa API key sekalipun dunia 3D, animasi idle, dan perintah umum tetap berjalan.

### Mengaktifkan Groq

Copy `.env.example` menjadi `.env`, lalu isi:

```env
GROQ_API_KEY=gsk_isi_key_milikmu
GROQ_MODEL=openai/gpt-oss-20b
```

**Restart `npm run dev` setelah mengubah `.env`.** Sejak v0.3, tidak perlu `npm run server` pada terminal kedua: proxy Groq berjalan dalam proses Vite melalui `vite.config.js` dan endpoint same-origin `/api/plan` / `/api/health`. Kunci hanya dibaca pada sisi Node, tidak dikirim ke browser. Jangan menggunakan prefix `VITE_` untuk API key.

Status **Groq siap** ditampilkan di bagian kanan atas bila key sudah terbaca. Model mungkin tetap menolak perintah yang tidak punya aksi fisik di dunia 3D. Ada validasi tambahan pada keluaran model.

### Cara mencoba

```
@fadil samperin lukman lalu suruh berdiri
@adi pergi ke ruang meeting
@agil buat kopi untuk ulum
@ulin bersihkan ruang owner
@fadil ambil dokumen finance lalu taruh di ruang owner
@ulum melambaikan tangan
```

Panel kiri berisi karyawan, panel kanan berisi komando. Masing-masing bisa di-collapse. Klik **Riwayat** untuk drawer aktivitas atau **Objek** untuk melihat ID objek dan properti dasar. Hanya nickname karyawan yang melayang di dalam ruang kantor.

### Perubahan penting v0.3
- Flat white SaaS UI; tidak ada badge/teks dekoratif di dunia kantor; sidebar kiri-kanan collapsible.
- Ruangan lebih luas: kantor owner dan rapat tertutup dengan partisi kaca dan pintu, finance, creative, tech, area kerja terbuka, pantry, lounge.
- Behavior idle berbobot: pekerja lebih lama mengetik/duduk; OB membersihkan zona secara bergiliran. Perilaku idle tidak memusatkan karyawan di satu target.
- Navigasi A* melalui bukaan partisi; runtime steering menghindari karyawan lain dan mencoba rerouting sebelum bergerak lagi.
- Semua furnitur/props diberi ID dari registry `WORLD_OBJECTS`. Perintah awal mengambil benda portabel, membuat kopi, meletakkan/menyerahkan benda, membersihkan area.
- Groq proxy langsung tersedia lewat `npm run dev`; .env tetap tidak dikomit.

### Struktur kode
```
src/
  main.js      # Three.js & owner dashboard
  office.js    # world, doors, asset registry, navigation
  roster.js    # 9 employees, spots and roles
  avatars.js   # articulated procedural voxel avatars
  behaviors.js # role-aware idle schedule & interactions
  commands.js  # local commands and strict validated Groq plan
  styles.css
server/groq.mjs # Groq API / rate control
vite.config.js  # runs local Groq proxy with Vite
```

### Performa dan batasan

Three.js/WebGL2 harus didukung. Pengaturan grafis **Hemat** menurunkan render pixel ratio. Profil FPS aktual bergantung GPU laptop pengguna. Sistem perilaku dan penghindaran tabrakan ini adalah langkah MVP; belum ada physics rigid-body penuh, IK realistis, atau pengujian perilaku sepanjang berjam-jam. Beberapa animasi objek masih disimulasikan dengan proxy tangan sederhana, bukan gerakan manusia sinematik. Aset berbasis foto asli teman tidak dimasukkan ke repo publik.

Aplikasi **belum memiliki akses ke repo NalaroStore atau tools eksternal lain**. Integrasi proyek nanti perlu sandbox dan approval.

## Pengujian UI dan Groq (2026-10-26)
Tampilan menggunakan panel karyawan/owner yang bisa ditutup, sidebar riwayat, serta daftar ID objek.
Kantor telah diperluas, ruang owner/finance/meeting diberi sekat, sementara OB bergerak di area umum.
Idle dan animasi berasal dari aturan lokal, **bukan token Groq**. Anti-crowd menghindari penumpukan pada spot idle dan menghindari overlap antar-NPC.

Jalankan cukup `npm run dev` untuk menggunakan middleware Groq pada Vite. File `.env` berada di root repo dan memuat `GROQ_API_KEY=gsk_...`; **restart Vite** setelah mengedit `.env`. Tidak perlu `npm run server` kedua untuk mode dev. Indikator akan menampilkan `Groq siap` setelah `/api/health` membaca key. Ini hanya mengecek keberadaan key, **bukan** memastikan kredensial valid: perintah Groq pertama akan menguji jaringan serta key. Jangan pernah menyimpan key di `VITE_*` atau meng-commit `.env`.

Jika status tetap belum terkonfigurasi, cek apakah file benar bernama `.env` (bukan `.env.txt`) dan apakah Vite dijalankan dari folder repo. Perintah `@fadil samperin lukman dan suruh berdiri` tidak membutuhkan Groq; perintah di luar grammar lokal memakai /api/plan.
