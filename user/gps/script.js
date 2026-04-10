// ======================================
// THEME INITIALIZATION
// ======================================
const html = document.documentElement;
const saved = localStorage.getItem('cp-theme') || 'dark';
html.setAttribute('data-theme', saved);

// ======================================
// DEVICE ID
// ======================================
let DEVICE_ID = localStorage.getItem("device_id");

if (!DEVICE_ID) {
  DEVICE_ID = "dev-" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("device_id", DEVICE_ID);
}

const API_URL = "https://script.google.com/macros/s/AKfycbwRJ_WR-1vIkAGA_7UrE9Gfs7Nu7ToyXv-_fx0wQhTT3x8xcFYUvPjJkXNEYCAPumh0CQ/exec";

let map;
let marker;
let polyline;
let watchId = null;
let lastSend = 0;
const MIN_SEND_INTERVAL = 5000;

// ======================================
// INIT MAP
// ======================================
function initMap() {
  map = L.map("map", { zoomControl: true }).setView([-7.446, 112.718], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Tampilkan device id di panel
  document.getElementById("device-name").textContent = DEVICE_ID;
  document.title = `GPS Tracker - ${DEVICE_ID}`;
}

// ======================================
// UPDATE MAP
// ======================================
function updateMap(lat, lng) {
  if (!marker) {
    marker = L.marker([lat, lng], { riseOnHover: true }).addTo(map);
  } else {
    marker.setLatLng([lat, lng]);
  }

  if (!polyline) {
    polyline = L.polyline([], {
      color: "#818cf8",
      weight: 5,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);
  }

  polyline.addLatLng([lat, lng]);
  map.panTo([lat, lng], { animate: true, duration: 1 });
}

// ======================================
// KIRIM GPS
// ======================================
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

  const img = new Image();
  img.src = `${API_URL}?${params.toString()}`;

  document.getElementById("status").textContent =
    `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  document.getElementById("last-update").textContent =
    `Terakhir update: ${new Date().toLocaleTimeString('id-ID')}`;
}

// ======================================
// START TRACKING
// ======================================
function startTracking() {
  if (!navigator.geolocation) {
    alert("Browser tidak mendukung Geolocation");
    return;
  }

  document.getElementById("start").style.display = "none";
  document.getElementById("stop").style.display = "inline-flex";
  document.getElementById("status").textContent = "🔄 Mencari sinyal GPS...";

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      updateMap(lat, lng);
      sendGPS(lat, lng, accuracy);
    },
    (err) => {
      document.getElementById("status").textContent = `❌ GPS Error: ${err.message}`;
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    }
  );
}

// ======================================
// STOP TRACKING
// ======================================
function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  document.getElementById("start").style.display = "inline-flex";
  document.getElementById("stop").style.display = "none";
  document.getElementById("status").textContent = "Tracking telah dihentikan";
  document.getElementById("last-update").textContent = "";
}

// ======================================
// EVENT LISTENER
// ======================================
document.getElementById("start").addEventListener("click", startTracking);
document.getElementById("stop").addEventListener("click", stopTracking);

// ======================================
// INIT
// ======================================
initMap();
