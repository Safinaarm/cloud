// CONFIG
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxBQYgP4rFGw8oj1-L2zg3PjbLtkWGEhUJY-cbuqX_IccRYeXZv7Lc0DoFRqaR3pQlp/exec";
const DEVICE_ID  = "dev-001";
const SEND_INTERVAL = 1500; // ms

// Chart Setup
const ctx = document.getElementById('chart').getContext('2d');
const labels = [];
const xData = []; 
const yData = []; 
const zData = [];

const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels,
    datasets: [
      { label: 'X', data: xData, borderColor: '#f472b6', tension: 0.4, pointRadius: 0, borderWidth: 2.5 },
      { label: 'Y', data: yData, borderColor: '#34d399', tension: 0.4, pointRadius: 0, borderWidth: 2.5 },
      { label: 'Z', data: zData, borderColor: '#60a5fa', tension: 0.4, pointRadius: 0, borderWidth: 2.5 }
    ]
  },
  options: {
    responsive: true,
    animation: { duration: 0 },
    scales: {
      y: { min: -15, max: 15, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.15)' } },
      x: { display: false }
    },
    plugins: { legend: { labels: { color: '#cbd5e1', font: { size: 14 } } } }
  }
});

function pushToChart(x, y, z) {
  const time = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
  if (labels.length > 60) {
    labels.shift(); 
    xData.shift(); 
    yData.shift(); 
    zData.shift();
  }
  labels.push(time);
  xData.push(x); 
  yData.push(y); 
  zData.push(z);
  chart.update();
}

// Utils
function formatAxis(v) {
  return Number(v).toFixed(3).padStart(6, ' ');
}

function updateReadout(x, y, z) {
  document.getElementById('xVal').textContent = formatAxis(x);
  document.getElementById('yVal').textContent = formatAxis(y);
  document.getElementById('zVal').textContent = formatAxis(z);

  const mag = Math.sqrt(x*x + y*y + z*z).toFixed(2);
  document.getElementById('mag').textContent = `Magnitude: ${mag} g`;
}

// Sensor + Send Logic
let sendIntervalId = null;
let isRunning = false;
let latestAccel = { x: 0, y: 0, z: 9.8 }; // nilai awal + fallback

let motionListener = null; // untuk removeEventListener nanti

async function start() {
  try {
    // 1. Minta izin (khusus iOS 13+)
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== 'granted') {
        throw new Error("Izin akses sensor gerak ditolak");
      }
    }

    // 2. Cek apakah browser support
    if (!window.DeviceMotionEvent) {
      throw new Error("Browser tidak mendukung accelerometer");
    }

    // 3. Update status
    document.getElementById('status').textContent = "Sensor aktif • Menunggu gerakan...";
    document.getElementById('status').className = "status online";

    // 4. Daftarkan listener devicemotion (INI YANG PALING PENTING)
    motionListener = (event) => {
      const acc = event.accelerationIncludingGravity;

      // Pastikan data valid (bukan null/undefined)
      if (acc && typeof acc.x === 'number' && typeof acc.y === 'number' && typeof acc.z === 'number') {
        latestAccel.x = acc.x;
        latestAccel.y = acc.y;
        latestAccel.z = acc.z;
      }

      // Update tampilan & chart setiap kali ada event (smooth)
      updateReadout(latestAccel.x, latestAccel.y, latestAccel.z);
      pushToChart(latestAccel.x, latestAccel.y, latestAccel.z);
    };

    window.addEventListener('devicemotion', motionListener, { passive: true });

    // 5. Kirim data ke cloud secara periodik (pakai data terbaru)
    let lastSent = 0;
    sendIntervalId = setInterval(() => {
      const now = Date.now();
      if (now - lastSent < SEND_INTERVAL) return;
      lastSent = now;

      sendData(latestAccel.x, latestAccel.y, latestAccel.z);
    }, 200); // lebih sering cek, tapi kirim hanya setiap SEND_INTERVAL

    isRunning = true;
    document.getElementById('btnStart').disabled = true;
    document.getElementById('btnStop').disabled = false;

    // 6. Cek setelah 5 detik: apakah data masih default? (bantu debug)
    setTimeout(() => {
      if (isRunning && 
          Math.abs(latestAccel.x) < 0.2 && 
          Math.abs(latestAccel.y) < 0.2 && 
          Math.abs(Math.abs(latestAccel.z) - 9.8) < 0.5) {
        document.getElementById('status').textContent = 
          "Sensor aktif tapi data default — goyang HP keras atau cek pengaturan Motion di Safari";
        document.getElementById('status').className = "status offline";
      }
    }, 5000);

  } catch (err) {
    document.getElementById('status').textContent = "Error: " + err.message;
    document.getElementById('status').className = "offline";
    console.error("Gagal start sensor:", err);
  }
}

function stop() {
  if (sendIntervalId) {
    clearInterval(sendIntervalId);
    sendIntervalId = null;
  }

  // Penting: hapus listener agar tidak memory leak
  if (motionListener) {
    window.removeEventListener('devicemotion', motionListener);
    motionListener = null;
  }

  isRunning = false;
  document.getElementById('btnStart').disabled = false;
  document.getElementById('btnStop').disabled = true;
  document.getElementById('status').textContent = "Dihentikan • Data terakhir tetap ditampilkan";
  document.getElementById('status').className = "offline";
}

async function sendData(x, y, z) {
  const fullUrl = SCRIPT_URL + "?path=telemetry/accel";

  const payload = {
    device_id: DEVICE_ID,
    samples: [{
      t: Date.now(),
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      z: Number(z.toFixed(4))
    }]
  };

  console.log("Mengirim:", payload);

  try {
    await fetch(fullUrl, {
      method: "POST",
      mode: "no-cors",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload)
    });
    console.log("Data terkirim ke cloud");
  } catch (err) {
    console.error("Gagal kirim:", err);
  }
}

// Event listeners
document.getElementById('btnStart').onclick = start;
document.getElementById('btnStop').onclick = stop;
window.addEventListener('beforeunload', stop);