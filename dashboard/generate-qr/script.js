// ==================== THEME INITIALIZATION ====================
const html = document.documentElement;
const saved = localStorage.getItem('cp-theme') || 'dark';
html.setAttribute('data-theme', saved);

// ==================== QR GENERATOR SCRIPT ====================
// CloudProyek - Generate QR untuk Absensi
// Features: Auto-refresh, Countdown Timer, Dark/Light Mode Support

const BASE_URL = "https://script.google.com/macros/s/AKfycbyAJ1kCkBIyez7odSwdWMJ86Nm_uTWYfOb2zpTjbDQ-TB5E4qsfUw_4wVyUBkF1F8ih/exec";

let timerInterval = null;
const EXPIRY_SECONDS = 120; // 2 menit

/**
 * Generate QR Code berdasarkan Mata Kuliah yang dipilih
 */
async function generateQR() {
  const course_id = document.getElementById("courseSelect").value;
  const btn = document.getElementById("btnGen");
  const qrBox = document.getElementById("qrcode");
  const status = document.getElementById("status");

  // Validasi input
  if (!course_id) {
    alert("Harap pilih mata kuliah terlebih dahulu!");
    return;
  }

  // Set UI ke state loading
  btn.disabled = true;
  qrBox.innerHTML = '<div class="spinner"></div>';
  status.className = "status-msg info show";
  status.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Menghubungkan ke Cloud...';

  try {
    // Fetch QR data dari Google Apps Script
    const response = await fetch(`${BASE_URL}?action=generate&course_id=${encodeURIComponent(course_id)}`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();

    if (result.ok) {
      // Clear loading spinner dan generate QR Code
      qrBox.innerHTML = "";

      // Generate QR menggunakan library qrcodejs
      new QRCode(qrBox, {
        text: result.data.checkin_url,
        width: 180,
        height: 180,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });

      // Update status message
      status.className = "status-msg active show";
      status.innerHTML = `<i class="fas fa-check-circle"></i> QR Berhasil Diperbarui`;

      // Mulai countdown timer
      startCountdown();

      // Re-enable button
      btn.disabled = false;

    } else {
      throw new Error(result.error || "Gagal mendapatkan data QR");
    }

  } catch (err) {
    console.error("[v0] QR Generation Error:", err);

    // Show error state
    qrBox.innerHTML = '<i class="fas fa-triangle-exclamation" style="color:#ef4444;font-size:48px;"></i>';
    status.className = "status-msg expired show";
    status.innerHTML = "Gagal memuat QR. Periksa koneksi atau URL Script.";

    // Enable button kembali
    btn.disabled = false;
  }
}

/**
 * Countdown Timer dengan Auto-Refresh
 * Timer 2 menit untuk validitas QR
 */
function startCountdown() {
  // Clear interval sebelumnya jika ada
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  let timeLeft = EXPIRY_SECONDS;
  const bar = document.getElementById("progressBar");
  const countDisplay = document.getElementById("countdown");

  timerInterval = setInterval(() => {
    // Calculate minutes dan seconds
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    // Format dan display (00:00 format)
    countDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update progress bar width
    const progressWidth = (timeLeft / EXPIRY_SECONDS) * 100;
    bar.style.width = progressWidth + "%";

    // Auto refresh ketika waktu habis
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      generateQR(); // Refresh QR otomatis
    }

    timeLeft--;
  }, 1000);
}

/**
 * Event Listener - Button Click
 * Trigger QR generation dan reset timer display
 */
document.getElementById("btnGen").addEventListener("click", () => {
  // Reset display values
  document.getElementById("countdown").textContent = "02:00";
  document.getElementById("progressBar").style.width = "100%";

  // Generate QR baru
  generateQR();
});

/**
 * Optional: Cleanup ketika page di-unload
 */
window.addEventListener("beforeunload", () => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
