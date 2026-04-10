// app.js — GPS Monitoring Real-time
const API_URL = "https://script.google.com/macros/s/AKfycbyCFr-2Vygs0AQgv3HAGgu8wU5a-7HnnQpshcloPUlSWZsoQWnwYBesmXO1te76LPUSxA/exec";

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

    const data = json.data;

    updateDeviceList(data);

    data.forEach(d => {
      const latlng = [Number(d.lat), Number(d.lng)];

      if (markers[d.device_id]) {
        markers[d.device_id].setLatLng(latlng);
        markers[d.device_id].getPopup().setContent(buildPopup(d));
      } else {
        const marker = L.marker(latlng).addTo(map)
          .bindPopup(buildPopup(d));

        markers[d.device_id] = marker;
      }
    });

    if (isFirstLoad && data.length > 0) {
      const first = data[0];
      map.flyTo([first.lat, first.lng], 15);
      isFirstLoad = false;
    }

    document.getElementById('last-update').textContent =
      `Terakhir update: ${new Date().toLocaleTimeString('id-ID')}`;

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

// Init
initMap();
loadData();
setInterval(loadData, 3000);