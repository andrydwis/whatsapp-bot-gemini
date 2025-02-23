# WhatsApp Chatbot dengan Google Gemini AI

Proyek ini adalah chatbot WhatsApp berbasis Node.js yang menggunakan **whatsapp-web.js** untuk berinteraksi dengan WhatsApp dan **Google Gemini AI** untuk menghasilkan respons cerdas berdasarkan input pengguna.

## 🚀 Fitur

- **Chatbot Interaktif**: Respon yang asik dan gaul dengan bahasa santai.
- **Dukungan Percakapan Berkelanjutan**: Menyimpan riwayat percakapan sementara selama 5 menit.
- **Dukungan Media**: Memproses gambar yang dikirimkan pengguna.
- **Perintah "clear"**: Menghapus riwayat percakapan pengguna.

## 📌 Persyaratan

Pastikan sistem Anda sudah memiliki:

- Node.js (v16 atau lebih baru)
- WhatsApp Web aktif di perangkat yang digunakan
- API key Google Gemini AI

## ⚙️ Instalasi

1. Clone repository ini:

   ```bash
   git clone https://github.com/username/whatsapp-gemini-bot.git
   cd whatsapp-gemini-bot
   ```

2. Instal dependensi yang diperlukan:

   ```bash
   npm install
   ```

3. Buat file `.env` dan tambahkan API key Google Gemini AI:

   ```env
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. Masukkan nomor telepon bot ke `.env`:

   ```env
   USER_PHONE=@62xxx
   ```

5. Jalankan bot:

   ```bash
   node index.js
   ```

6. Scan QR code yang muncul untuk menghubungkan WhatsApp Web dengan bot.

## 🛠️ Konfigurasi

### Sistem Prompt AI

Sistem prompt chatbot dikonfigurasi untuk memberikan respons yang santai dan informatif. Anda bisa mengubah `systemPrompt` pada `index.js` untuk menyesuaikan gaya percakapan.

### Penyimpanan Riwayat Chat

Percakapan pengguna akan disimpan sementara dalam **5 menit** dan dihapus otomatis jika tidak ada interaksi lebih lanjut.

## 🔥 Perintah

- **Mengirim pesan teks**: Bot akan memberikan jawaban berdasarkan konteks percakapan.
- **Mengirim gambar**: Bot akan mencoba memahami dan merespons gambar yang dikirimkan.
- **Menghapus riwayat percakapan**: Kirim pesan `clear` untuk menghapus percakapan sebelumnya.

## 📜 Lisensi

Proyek ini dirilis di bawah lisensi **MIT**. Silakan gunakan dan modifikasi sesuai kebutuhan Anda!

---

🔥 Selamat mencoba! Jika ada masalah atau saran, jangan ragu untuk menghubungi. 😃
