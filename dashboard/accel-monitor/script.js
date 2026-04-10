// accel.js — Accel Monitoring (logic unchanged)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxBQYgP4rFGw8oj1-L2zg3PjbLtkWGEhUJY-cbuqX_IccRYeXZv7Lc0DoFRqaR3pQlp/exec";

let currentDeviceId = 'dev-001';
let pollInterval = null;
let isPaused = false;

const MAX_POINTS = 60;
const labels = [];
const dataX = [], dataY = [], dataZ = [];

const ctx = document.getElementById('accelChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [
      { label: 'X Axis', data: dataX, borderColor: '#f87171', borderWidth: 2.5, tension: 0.4, pointRadius: 0, fill: true, backgroundColor: 'rgba(248, 113, 113, 0.04)' },
      { label: 'Y Axis', data: dataY, borderColor: '#4ade80', borderWidth: 2.5, tension: 0.4, pointRadius: 0, fill: true, backgroundColor: 'rgba(74, 222, 128, 0.04)' },
      { label: 'Z Axis', data: dataZ, borderColor: '#818cf8', borderWidth: 2.5, tension: 0.4, pointRadius: 0, fill: true, backgroundColor: 'rgba(129, 140, 248, 0.04)' }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      y: {
        min: -15, max: 15,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#a09fc0', font: { size: 12, family: "'Plus Jakarta Sans', sans-serif" } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#a09fc0', font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" } }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#f0eff7',
          font: { weight: '600', family: "'Plus Jakarta Sans', sans-serif" },
          boxWidth: 14,
          padding: 16
        }
      }
    }
  }
});

async function fetchData() {
  if (isPaused) return;

  const targetUrl = `${SCRIPT_URL}?path=telemetry/accel/latest&device_id=${encodeURIComponent(currentDeviceId)}`;

  try {
    const response = await fetch(targetUrl);
    const result = await response.json();

    const cloudCard = document.getElementById('cloud-card');
    const cloudStatus = document.getElementById('cloud-status-val');

    if (result.ok && result.data) {
      const { x, y, z } = result.data;
      const ts = new Date().toLocaleTimeString('id-ID', { hour12: false });

      if (labels.length > MAX_POINTS) {
        labels.shift(); dataX.shift(); dataY.shift(); dataZ.shift();
      }
      labels.push(ts);
      dataX.push(x); dataY.push(y); dataZ.push(z);
      chart.update();

      const mag = Math.sqrt(x*x + y*y + z*z).toFixed(2);
      document.getElementById('magVal').innerHTML = `${mag} <span class="unit">g</span>`;
      document.getElementById('last-seen').textContent = `Terakhir diperbarui: ${ts}`;

      cloudCard.style.borderLeftColor = 'var(--success)';
      cloudStatus.className = 'cloud-status ok';
      cloudStatus.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Data Telah Masuk
      `;

      const absX = Math.abs(x), absY = Math.abs(y), absZ = Math.abs(z);
      const dom = absX > absY && absX > absZ ? 'X' : (absY > absZ ? 'Y' : 'Z');
      document.getElementById('dominantAxis').textContent = `Sumbu ${dom}`;

    } else {
      cloudCard.style.borderLeftColor = 'var(--error)';
      cloudStatus.className = 'cloud-status error';
      cloudStatus.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Data Belum Masuk
      `;
    }
  } catch (err) {
    const cloudStatus = document.getElementById('cloud-status-val');
    cloudStatus.className = 'cloud-status error';
    cloudStatus.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
      Connection Error
    `;
  }
}

function startMonitoring() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(fetchData, 10000);
  fetchData();
}

function updateDeviceId() {
  currentDeviceId = document.getElementById('deviceIdInput').value.trim();
  labels.length = 0; dataX.length = 0; dataY.length = 0; dataZ.length = 0;
  chart.update();
  startMonitoring();
}

function togglePause() {
  isPaused = !isPaused;
  const icon = document.getElementById('pauseIcon');
  const label = document.getElementById('pauseLabel');

  if (isPaused) {
    icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    label.textContent = 'Resume';
  } else {
    icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    label.textContent = 'Pause';
  }
}

startMonitoring();