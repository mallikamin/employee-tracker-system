// map.js - Updated to use Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    orderBy,
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Same Firebase config as mobile app
const firebaseConfig = {
    apiKey: "AIzaSyCZa6IhBQRxr11Uxi-s2fg3o5sZ0Sx0Kvs",
    authDomain: "tracker-f78a7.firebaseapp.com",
    projectId: "tracker-f78a7",
    storageBucket: "tracker-f78a7.appspot.com",
    messagingSenderId: "1011575319382",
    appId: "1:1011575319382:web:b75329c5490d8adbedc4f7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadEmployeeLocations() {
    try {
        console.log("Loading locations from Firebase...");
        
        // Query locations collection
        const locationsQuery = query(
            collection(db, "locations"), 
            orderBy("clientTimestamp", "desc")
        );
        
        const querySnapshot = await getDocs(locationsQuery);
        const locations = [];
        const employeeMap = {};
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            locations.push({
                id: doc.id,
                ...data,
                timestamp: data.clientTimestamp || new Date().toISOString()
            });
            
            // Group by employee for summary
            if (!employeeMap[data.employeeId]) {
                employeeMap[data.employeeId] = {
                    name: data.employeeName,
                    department: data.department,
                    lastLocation: data,
                    count: 0
                };
            }
            employeeMap[data.employeeId].count++;
        });
        
        console.log(`Loaded ${locations.length} locations from Firebase`);
        updateEmployeeCards(employeeMap);
        
        // Update map with all locations
        updateMapWithLocations(locations);
        
        // Real-time updates
        setupRealtimeListener();
        
    } catch (error) {
        console.error("Error loading locations:", error);
        document.getElementById('employee-list').innerHTML = 
            `<div class="error">Error loading data: ${error.message}</div>`;
    }
}

function updateEmployeeCards(employeeMap) {
    const container = document.getElementById('employee-list');
    container.innerHTML = '';
    
    Object.entries(employeeMap).forEach(([empId, data]) => {
        const card = document.createElement('div');
        card.className = 'employee-card';
        
        const lastLoc = data.lastLocation;
        const timeAgo = lastLoc.timestamp ? 
            getTimeAgo(new Date(lastLoc.timestamp)) : 'No data';
        
        card.innerHTML = `
            <div class="employee-header">
                <span class="employee-initial">${data.name.charAt(0)}</span>
                <div>
                    <h3>${data.name}</h3>
                    <p>${empId} | ${data.department}</p>
                </div>
            </div>
            <div class="employee-details">
                <div class="location-info">
                    <strong>📍 Last Location:</strong>
                    ${lastLoc ? 
                        `${lastLoc.lat.toFixed(6)}, ${lastLoc.lng.toFixed(6)}<br>
                        <small>Accuracy: ${Math.round(lastLoc.accuracy)}m</small>` : 
                        'No location data'}
                </div>
                <div class="tracking-info">
                    <p><strong>Last seen:</strong> ${timeAgo}</p>
                    <p><strong>Total records:</strong> ${data.count}</p>
                </div>
                <button class="btn-view-locations" onclick="viewEmployeeLocations('${empId}')">
                    View All Locations
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateMapWithLocations(locations) {
    // Clear existing markers
    if (window.map) {
        window.map.remove();
    }
    
    // Initialize map centered on first location or default
    const firstLoc = locations[0];
    const center = firstLoc ? 
        [firstLoc.lat, firstLoc.lng] : 
        [31.5497, 74.3436]; // Default to Lahore
    
    window.map = L.map('map').setView(center, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    // Add markers for each location
    locations.forEach(loc => {
        if (loc.lat && loc.lng) {
            const marker = L.marker([loc.lat, loc.lng]).addTo(map);
            marker.bindPopup(`
                <strong>${loc.employeeName}</strong><br>
                ${loc.employeeId}<br>
                ${new Date(loc.timestamp).toLocaleString()}<br>
                Accuracy: ${Math.round(loc.accuracy)}m
            `);
        }
    });
}

function setupRealtimeListener() {
    // Listen for new location updates in real-time
    const locationsRef = collection(db, "locations");
    const q = query(locationsRef, orderBy("clientTimestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                console.log("New location added:", change.doc.data());
                // Update UI with new location
                loadEmployeeLocations(); // Refresh data
            }
        });
    });
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
}

// Export for use in HTML
window.viewEmployeeLocations = async function(employeeId) {
    try {
        const q = query(
            collection(db, "locations"),
            orderBy("clientTimestamp", "desc")
        );
        const snapshot = await getDocs(q);
        
        const employeeLocs = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.employeeId === employeeId) {
                employeeLocs.push(data);
            }
        });
        
        alert(`${employeeId} has ${employeeLocs.length} location records`);
        console.log(employeeLocs);
    } catch (error) {
        console.error("Error:", error);
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadEmployeeLocations();
});