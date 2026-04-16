// ==================== THEME INITIALIZATION ====================
const html = document.documentElement;
const saved = localStorage.getItem('cp-theme') || 'dark';
html.setAttribute('data-theme', saved);

// app.js — GPS Monitoring Real-time
const API_URL = "https://script.google.com/macros/s/AKfycbyCFr-2Vygs0AQgv3HAGgu8wU5a-7HnnQpshcloPUlSWZsoQWnwYBesmXO1te76LPUSxA/exec";

const colorPalette = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', 
  '#06b6d4', '#8b5cf6', '#ef4444', '#f97316'
];

let map;
let markers = {};
let isFirstLoad = true;

function initMap() {
  map = L.map('map').setView([-7.2575, 112.7521], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

function formatDateTime(ts) {
  if (!ts) return "-";
  const date = new Date(ts);

  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  return date.toLocaleDateString('id-ID', options).replace(',', '');
}

function updateDeviceList(data) {
  const container = document.getElementById('device-list');
  container.innerHTML = '';
  document.getElementById('device-count').textContent = `${data.length} device`;

  data.forEach(d => {
    const div = document.createElement('div');
    div.className = 'device-item';
    div.innerHTML = `
      <div class="device-id">${d.device_id}</div>
      <div class="device-info">
        📍 ${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}<br>
        <span class="device-time">🕒 ${formatDateTime(d.ts)}</span>
      </div>
    `;

    div.addEventListener('click', () => {
      if (markers[d.device_id]) {
        map.flyTo([d.lat, d.lng], 17, { duration: 1.5 });
        markers[d.device_id].openPopup();
      }
    });

    container.appendChild(div);
  });
}

async function loadData() {
  try {
    const res = await fetch(API_URL + "?action=latest_all");
    const json = await res.json();

    if (!json.ok || !json.data || json.data.length === 0) return;

    const batasDetik = 20; 
    const sekarang = new Date();
    
    const activeData = json.data.filter(d => {
      const waktuDevice = new Date(d.ts);
      // Hitung selisih dalam satuan detik
      const selisihDetik = (sekarang - waktuDevice) / 1000;
      return selisihDetik <= batasDetik;
    });

    // Update list di sidebar
    updateDeviceList(activeData);

    // Bersihkan marker yang sudah tidak aktif (lebih dari 30 detik)
    Object.keys(markers).forEach(deviceId => {
      const isStillActive = activeData.find(d => d.device_id === deviceId);
      if (!isStillActive) {
        map.removeLayer(markers[deviceId]);
        delete markers[deviceId];
      }
    });

    // Tampilkan/update marker device yang aktif
    activeData.forEach(d => {
      const latlng = [Number(d.lat), Number(d.lng)];
      if (markers[d.device_id]) {
        markers[d.device_id].setLatLng(latlng);
        markers[d.device_id].getPopup().setContent(buildPopup(d));
      } else {
        const marker = L.marker(latlng).addTo(map).bindPopup(buildPopup(d));
        markers[d.device_id] = marker;
      }
    });

    document.getElementById('last-update').textContent =
      `Terakhir update: ${sekarang.toLocaleTimeString('id-ID')} (${activeData.length} Aktif)`;

  } catch (e) {
    console.error("Gagal mengambil data:", e);
  }
}

function buildPopup(d) {
  return `
    <b>Device:</b> ${d.device_id}<br>
    <b>Latitude:</b> ${d.lat.toFixed(6)}<br>
    <b>Longitude:</b> ${d.lng.toFixed(6)}<br>
    <b>Akurasi:</b> ${d.accuracy_m || 0} meter<br>
    <b>Update:</b> ${formatDateTime(d.ts)}
  `;
}
// 2. Fungsi untuk mendapatkan warna konsisten berdasarkan string ID
function getDeviceColor(deviceId) {
  let hash = 0;
  for (let i = 0; i < deviceId.length; i++) {
    hash = deviceId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colorPalette.length);
  return colorPalette[index];
}

// 3. Fungsi untuk membuat ikon Leaflet kustom
function createCustomIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-shadow"></div>
      <div class="marker-pin" style="--marker-color: ${color}"></div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40]
  });
}

// 4. Update bagian loop di loadData()
activeData.forEach(d => {
  const latlng = [Number(d.lat), Number(d.lng)];
  const deviceColor = getDeviceColor(d.device_id); // Dapatkan warna unik

  if (markers[d.device_id]) {
    markers[d.device_id].setLatLng(latlng);
    markers[d.device_id].getPopup().setContent(buildPopup(d));
  } else {
    // Gunakan ikon kustom di sini
    const marker = L.marker(latlng, { 
      icon: createCustomIcon(deviceColor) 
    }).addTo(map).bindPopup(buildPopup(d));
    
    markers[d.device_id] = marker;
  }
});

// 5. Update updateDeviceList() agar sidebar juga punya indikator warna
function updateDeviceList(data) {
  const container = document.getElementById('device-list');
  container.innerHTML = '';
  document.getElementById('device-count').textContent = `${data.length} device`;

  data.forEach(d => {
    const color = getDeviceColor(d.device_id);
    const div = document.createElement('div');
    div.className = 'device-item';
    // Tambahkan border kiri sesuai warna device
    div.style.borderLeft = `4px solid ${color}`;
    
    div.innerHTML = `
      <div class="device-id" style="color: ${color}">${d.device_id}</div>
      <div class="device-info">
        📍 ${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}<br>
        <span class="device-time">🕒 ${formatDateTime(d.ts)}</span>
      </div>
    `;
    // ... event listener tetap sama ...
    container.appendChild(div);
  });
}

// Init
initMap();
loadData();
setInterval(loadData, 3000);
