// admin-dashboard/js/map.js — Firebase Live Map Version

let map = null;
let markers = [];

function initializeMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl || map) return;

  map = L.map("map").setView([30.3753, 69.3451], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(map);
}

function updateMapData(employees, locations) {
  if (!map) initializeMap();
  if (!map || !locations?.length) return;

  // Clear old markers
  markers.forEach(m => m.remove());
  markers = [];

  // Group by employee
  const byEmployee = {};
  locations.forEach(loc => {
    if (!loc.lat || !loc.lng) return;
    if (!byEmployee[loc.employeeId]) byEmployee[loc.employeeId] = [];
    byEmployee[loc.employeeId].push(loc);
  });

  Object.entries(byEmployee).forEach(([employeeId, logs]) => {
    const last = logs[0];
    const emp = employees.find(e => e.employeeId === employeeId);

    if (!last) return;

    const time = last.timestamp?.seconds
      ? new Date(last.timestamp.seconds * 1000).toLocaleTimeString()
      : "Unknown";

    const marker = L.marker([last.lat, last.lng], {
      title: emp ? emp.name : employeeId
    }).addTo(map);

    marker.bindPopup(`
      <div style="min-width:200px">
        <strong>${emp?.name || employeeId}</strong><br>
        ${emp?.department || ""}<br>
        <hr>
        <strong>Last Seen:</strong> ${time}<br>
        <strong>Coords:</strong> ${last.lat.toFixed(5)}, ${last.lng.toFixed(5)}<br>
        ${last.accuracy ? `<strong>Accuracy:</strong> ${Math.round(last.accuracy)}m` : ""}
      </div>
    `);

    markers.push(marker);
  });

  if (markers.length) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.15));
  }
}

// Make available globally
window.updateMapData = updateMapData;

document.addEventListener("DOMContentLoaded", initializeMap);
