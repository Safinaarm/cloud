// CONFIG
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxBQYgP4rFGw8oj1-L2zg3PjbLtkWGEhUJY-cbuqX_IccRYeXZv7Lc0DoFRqaR3pQlp/exec";
const DEVICE_ID = "dev-001";
const SEND_INTERVAL = 1500;

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
      { label: 'Z', data: zData, borderColor: '#818cf8', tension: 0.4, pointRadius: 0, borderWidth: 2.5 }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      y: {
        min: -15,
        max: 15,
        ticks: { color: '#a09fc0', font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 } },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      x: { display: false }
    },
    plugins: {
      legend: {
        labels: {
          color: '#f0eff7',
          font: { size: 13, weight: '600', family: "'Plus Jakarta Sans', sans-serif" },
          usePointStyle: true,
          padding: 16
        }
      }
    }
  }
});

function pushToChart(x, y, z) {
  const time = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
  if (labels.length > 60) {
    labels.shift(); xData.shift(); yData.shift(); zData.shift();
  }
  labels.push(time);
  xData.push(x);
  yData.push(y);
  zData.push(z);
  chart.update('none');
}

function formatAxis(v) {
  return Number(v).toFixed(3);
}

function updateReadout(x, y, z) {
  document.getElementById('xVal').textContent = formatAxis(x);
  document.getElementById('yVal').textContent = formatAxis(y);
  document.getElementById('zVal').textContent = formatAxis(z);

  const mag = Math.sqrt(x*x + y*y + z*z).toFixed(2);
  document.getElementById('mag').innerHTML = `Magnitude: <strong>${mag}</strong> <span class="unit">g</span>`;
}

// ==================== SENSOR & SEND LOGIC ====================
let sendIntervalId = null;
let isRunning = false;
let latestAccel = { x: 0, y: 0, z: 9.81 };
let motionListener = null;

async function start() {
  try {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== 'granted') throw new Error("Izin sensor ditolak");
    }

    if (!window.DeviceMotionEvent) throw new Error("Browser tidak mendukung accelerometer");

    document.getElementById('status').className = "status online";
    document.getElementById('status-text').textContent = "Sensor aktif · Menunggu gerakan...";

    motionListener = (event) => {
      const acc = event.accelerationIncludingGravity;
      if (acc && typeof acc.x === 'number') {
        latestAccel = { x: acc.x, y: acc.y, z: acc.z };
      }
      updateReadout(latestAccel.x, latestAccel.y, latestAccel.z);
      pushToChart(latestAccel.x, latestAccel.y, latestAccel.z);
    };

    window.addEventListener('devicemotion', motionListener, { passive: true });

    let lastSent = 0;
    sendIntervalId = setInterval(() => {
      if (Date.now() - lastSent >= SEND_INTERVAL) {
        sendData(latestAccel.x, latestAccel.y, latestAccel.z);
        lastSent = Date.now();
      }
    }, 200);

    isRunning = true;
    document.getElementById('btnStart').disabled = true;
    document.getElementById('btnStop').disabled = false;

  } catch (err) {
    document.getElementById('status').className = "status offline";
    document.getElementById('status-text').textContent = "Error: " + err.message;
  }
}

function stop() {
  if (sendIntervalId) clearInterval(sendIntervalId);
  if (motionListener) window.removeEventListener('devicemotion', motionListener);

  isRunning = false;
  document.getElementById('btnStart').disabled = false;
  document.getElementById('btnStop').disabled = true;
  document.getElementById('status').className = "status offline";
  document.getElementById('status-text').textContent = "Dihentikan";
}

async function sendData(x, y, z) {
  const payload = {
    device_id: DEVICE_ID,
    samples: [{ t: Date.now(), x: Number(x.toFixed(4)), y: Number(y.toFixed(4)), z: Number(z.toFixed(4)) }]
  };

  try {
    await fetch(SCRIPT_URL + "?path=telemetry/accel", {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("Gagal mengirim data:", e);
  }
}

// Event Listeners
document.getElementById('btnStart').onclick = start;
document.getElementById('btnStop').onclick = stop;
window.addEventListener('beforeunload', stop);