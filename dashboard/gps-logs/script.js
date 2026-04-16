// ==================== INITIALIZATION ====================
const html = document.documentElement;
const saved = localStorage.getItem('cp-theme') || 'dark';
html.setAttribute('data-theme', saved);

const API_URL = "https://script.google.com/macros/s/AKfycbyCFr-2Vygs0AQgv3HAGgu8wU5a-7HnnQpshcloPUlSWZsoQWnwYBesmXO1te76LPUSxA/exec";
let map, markers = {};
const colorPalette = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#f97316'];

function initMap() {
  map = L.map('map').setView([-7.2575, 112.7521], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
}

// ==================== HELPERS ====================
function getDeviceColor(deviceId) {
  let hash = 0;
  for (let i = 0; i < deviceId.length; i++) {
    hash = deviceId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPalette[Math.abs(hash % colorPalette.length)];
}

function createCustomIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin" style="--marker-color: ${color}"></div>`,
    iconSize: [30, 42], iconAnchor: [15, 42], popupAnchor: [0, -40]
  });
}

function formatDateTime(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ==================== CORE LOGIC ====================
function updateDeviceList(data) {
  const container = document.getElementById('device-list');
  container.innerHTML = '';
  document.getElementById('device-count').textContent = `${data.length} device`;

  data.forEach(d => {
    const color = getDeviceColor(d.device_id);
    const div = document.createElement('div');
    div.className = 'device-item';
    div.style.setProperty('--item-color', color);
    
    div.innerHTML = `
      <div class="device-header">
        <span class="device-id" style="color: ${color}">${d.device_id}</span>
        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; opacity: 0.6"></div>
      </div>
      <div class="device-info">
        <div class="info-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}</span>
        </div>
        <div class="info-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="device-time">Update: ${formatDateTime(d.ts)}</span>
        </div>
      </div>
    `;
    
    div.onclick = () => {
      if (markers[d.device_id]) {
        map.flyTo([d.lat, d.lng], 17, { duration: 1.5 });
        markers[d.device_id].openPopup();
      }
    };
    container.appendChild(div);
  });
}

async function loadData() {
  try {
    const res = await fetch(API_URL + "?action=latest_all");
    const json = await res.json();
    if (!json.ok || !json.data) return;

    const sekarang = new Date();
    const activeData = json.data.filter(d => (sekarang - new Date(d.ts)) / 1000 <= 60);

    updateDeviceList(activeData);

    // Bersihkan marker tidak aktif
    Object.keys(markers).forEach(id => {
      if (!activeData.find(d => d.device_id === id)) {
        map.removeLayer(markers[id]);
        delete markers[id];
      }
    });

    // Tambah/Update marker
    activeData.forEach(d => {
      const latlng = [Number(d.lat), Number(d.lng)];
      const color = getDeviceColor(d.device_id);
      if (markers[d.device_id]) {
        markers[d.device_id].setLatLng(latlng).getPopup().setContent(`<b>${d.device_id}</b><br>Update: ${formatDateTime(d.ts)}`);
      } else {
        markers[d.device_id] = L.marker(latlng, { icon: createCustomIcon(color) })
          .addTo(map).bindPopup(`<b>${d.device_id}</b><br>Update: ${formatDateTime(d.ts)}`);
      }
    });

    document.getElementById('last-update').textContent = `Terakhir: ${sekarang.toLocaleTimeString('id-ID')}`;
  } catch (e) { console.error("Error loading data:", e); }
}

// ==================== START ====================
initMap();
loadData();
setInterval(loadData, 3000);