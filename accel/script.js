// CONFIG
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxBQYgP4rFGw8oj1-L2zg3PjbLtkWGEhUJY-cbuqX_IccRYeXZv7Lc0DoFRqaR3pQlp/exec";
const DEVICE_ID  = "dev-001";
const SEND_INTERVAL = 1500;

// Chart Setup
const ctx = document.getElementById('chart').getContext('2d');
const labels = [];
const xData = []; const yData = []; const zData = [];

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
  const time = new Date().toLocaleTimeString([], {minute:'2-digit', second:'2-digit'});
  if (labels.length > 60) {
    labels.shift(); xData.shift(); yData.shift(); zData.shift();
  }
  labels.push(time);
  xData.push(x); yData.push(y); zData.push(z);
  chart.update();
}

// Utils
function formatAxis(v) { return v.toFixed(3).padStart(6, ' '); }

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

async function start() {
  try {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const perm = await DeviceMotionEvent.requestPermission();
      if (perm !== 'granted') throw new Error("Izin sensor motion ditolak");
    }

    if (!window.DeviceMotionEvent) {
      throw new Error("Browser tidak support accelerometer");
    }

    document.getElementById('status').textContent = "Sensor aktif • Mengirim ke cloud...";
    document.getElementById('status').className = "status online";

    let lastSent = 0;

    sendIntervalId = setInterval(() => {
      const now = Date.now();
      if (now - lastSent < SEND_INTERVAL) return;
      lastSent = now;

      const acc = window.accelerationIncludingGravity || {x:0, y:0, z:9.8};
      const { x = 0, y = 0, z = 9.8 } = acc;

      updateReadout(x, y, z);
      pushToChart(x, y, z);
      sendData(x, y, z);
    }, 180);

    isRunning = true;
    document.getElementById('btnStart').disabled = true;
    document.getElementById('btnStop').disabled = false;

  } catch (err) {
    document.getElementById('status').textContent = "Error: " + err.message;
    document.getElementById('status').className = "offline";
    console.error("Start error:", err);
  }
}

function stop() {
  if (sendIntervalId) clearInterval(sendIntervalId);
  isRunning = false;
  document.getElementById('btnStart').disabled = false;
  document.getElementById('btnStop').disabled = true;
  document.getElementById('status').textContent = "Dihentikan • Data terakhir tetap";
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

  console.log("Mengirim ke:", fullUrl, payload);

  try {
    await fetch(fullUrl, {
      method: "POST",
      mode: "no-cors",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload)
    });
    console.log("Request terkirim");
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// Event listeners
document.getElementById('btnStart').onclick = start;
document.getElementById('btnStop').onclick = stop;
window.addEventListener('beforeunload', stop);