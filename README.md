# 💰 Kas Kelas XI RPL

Aplikasi kas kelas modern: login **murid** & **admin**, iuran, pembayaran **QRIS** + upload bukti, verifikasi bendahara, catatan pemasukan/pengeluaran, statistik, dan laporan CSV.

Dibuat dengan **React + Vite**.

---

## 🚀 Menjalankan di komputer

Butuh [Node.js](https://nodejs.org) (versi 18+).

```bash
npm install     # sekali saja, memasang dependensi
npm run dev     # jalankan mode pengembangan → buka http://localhost:5173
npm run build   # membuat versi produksi di folder /dist
```

**PIN admin awal: `1234`** (ganti lewat menu Kelola → Pengaturan setelah masuk).

---

## ☁️ Menaruh online gratis (GitHub Pages)

1. Upload proyek ini ke sebuah repository GitHub (lihat langkah di bawah).
2. Di repo, buka **Settings → Pages**.
3. Bagian **Build and deployment → Source**, pilih **GitHub Actions**.
4. Setiap kali kamu push ke branch `main`, situs otomatis ter-build & online.
   Alamatnya: `https://<username>.github.io/<nama-repo>/`

Workflow-nya sudah disiapkan di `.github/workflows/deploy.yml`.

---

## ⚠️ Penting soal penyimpanan data

Versi ini menyimpan data di **localStorage browser** — artinya data **tersimpan per perangkat/browser**, tidak otomatis tersinkron antar HP.

Jadi untuk pemakaian nyata "satu kelas satu database bersama" (admin di HP-nya, murid di HP masing-masing, semua lihat data sama), kamu perlu backend seperti **Firebase** atau **Supabase** (gratis). Struktur kodenya sudah rapi untuk itu — bagian `sGet`/`sSet` di `src/App.jsx` tinggal diganti pemanggilan ke database.

---

## 📁 Struktur

```
├─ index.html
├─ package.json
├─ vite.config.js
├─ src/
│  ├─ App.jsx        ← seluruh aplikasi
│  ├─ main.jsx
│  └─ index.css
└─ .github/workflows/deploy.yml
```
