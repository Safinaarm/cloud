// ==================== THEME INITIALIZATION ====================
const html = document.documentElement;
const saved = localStorage.getItem('cp-theme') || 'dark';
html.setAttribute('data-theme', saved);

// script.js
const BASE_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxJormXSihwT-iFqMqpvb7kJrrGfB8fq__x9TTAf4QrTnEmuR0sJulHoWaMrlGk-h5P/exec";
// GANTI DENGAN URL BARU SETELAH DEPLOY ULANG

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
    try { codeReader.reset(); } catch(e) {}
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
      video: { facingMode: "environment" }
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
      setStatus("scanStatus", "QR terdeteksi, menganalisis data...", "info");

      try {
        let finalUrl = "";
        let qrData = {};
        
        // --- LOGIKA DINAMIS UNTUK SWAP TESTING ---
        if (result.text.startsWith("http")) {
          // A. Jika isi QR adalah URL (Seperti sistem kamu atau temanmu)
          const urlObj = new URL(result.text);
          
          // Cek apakah URL ini mengandung endpoint Apps Script (script.google.com)
          if (result.text.includes("script.google.com")) {
             // Jika temanmu menaruh URL script-nya di QR, kita pakai itu sebagai endpoint!
             finalUrl = result.text.split('?')[0]; 
          } else {
             finalUrl = BASE_WEBAPP_URL; // Balik ke default jika bukan GAS URL
          }

          qrData = {
            qr_token: urlObj.searchParams.get("qr_token") || urlObj.searchParams.get("token"),
            course_id: urlObj.searchParams.get("course_id") || urlObj.searchParams.get("course"),
            session_id: urlObj.searchParams.get("session_id") || urlObj.searchParams.get("session")
          };
        } else {
          // B. Jika isi QR adalah JSON (Misal kelompok lain pakai format JSON)
          try {
            qrData = JSON.parse(result.text);
            finalUrl = BASE_WEBAPP_URL; 
          } catch(e) {
            throw new Error("Format QR tidak dikenali (Bukan URL/JSON)");
          }
        }

        // Validasi minimal
        if (!qrData.qr_token) throw new Error("QR Token tidak ditemukan");

        const payload = {
          user_id,
          device_id: navigator.userAgent,
          course_id: qrData.course_id || "unknown",
          session_id: qrData.session_id || "unknown",
          qr_token: qrData.qr_token,
          ts: new Date().toISOString()
        };

        // Kirim ke finalUrl (bisa milikmu, bisa milik temanmu tergantung isi QR)
        const response = await fetch(`${finalUrl}?action=checkin`, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.ok) {
          document.getElementById("resultName").textContent = user_id;
          document.getElementById("resultCourse").textContent = qrData.course_id || "Sukses";
          document.getElementById("resultSession").textContent = qrData.session_id || "-";
          document.getElementById("resultPresenceId").textContent = data.data?.presence_id || "SAVED";
          showPage("page3");
        } else {
          setStatus("scanStatus", "❌ " + (data.error || "Server menolak data"), "error");
          tambahTombolScanUlang();
        }
      } catch (e) {
        console.error("Error Detail:", e);
        setStatus("scanStatus", "❌ Gagal: " + e.message, "error");
        tambahTombolScanUlang();
      }
    }
  });
}