# 🚀 CloudProyek - Control Center

CloudProyek adalah platform **IoT (Internet of Things)** berbasis web untuk pemantauan dan pelacakan data sensor secara **real-time**. Proyek ini dirancang untuk mengirim data dari perangkat (GPS & sensor) ke cloud melalui **Google Apps Script**, lalu divisualisasikan dalam dashboard interaktif.

---

## ✨ Fitur Utama

### 👤 1. Area Pengguna (Input Data)

* 📍 **GPS Tracker**
  Mengirim lokasi *(latitude & longitude)* perangkat secara berkala.

* 📊 **Accel Live**
  Mengirim data percepatan 3 sumbu *(X, Y, Z)* dari sensor perangkat.

* 📷 **QR Scanner Absensi**
  Memindai QR Code untuk mencatat kehadiran secara digital.

---

### 📊 2. Dashboard Monitoring (Visualisasi Data)

* 🗺️ **GPS Logs**
  Peta interaktif menggunakan **Leaflet.js** untuk melihat posisi perangkat secara real-time.

* 📈 **Accel Monitor**
  Grafik dinamis menggunakan **Chart.js** untuk analisis pergerakan.

* 🔐 **Admin QR Generator**
  Generator QR Code dengan auto-refresh setiap **2 menit**.

---

## 📂 Struktur Proyek

```bash
cloud-proyek/
├── dashboard/
│   ├── accel-monitor/   # Dashboard grafik accelerometer
│   ├── generate-qr/     # Generator QR Code (Admin)
│   └── gps-logs/        # Peta tracking lokasi
├── user/
│   ├── accel/           # Pengirim data accelerometer
│   ├── gps/             # Pengirim data GPS
│   └── kamera/          # Scanner QR Code
├── index.html           # Halaman utama (Control Center)
├── styles.css           # Styling (Glassmorphism + Dark Mode)
└── script.js            # Logic navigasi & tema
```

---

## 🚀 Cara Menjalankan

Karena ini adalah aplikasi web statis, kamu bisa menjalankannya dengan cepat:

1. Install ekstensi **Live Server** di VS Code
2. Buka folder proyek di VS Code
3. Klik kanan `index.html`
4. Pilih **"Open with Live Server"**
5. Akses di browser:

```bash
http://127.0.0.1:5501
```

---

## 🔗 Akses Proyek

* 🌍 **Link Website**
  [https://safinaarm.github.io/cloud/](https://safinaarm.github.io/cloud/)

* 📊 **Dataset Penyimpanan (Google Sheets)**
  [https://docs.google.com/spreadsheets/d/1AaGpQYGGnhh00GIdYFTZEzczl3g8Xkw9GxE27jHOEbE/edit?gid=1619497093#gid=1619497093](https://docs.google.com/spreadsheets/d/1AaGpQYGGnhh00GIdYFTZEzczl3g8Xkw9GxE27jHOEbE/edit?gid=1619497093#gid=1619497093)

---

## 🌐 Dokumentasi API (Google Apps Script)

| Fungsi        | Endpoint                                                                                                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accelerometer | [https://script.google.com/macros/s/AKfycbxBQYgP4rFGw8oj1-L2zg3PjbLtkWGEhUJY-cbuqX_IccRYeXZv7Lc0DoFRqaR3pQlp/exec](https://script.google.com/macros/s/AKfycbxBQYgP4rFGw8oj1-L2zg3PjbLtkWGEhUJY-cbuqX_IccRYeXZv7Lc0DoFRqaR3pQlp/exec)     |
| GPS Tracking  | [https://script.google.com/macros/s/AKfycbwRJ_WR-1vIkAGA_7UrE9Gfs7Nu7ToyXv-_fx0wQhTT3x8xcFYUvPjJkXNEYCAPumh0CQ/exec](https://script.google.com/macros/s/AKfycbwRJ_WR-1vIkAGA_7UrE9Gfs7Nu7ToyXv-_fx0wQhTT3x8xcFYUvPjJkXNEYCAPumh0CQ/exec) |
| GPS Dashboard | [https://script.google.com/macros/s/AKfycbyCFr-2Vygs0AQgv3HAGgu8wU5a-7HnnQpshcloPUlSWZsoQWnwYBesmXO1te76LPUSxA/exec](https://script.google.com/macros/s/AKfycbyCFr-2Vygs0AQgv3HAGgu8wU5a-7HnnQpshcloPUlSWZsoQWnwYBesmXO1te76LPUSxA/exec) |
| QR & Absensi  | [https://script.google.com/macros/s/AKfycbyAJ1kCkBIyez7odSwdWMJ86Nm_uTWYfOb2zpTjbDQ-TB5E4qsfUw_4wVyUBkF1F8ih/exec](https://script.google.com/macros/s/AKfycbyAJ1kCkBIyez7odSwdWMJ86Nm_uTWYfOb2zpTjbDQ-TB5E4qsfUw_4wVyUBkF1F8ih/exec)     |

---

## 📨 Contoh Request

### 1. 📊 Accelerometer (POST)

Dikirim setiap **1.5 detik**:

```json
{
  "device_id": "dev-001",
  "samples": [
    {
      "t": 1713412020000,
      "x": 0.052,
      "y": 9.81,
      "z": -0.12
    }
  ]
}
```

---

### 2. 📍 GPS Tracking (GET)

Contoh request:

```bash
{API_URL}?device_id=dev-001&lat=-7.446&lng=112.718&accuracy_m=15&ts=2024-04-18T10:00:00Z
```

---

### 3. 📷 Absensi (POST)

```json
{
  "user_id": "MHS001",
  "device_id": "Mozilla/5.0...",
  "course_id": "cloud-keamanan",
  "qr_token": "TKN-12345"
}
```

---

## 🛠 Teknologi yang Digunakan

* 🌐 **Frontend**: HTML5, CSS3 (Custom Properties), JavaScript
* 🎨 **UI Design**: Glassmorphism + Dark Mode
* 🗺️ **Maps**: Leaflet.js
* 📈 **Charts**: Chart.js
* 📷 **Scanner**: ZXing Library
* ☁️ **Backend**: Google Apps Script (GAS)

---

## 📌 Catatan

* Proyek ini cocok untuk eksperimen **IoT berbasis web**
* Tidak membutuhkan backend server tradisional
* Semua data dikirim dan disimpan melalui Google Apps Script

---

© 2026 Kelompok 5 - C3