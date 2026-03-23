# 🐉 DragonBall HTML5 - Client-Side Development Guide

Dokumentasi ini dirancang sebagai panduan teknis bagi pengembang atau asisten AI untuk melanjutkan fitur yang belum lengkap pada proyek game berbasis **Egret Engine** ini.

## 📋 Ringkasan Proyek
* **Status:** Seluruh aset visual (images), audio (sounds), dan konfigurasi resource sudah lengkap.
* **Teknologi:** Menggunakan Egret Engine (WebGL) dengan sistem UI berbasis EUI (`gameEui.json`) dan animasi DragonBones.
* **Arsitektur:** Proyek ini bersifat **Client-Side Only**. Tidak menggunakan Node.js, Python, Bun, atau framework backend lainnya.

## 🛠️ Instruksi Pengembangan (Penting untuk AI)
Jika Anda diminta untuk menambah fitur (seperti sistem login lokal, manajemen data pemain, atau logika battle), harap patuhi aturan berikut:

1. **External JS Files Only:** Jangan menulis logika panjang di dalam tag `<script>` pada `index.html`. Buatlah file `.js` baru`.

2. **Bridge via Index:** Gunakan tag `<script>` di `index.html` **hanya** sebagai jembatan untuk memuat file JavaScript eksternal tersebut.


3. **Vanilla JavaScript:** Gunakan API browser standar. Dilarang menggunakan library yang memerlukan runtime server-side (seperti `fs` di Node.js, Bun, Next.js), karena saya hanya pengguna android yg belum root jadi keterbatasan dalam mengelola server . jadinya hanya bisa pakai cara ini . 

4. **Egret Interface:** Gunakan `egret.ExternalInterface.call` dan `egret.ExternalInterface.addCallback` untuk menghubungkan logika JavaScript luar dengan mesin game internal.

## 📁 Referensi Struktur Utama
* **`index.html`**: Mengatur parameter global (`loginServer`, `clientParams`) dan menginisialisasi `egret.runEgret`.
* **`manifest.json`**: Menentukan urutan pemuatan seluruh library dan skrip logika game.
* **`default.res-en.json`**: Berisi pemetaan lengkap semua aset yang digunakan dalam game.
* **`gameEui.json`**: Konfigurasi untuk skin UI dan tema antarmuka.

---
**Catatan Tambahan:** 

- Fokuslah pada pengembangan modular di mana setiap fitur baru dipisahkan ke dalam file JavaScript tersendiri.

- Mohon analisa dulu file yg ada, jangan buru-buru untuk membuat code dan menganggap semua ini sangat mudah, karena game ini sangat kompleks kita harus teliti dan mohon dengan sangat pahami alurnya, jangan pernah ragu untuk bertanya 

- kita akan menjalankan game ini via browser & localwebserver biasa di android dengan port 9999 

- ada pertanyaan lain mohon tanyakan dulu sampai jelas


