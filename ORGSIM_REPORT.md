# Laporan Analisis: OrgSim Engine v4.1.0

## 1. Ringkasan Eksekutif
**OrgSim Engine** adalah platform simulasi multi-agen tingkat enterprise yang dirancang untuk pengujian tekanan stres strategi (*strategic stress-testing*) tingkat C-Suite. Aplikasi ini menggunakan model **Gemini 3.1 Pro** untuk memfasilitasi negosiasi alokasi anggaran dan sumber daya antara 4 persona AI yang berbeda (CFO, CMO, CTO, Auditor), dengan kemampuan menelan berbagai format file untuk analisis konteks (*Multi-format Ingestion*).

## 2. Arsitektur Sistem
Aplikasi ini menggunakan arsitektur **Full-Stack** untuk mengatasi kerentanan keamanan (seperti API key di sisi klien) dan memberikan lapisan validasi logika yang lebih ketat.

**Teknologi Utama:**
* **Frontend:** React 19, TypeScript, Tailwind CSS v4, Framer Motion (Animasi transisi UI), D3.js (Visualisasi Graf Node Relasional).
* **Backend:** Express.js yang dieksekusi secara konkuren melalui `server.ts` pada port 3000 (bersama dengan *Vite middleware*).
* **AI Engine:** Google Gen AI SDK (`@google/genai`) dengan model `gemini-3.1-pro-preview`.
* **Ekstraksi Dokumen Klien:** `xlsx` (Excel/CSV), `mammoth` (Word/DOCX). Ekstraksi dilakukan di browser, dan dikirimkan sebagai teks mentah atau Base64 ke server.
* **Persistensi Data:** `localStorage` digunakan sebagai database *lightweight* untuk menyimpan riwayat simulasi (`storageService.ts`).

## 3. Fitur Utama & Alur Kerja

### A. Mekanika Multi-Agen (C-Suite Personas)
Setiap agen memiliki fokus, kerangka acuan, dan spesialisasi data yang unik:
1. **Eleanor (CFO):** Konservatif dan fokus pada ROI & COGS. *Mandatory Constraint:* Sangat bergantung pada angka dari unggahan Excel/CSV untuk memonitor margin.
2. **Marcus (CMO):** Agresif dalam akuisisi pangsa pasar. Menonjolkan argumen dari narasi dokumen Word/PDF.
3. **Sarah (CTO):** Bertanggung jawab atas utang teknis dan stabilitas infrastruktur. Menganalisis *dashboard* metrik dari unggahan Gambar/Screenshot.
4. **The Auditor (Governance & Security):** Wasit netral berbasis protokol *Lobster Trap*. Melakukan pengecekan silang (*cross-checks*) antara data tabuler numerik (*Excel*) terhadap klaim di dalam dokumen strategis (*Word/PDF*) untuk mencari kontradiksi dan celah keamanan/logika.

### B. Ingesti Data Kontekstual (Multimodal Grounding)
* Frontend mendukung *file picker* untuk format: `.pdf`, `.docx`, `.xlsx`, `.csv`, `.txt`, dan format gambar.
* Saat dokumen diunggah, `SimulationControls.tsx` menjalankan _parser_ lokal:
  * File gambar dan PDF diubah ke **Base64** untuk kemampuan kapabilitas *Vision* milik Gemini.
  * Excel/CSV diurai dengan `xlsx` menjadi string JSON.
  * Dokumen Word diambil murni menjadi string teks dengan `mammoth`.

### C. Alur Algoritma Simulasi
1. **Pembangkitan Konteks (`/api/context`):** Sistem mensimulasikan lingkungan bisnis abstrak (Tren Pasar, Keuangan, Lansekap Teknis) berdasarkan "Tujuan/Objective" yang disetor pengguna.
2. **Fase Pembuka (Round 1):** Agen menyatakan strategi awal.
3. **Guncangan Eksternal (Round 2 - Black Swan):** Prompt sistem memaksa AI menghasilkan peristiwa *External Shock* mendadak (misal: Perang Harga, Aturan Hukum Baru) untuk melihat daya kelenturan strategi awal.
4. **Fase Resolusi (Round 3):** Agen merekrut kesimpulan akhir, dan Auditor mensertifikasi/menolak logika tersebut melalui **Auditor Report**.

### D. Iterasi dan Modifikasi Historis
* Semua hasil simulasi disimpan secara berurutan (*History Sidebar*).
* Terdapat tombol **"Adjust"** sehingga pengguna dapat mengkaji skenario lama, memperbarui tujuan/konteks baru, dan menjalankan ulang skenario tanpa kehilangan konteks data.

## 4. Keamanan dan Validasi (Security & Hardening Fixes)
Pembaruan terkini menutup celah keamanan kritikal:
1. **Abstraksi Kunci API:** `GEMINI_API_KEY` dihapus seluruhnya dari frontend (penghapusan ekspos di `vite.config.ts`) dan ditangani secara privat melalui `server.ts`.
2. **Backend Normalization:** Gemini disuruh untuk menghasilkan persentase alokasi yang totalnya 100%. Untuk mengantisipasi "halusinasi" angka, Express server memiliki lapisan penyaring (`normalizeAllocations`) yang menghitung ulang nilai menjadi absolut 100% sebelum dikembalikan ke klien.
3. **Payload Limit:** Endpoint `/api/simulate` dikonfigurasi dengan `limit: '50mb'` untuk mengakomodasi dokumen PDF & Image beresolusi tinggi ke backend.

## 5. Antarmuka dan Visualisasi Data
* **Desain Estetika:** Skema warna Cyber-Corporate *dark mode* (aksen Hitam/Krem/Neon) untuk menampilkan nuansa dasbor intelijen. Card milik setiap persona memberi sinyal *state* (Standby, active, auditing, dsb) saat melakukan komputasi.
* **Visualisasi Alokasi:** Bar chart yang menggunakan pustaka besar (`recharts`) telah dihapus (memangkas _bloatware_) dan diganti dengan elemen CSS standard Tailwind yang ringan dan kustom via `AllocationView.tsx`.
* **Grafik Relasi Benda-Benda (Strategic Dependency):** Menggunakan D3.js `forceSimulation`. Setiap node memiliki ukuran skor dampak (`impact_score`) dan warnanya merepresentasikan status `risk` atau `stable`.

## 6. Pembaruan Kritis Berdasarkan Masukan v4.1.0
Menyikapi celah keamanan dan limitasi yang ditemukan pada pengujian v4.1.0, beberapa mekanisme tingkat Enterprise ditambahkan:

1. **Sistem Ekspor & Impor JSON (Menjawab Keterbatasan localStorage)**
   Kekurangan `localStorage` sekarang diatasi dengan fungsionalitas Export/Import penuh. Data skenario, historis chat, nilai resiko, model alokasi, dapat diserialisasi ke dalam file `.json` lalu diunggah kembali oleh user lain / antar device. Ini memberikan *portability* yang aman ke level enterprise (dapat diarsipkan tanpa perlu instance database Cloud tambahan).

2. **Graceful Error Handling untuk Limitasi API (Gemini 3.1 Pro)**
   Panggilan ke model `gemini-3.1-pro-preview` dikerangkakan di dalam `try/catch` server Express. Bila _Billing/Quota_ API sudah mencapai batas gratis / tidak tersedia untuk user tamu, maka server akan mendisplai peringatan kegagalan quota dengan *graceful*: `"API Quota Exceeded or Billing Required..."`. Penguji sekarang akan sadar dan tidak akan menganggap aplikasi error murni.

3. **Visualisasi "Lobster Trap Protocol" (Transparansi Auditor)**
   Alih-alih menyembunyikan protokol pemeriksaan logika Auditor di _system prompt_, mekanisme keamanan ini kini diparsing ke dalam bentuk `governanceLogs`. Log diverifikasi, lalu ditransformasikan secara UI menjadi elemen interaktif **"Lobster Trap View"**. Ini memperlihatkan aturan apa yang digunakan untuk mengecek korelasi dokumen Word/XLSX, pengamatannya, serta apakah skenario sukses ("Passed") atau memunculkan peringatan kontradiksi data ("Warning/Failed"). Transparansi AI diprioritaskan.
