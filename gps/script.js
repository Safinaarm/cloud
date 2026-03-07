const DEVICE_ID = "dev-001";
const API_URL = "https://script.google.com/macros/s/AKfycbwRJ_WR-1vIkAGA_7UrE9Gfs7Nu7ToyXv-_fx0wQhTT3x8xcFYUvPjJkXNEYCAPumh0CQ/exec";

let map;
let marker;
let polyline;
let watchId = null;
let lastSend = 0;
const MIN_SEND_INTERVAL = 5000; // ms

function initMap() {
  map = L.map("map").setView([-7.446, 112.718], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);
}

function updateMap(lat, lng) {
  if (!marker) {
    marker = L.marker([lat, lng], {
      // bisa tambah icon custom nanti
    }).addTo(map);
  } else {
    marker.setLatLng([lat, lng]);
  }

  if (!polyline) {
    polyline = L.polyline([], {
      color: "#3b82f6",
      weight: 5,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
  }

  polyline.addLatLng([lat, lng]);
  map.panTo([lat, lng], { animate: true, duration: 0.8 });
}

function sendGPS(lat, lng, accuracy) {
  const now = Date.now();
  if (now - lastSend < MIN_SEND_INTERVAL) return;
  lastSend = now;

  const ts = new Date().toISOString();

  const params = new URLSearchParams({
    device_id: DEVICE_ID,
    ts,
    lat,
    lng,
    accuracy_m: Math.round(accuracy)
  });

  // Menggunakan Image untuk bypass CORS (metode lama tapi masih efektif)
  const img = new Image();
  img.src = `${API_URL}?${params.toString()}`;

  document.getElementById("status").textContent =
    `Terkirim: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function startTracking() {
  if (!navigator.geolocation) {
    alert("Browser tidak mendukung Geolocation");
    return;
  }

  document.getElementById("start").style.display = "none";
  document.getElementById("stop").style.display = "inline-block";
  document.getElementById("status").textContent = "Mencari posisi...";

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      updateMap(lat, lng);
      sendGPS(lat, lng, accuracy);
    },
    (err) => {
      document.getElementById("status").textContent = `GPS error: ${err.message}`;
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    }
  );
}

function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  document.getElementById("start").style.display = "inline-block";
  document.getElementById("stop").style.display = "none";
  document.getElementById("status").textContent = "Tracking dihentikan";
}

// Event listeners
document.getElementById("start").addEventListener("click", startTracking);
document.getElementById("stop").addEventListener("click", stopTracking);

// Mulai
initMap();