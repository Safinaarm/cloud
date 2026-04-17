// ==================== THEME INITIALIZATION ====================
const html = document.documentElement;
const saved = localStorage.getItem('cp-theme') || 'dark';
html.setAttribute('data-theme', saved);

// script.js
const BASE_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyAJ1kCkBIyez7odSwdWMJ86Nm_uTWYfOb2zpTjbDQ-TB5E4qsfUw_4wVyUBkF1F8ih/exec";
// GANTI DENGAN URL BARU SETELAH DEPLOY ULANG

// Jika Anda melakukan "Swap Test" ke kelompok lain dan menemui error "Route not found", 
// silakan ubah API_ROUTE ini sesuai dengan rute routing kode GAS kelompok tersebut:
// Kelompok Anda (default):  "?action=checkin"
// Kelompok lain1 (contoh):  "?path=/presence/checkin"
// Kelompok lain2 (tanpa slash): "?path=presence/checkin"  <-- PENTING! (Gunakan ini untuk tes saat ini)
const API_ROUTE = "?action=checkin&path=presence/checkin";

let user_id = "";
let codeReader = null;
let currentStream = null;

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const target = document.getElementById(id);
  target.style.animation = "none";
  target.offsetHeight;
  target.style.animation = "";
  target.classList.add("active");
}

function setStatus(elId, msg, type = "info") {
  const el = document.getElementById(elId);
  el.innerHTML = msg;
  el.className = "status-msg " + type + " show";
}

function hideStatus(elId) {
  document.getElementById(elId).className = "status-msg";
}

function stopCamera() {
  if (codeReader) {
    try { codeReader.reset(); } catch (e) { }
    codeReader = null;
  }
  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop());
    currentStream = null;
  }
  document.getElementById("video").srcObject = null;
}

function tambahTombolScanUlang() {
  if (document.getElementById("retryBtn")) return;
  const btn = document.createElement("button");
  btn.id = "retryBtn";
  btn.className = "btn btn-ghost";
  btn.style.marginTop = "10px";
  btn.innerHTML = '<i class="fas fa-redo"></i> Scan Ulang';
  btn.onclick = () => { btn.remove(); startScanQR(); };
  document.getElementById("scanStatus").insertAdjacentElement("afterend", btn);
}

// Event listener
document.getElementById("submitNameBtn").addEventListener("click", () => {
  user_id = document.getElementById("user_id").value.trim();
  if (!user_id) {
    setStatus("status", "⚠ Nama / NIM wajib diisi!", "error");
    return;
  }
  hideStatus("status");
  showPage("page2");
  startScanQR();
});

document.getElementById("backBtn").addEventListener("click", () => {
  stopCamera();
  if (document.getElementById("retryBtn")) document.getElementById("retryBtn").remove();
  showPage("page1");
});

document.getElementById("backToHomeBtn").addEventListener("click", () => {
  document.getElementById("user_id").value = "";
  user_id = "";
  showPage("page1");
});

// Fungsi utama scan
function startScanQR() {
  if (typeof ZXing === "undefined" || !ZXing.BrowserMultiFormatReader) {
    setStatus("scanStatus", "Gagal memuat ZXing. Periksa koneksi.", "error");
    return;
  }

  codeReader = new ZXing.BrowserMultiFormatReader();
  const video = document.getElementById("video");

  setStatus("scanStatus", "Menginisialisasi kamera...", "info");

  navigator.mediaDevices
    .getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    })
    .then(stream => {
      currentStream = stream;
      video.srcObject = stream;
      setStatus("scanStatus", "Arahkan kamera ke QR Code...", "info");
    })
    .catch(err => {
      setStatus("scanStatus", "Gagal akses kamera: " + err.message, "error");
    });

  codeReader.decodeFromVideoDevice(undefined, "video", async (result, err) => {
    if (result) {
      stopCamera();
      setStatus("scanStatus", "QR terdeteksi, mengirim data...", "info");

      try {
        let qr_token, course_id, session_id;

        try {
          // 1. Coba parse sebagai URL (Format Kelompok Biasa)
          const url = new URL(result.text);
          qr_token = url.searchParams.get("qr_token") || url.searchParams.get("token");
          course_id = url.searchParams.get("course_id") || url.searchParams.get("course");
          session_id = url.searchParams.get("session_id") || url.searchParams.get("session");
        } catch (urlError) {
          // 2. Jika bukan URL, coba parse sebagai JSON murni (Format Kelompok Baru)
          try {
            const parsedObj = JSON.parse(result.text);
            qr_token = parsedObj.qr_token || parsedObj.token;
            course_id = parsedObj.course_id || parsedObj.course;
            session_id = parsedObj.session_id || parsedObj.session;
          } catch (jsonError) {
            // 3. Jika bukan JSON, cek apakah ini Raw Token (teks murni)
            let rawStr = result.text.trim();
            if (rawStr.startsWith("TKN-") || rawStr.length < 30) {
              qr_token = rawStr;
              course_id = "cross-group-test";
              session_id = "cross-group-test";
            } else {
              let safeText = result.text.substring(0, 50);
              throw new Error(`Format tidak dikenali. Isi QR: "${safeText}"...`);
            }
          }
        }

        if (!qr_token) {
          throw new Error("Format QR tidak valid (Token Kosong)");
        }

        const payload = {
          user_id,
          device_id: navigator.userAgent || "unknown",
          course_id,
          session_id,
          qr_token,
          token: qr_token,  // kompatibilitas dengan kelompok lain
          course: course_id, // kompatibilitas dengan kelompok lain
          session: session_id, // kompatibilitas dengan kelompok lain
          ts: new Date().toISOString()
        };

        // Menggunakan API_ROUTE yang bisa di-switch di atas
        const response = await fetch(`${BASE_WEBAPP_URL}${API_ROUTE}`, {
          method: "POST",
          mode: "cors",
          redirect: "follow",
          headers: {
            "Content-Type": "text/plain;charset=UTF-8"   // ← kunci bypass preflight
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.ok) {
          document.getElementById("resultName").textContent = user_id;
          document.getElementById("resultCourse").textContent = course_id;
          document.getElementById("resultSession").textContent = session_id;
          document.getElementById("resultPresenceId").textContent = data.data?.presence_id || "—";
          showPage("page3");
        } else {
          setStatus("scanStatus", "❌ " + (data.error || "Gagal dari server"), "error");
          tambahTombolScanUlang();
        }
      } catch (e) {
        console.error("Error detail:", e);

        let errorMsg = e.message || "Kesalahan tidak diketahui";

        // Cek jika error karena gagal parsing URL dari QR Code (misal QR bukan URL valid)
        if (e instanceof TypeError && errorMsg.includes("URL")) {
          setStatus("scanStatus", "❌ QR Code bukan URL yang valid", "error");
        }
        // Cek jika error murni dari fetch (CORS atau network)
        else if (errorMsg === "Failed to fetch" || errorMsg.includes("fetch")) {
          setStatus("scanStatus", "❌ Koneksi ditolak (Periksa hak akses 'Anyone' di GAS)", "error");
        }
        // Error lain (seperti "Format QR tidak valid" yang dilempar secara manual)
        else {
          setStatus("scanStatus", "❌ " + errorMsg, "error");
        }

        tambahTombolScanUlang();
      }
    }

    if (err && err.name !== "NotFoundException") {
      console.warn("Scan warning:", err);
    }
  });
}
