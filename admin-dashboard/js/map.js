// Map functionality for admin dashboard
let map = null;
let markers = [];

function initializeMap() {
    if (!document.getElementById('map')) return;
    
    // Create map centered on Pakistan
    map = L.map('map').setView([30.3753, 69.3451], 6);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
}

function updateMapData(employees, locations) {
    if (!map) initializeMap();
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];
    
    if (locations.length === 0) return;
    
    // Group locations by employee
    const employeeLocations = {};
    locations.forEach(loc => {
        if (!employeeLocations[loc.employeeId]) {
            employeeLocations[loc.employeeId] = [];
        }
        employeeLocations[loc.employeeId].push(loc);
    });
    
    // Add markers for each employee
    Object.entries(employeeLocations).forEach(([empId, empLocations]) => {
        const lastLocation = empLocations[0];
        const employee = employees.find(e => e.employeeId === empId);
        
        if (!lastLocation || !lastLocation.latitude || !lastLocation.longitude) return;
        
        // Create marker with custom icon
        const marker = L.marker([lastLocation.latitude, lastLocation.longitude], {
            title: employee ? employee.name : empId
        }).addTo(map);
        
        // Create popup content
        const popupContent = `
            <div style="padding: 10px; min-width: 200px;">
                <strong>${employee ? employee.name : empId}</strong><br>
                ${employee ? employee.department || 'No department' : ''}<br>
                <hr style="margin: 8px 0;">
                <strong>Last Seen:</strong> ${new Date(lastLocation.timestamp).toLocaleTimeString()}<br>
                <strong>Coordinates:</strong> ${lastLocation.latitude.toFixed(6)}, ${lastLocation.longitude.toFixed(6)}<br>
                ${lastLocation.accuracy ? `<strong>Accuracy:</strong> ${Math.round(lastLocation.accuracy)}m` : ''}
            </div>
        `;
        
        marker.bindPopup(popupContent);
        markers.push(marker);
    });
    
    // Fit map to show all markers
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    
    // Expose updateMapData to admin dashboard
    window.updateMapData = updateMapData;
    window.map = map;
});