# Office v0.4

## Tampilan

Satu canvas mengisi viewport desktop maupun mobile. Toolbar dan kontrol kamera berada di atas dunia. Panel native dialog mendukung Escape, focus trap, kembali ke pemicu, serta scroll internal. Tidak ada label diagnostik pada tampilan utama; FPS dan status konfigurasi Groq berada di Pengaturan.

Lantai batu memakai satu tekstur marmer prosedural deterministik. Oak, inlay kuningan, sekat kaca berbingkai, lemari, lampu meja, papan, sofa dan tanaman dibuat dari geometri ringan. Mezzanine hanya menutup sayap kanan sehingga ruang kerja bawah tetap terlihat. Tidak ada unduhan model/aset eksternal.

## Navigasi

Lantai dasar memakai x [-16.3,16.3], z [-11.35,11.25]. Mezzanine memakai x [8.6,16], z [-11.2,1.1], elevasi 3.65. Collider terpisah per lantai. Perpindahan lantai terdiri dari A* ke ujung tangga, interpolasi tangga, lalu A* pada lantai tujuan. Target tak tercapai atau jalur yang tidak mengalami kemajuan membatalkan aksi, bukan memalsukan kedatangan.

Karyawan yang terlibat dalam instruksi berikutnya ditahan dari idle supaya penerima instruksi tidak berjalan pergi saat pengantar tiba. Aktor yang membawa barang mempertahankan pose lengan. Follow memantau target selama durasi terbatas. Stop menghentikan aksi berjalan beserta dependensi pada rangkaian yang sama.

## Gerakan

Idle dipilih acak berbobot per pekerjaan dengan penalti pengulangan, durasi acak, serta tempo/fase rig per karakter. Teknisi memeriksa peralatan, desainer membuat sketsa, akuntan membaca berkas/menghitung, support bergantian mengetik dan mendengarkan telepon. OB memilih area umum, menyapu/mengelap dan beristirahat. Tujuan idle direservasi untuk mencegah berkumpul di satu titik.

Rig memiliki siku dan lutut; pose diinterpolasi dengan exponential smoothing. Telepon, kertas, kain dan sapu muncul sesuai aktivitas. Perintah naik kursi menginterpolasi posisi dan tinggi ke dudukan. Aksi berikutnya yang memerlukan lantai menyisipkan turun kursi sebelum melanjutkan. Push up mencari ruang kosong termasuk jarak dari kursi dan karyawan, lalu menggunakan animasi badan horizontal.

`animate` menyusun pose whitelist, tanpa JavaScript, eval, akses jaringan, atau koordinat bebas dari model. Setiap klip memiliki pose, seconds dan repeat. Fase pose mengikuti durasi dan pengulangan klip. Ini bukan sistem yang menciptakan animasi anatomis tak terbatas.

## Kontrak AI

Satu sumber kebenaran: `action-contract.js` untuk daftar aksi, pose, JSON Schema dan validator. Setiap langkah memiliki `actor`, `action`, `target`, `location`, `objectId`, `duration`, `motion`; field yang tidak dipakai berisi null. Batas: 16 aksi, 6 klip per animate, total gerakan maksimal 45 detik. Nilai enum, properti ekstra, objek portabel, tujuan dan kemampuan naik kursi diperiksa lagi di server dan browser.

Server membangun katalog dari dunia yang sama; daftar objek kiriman browser tidak menjadi otoritas ID. Strict structured output adalah pilihan pertama. Model yang menolak format schema dapat memakai JSON object mode, tetap dengan validator identik. JSON terpotong/invalid atau semantik yang salah memicu regenerasi terbatas; maksimal dua panggilan upstream total. Respons tetap invalid dikembalikan sebagai 422 tanpa dispatch. Timeout 42 detik, input maksimal 1.500 karakter/24 KB, maksimal dua permintaan bersamaan.

Perintah lokal majemuk hanya diterima jika seluruh klausa dikenal. Klausa tak dikenal mengalihkan seluruh permintaan ke AI sehingga instruksi akhir tidak terbuang diam-diam.

## Validasi dan batasan

- Unit/integrasi: grammar, kontrak, mock Groq, delegasi aktual, kopi/inventori, navigasi dua arah tangga, kursi, stop, dan simulasi idle 10 menit.
- Browser: viewport desktop 1440×960, mobile 390×844 dan 375×812; popup, pencarian, fokus karyawan, kirim perintah lokal dan Escape; tidak ada pageerror pada pemeriksaan.
- Penggabungan geometri menurunkan draw call adegan uji dari 1.159 menjadi sekitar 450, tanpa menggabungkan objek interaktif atau menghilangkan cutaway lantai atas. Ini bukan tolok ukur FPS perangkat pengguna.
- Provider Groq diuji dengan mock; panggilan live belum diverifikasi tanpa API key. Tidak ada klaim bahwa keberadaan key menjamin autentikasi.
- Sistem tetap procedural voxel. Body/prop contact memakai pose pendekatan, bukan IK/physics penuh. Tidak ada persistence inventori lintas reload, pekerjaan eksternal sungguhan, atau speech synthesis.
- Audit UI: tanpa badge dekoratif, glassmorphism, judul pengisi, teks status palsu, dan placeholder visual. Ukuran teks dibuat padat untuk kontrol aplikasi, dengan kontras dan focus state. Semua ikon toolbar memiliki accessible name.
