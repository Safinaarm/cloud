// script.js
const BASE_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyAJ1kCkBIyez7odSwdWMJ86Nm_uTWYfOb2zpTjbDQ-TB5E4qsfUw_4wVyUBkF1F8ih/exec";
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
        const url = new URL(result.text);
        const qr_token   = url.searchParams.get("qr_token");
        const course_id  = url.searchParams.get("course_id");
        const session_id = url.searchParams.get("session_id");

        if (!qr_token || !course_id || !session_id) {
          throw new Error("Format QR tidak valid");
        }

        const payload = {
          user_id,
          device_id: navigator.userAgent || "unknown",
          course_id,
          session_id,
          qr_token,
          ts: new Date().toISOString()
        };

        const response = await fetch(`${BASE_WEBAPP_URL}?action=checkin`, {
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
          document.getElementById("resultName").textContent       = user_id;
          document.getElementById("resultCourse").textContent     = course_id;
          document.getElementById("resultSession").textContent    = session_id;
          document.getElementById("resultPresenceId").textContent = data.data?.presence_id || "—";
          showPage("page3");
        } else {
          setStatus("scanStatus", "❌ " + (data.error || "Gagal dari server"), "error");
          tambahTombolScanUlang();
        }
      } catch (e) {
        console.error("Error:", e);
        setStatus("scanStatus", "❌ Failed to fetch - " + (e.message || "cek koneksi & deployment GAS"), "error");
        tambahTombolScanUlang();
      }
    }

    if (err && err.name !== "NotFoundException") {
      console.warn("Scan warning:", err);
    }
  });
}