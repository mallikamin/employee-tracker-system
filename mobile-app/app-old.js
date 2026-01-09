// SIMPLE MOBILE APP - Works offline first
class EmployeeTrackerApp {
    constructor() {
        this.employeeData = null;
        this.isTracking = false;
        this.intervalId = null;
        
        // Try to load existing data
        this.loadFromStorage();
        this.render();
        this.setupEventListeners();
    }

    loadFromStorage() {
        const saved = localStorage.getItem('employee_data');
        if (saved) {
            this.employeeData = JSON.parse(saved);
            this.isTracking = localStorage.getItem('tracking_enabled') === 'true';
        }
    }

    render() {
        const app = document.getElementById('app');
        
        if (!this.employeeData) {
            app.innerHTML = `
                <div class="container">
                    <div class="form-container">
                        <h1>👨‍💼 Employee Tracker</h1>
                        <p class="subtitle">Register once, track automatically</p>
                        
                        <div class="input-group">
                            <label>Employee ID</label>
                            <input type="text" id="empId" placeholder="EMP001">
                        </div>
                        
                        <div class="input-group">
                            <label>Full Name</label>
                            <input type="text" id="empName" placeholder="John Smith">
                        </div>
                        
                        <div class="input-group">
                            <label>Department</label>
                            <input type="text" id="empDept" placeholder="Sales">
                        </div>
                        
                        <button class="btn" id="registerBtn">Register & Start Tracking</button>
                        
                        <p style="text-align:center; margin-top:20px; color:#666; font-size:14px;">
                            Data stored locally. Works offline.
                        </p>
                    </div>
                </div>
            `;
        } else {
            app.innerHTML = `
                <div class="container">
                    <div class="dashboard">
                        <h1>👋 ${this.employeeData.name}</h1>
                        <p style="color:#666; margin-bottom:30px;">${this.employeeData.employeeId} | ${this.employeeData.department}</p>
                        
                        <div class="status-card ${this.isTracking ? 'status-active' : 'status-inactive'}">
                            <h3>
                                <span class="status-indicator ${this.isTracking ? 'active' : 'inactive'}"></span>
                                Tracking: ${this.isTracking ? 'ACTIVE' : 'INACTIVE'}
                            </h3>
                            <p>Location updates: Every 15 minutes</p>
                            
                            <div class="location-info">
                                <h4>Last Location:</h4>
                                <div id="lastLocation" class="coordinates">
                                    No location yet
                                </div>
                            </div>
                        </div>
                        
                        <div class="button-group">
                            <button class="btn ${this.isTracking ? 'btn-danger' : ''}" id="toggleBtn">
                                ${this.isTracking ? '⏸️ Stop Tracking' : '▶️ Start Tracking'}
                            </button>
                            <button class="btn btn-secondary" id="getLocationBtn">
                                📍 Get Location Now
                            </button>
                        </div>
                        
                        <div style="margin-top:30px;">
                            <button class="btn btn-secondary" id="exportBtn">
                                📥 Export Data
                            </button>
                            <button class="btn btn-danger" id="logoutBtn" style="margin-top:10px;">
                                🚪 Logout
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    setupEventListeners() {
        setTimeout(() => {
            // Registration
            const registerBtn = document.getElementById('registerBtn');
            if (registerBtn) {
                registerBtn.addEventListener('click', () => this.register());
            }
            
            // Toggle tracking
            const toggleBtn = document.getElementById('toggleBtn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => this.toggleTracking());
            }
            
            // Get location
            const getLocationBtn = document.getElementById('getLocationBtn');
            if (getLocationBtn) {
                getLocationBtn.addEventListener('click', () => this.getLocation());
            }
            
            // Export
            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportData());
            }
            
            // Logout
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.logout());
            }
        }, 100);
    }

    register() {
        const empId = document.getElementById('empId').value.trim();
        const empName = document.getElementById('empName').value.trim();
        const empDept = document.getElementById('empDept').value.trim();
        
        if (!empId || !empName) {
            alert('Please enter Employee ID and Name');
            return;
        }
        
        this.employeeData = {
            employeeId: empId,
            name: empName,
            department: empDept || 'General',
            registeredAt: new Date().toISOString(),
            deviceId: 'DEV-' + Math.random().toString(36).substr(2, 9)
        };
        
        localStorage.setItem('employee_data', JSON.stringify(this.employeeData));
        
        // Request location permission
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    this.startTracking();
                    this.render();
                },
                () => {
                    alert('Please enable location in settings');
                    this.render();
                }
            );
        } else {
            this.render();
        }
    }

    startTracking() {
        this.isTracking = true;
        localStorage.setItem('tracking_enabled', 'true');
        
        // Get initial location
        this.getLocation();
        
        // Set interval for every 15 minutes
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = setInterval(() => {
            this.getLocation();
        }, 15 * 60 * 1000); // 15 minutes
        
        alert('Auto-tracking started! Location will be saved every 15 minutes.');
    }

    stopTracking() {
        this.isTracking = false;
        localStorage.setItem('tracking_enabled', 'false');
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        alert('Tracking stopped');
    }

    toggleTracking() {
        if (this.isTracking) {
            this.stopTracking();
        } else {
            this.startTracking();
        }
        this.render();
    }

    getLocation() {
        if (!navigator.geolocation) {
            alert('Geolocation not supported');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    timestamp: new Date().toISOString(),
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                
                // Save to local storage
                this.saveLocation(location);
                
                // Update UI
                const lastLocationEl = document.getElementById('lastLocation');
                if (lastLocationEl) {
                    lastLocationEl.innerHTML = `
                        ${new Date().toLocaleTimeString()}<br>
                        ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}<br>
                        Accuracy: ${Math.round(location.accuracy)}m
                    `;
                }
                
                alert('Location saved!');
            },
            (error) => {
                alert('Could not get location: ' + error.message);
            }
        );
    }

    saveLocation(location) {
        const key = `locations_${this.employeeData.employeeId}`;
        let locations = JSON.parse(localStorage.getItem(key) || '[]');
        locations.push({
            ...location,
            employeeId: this.employeeData.employeeId,
            employeeName: this.employeeData.name
        });
        
        // Keep last 1000 locations
        if (locations.length > 1000) {
            locations = locations.slice(-1000);
        }
        
        localStorage.setItem(key, JSON.stringify(locations));
        
        // Update last location
        localStorage.setItem(`last_location_${this.employeeData.employeeId}`, JSON.stringify(location));
    }

    exportData() {
        const key = `locations_${this.employeeData.employeeId}`;
        const locations = JSON.parse(localStorage.getItem(key) || '[]');
        
        if (locations.length === 0) {
            alert('No location data to export');
            return;
        }
        
        const exportData = {
            employee: this.employeeData,
            locations: locations,
            exportDate: new Date().toISOString(),
            totalLocations: locations.length
        };
        
        // Download as JSON file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', `employee_${this.employeeData.employeeId}_${new Date().toISOString().split('T')[0]}.json`);
        link.click();
        
        alert(`Exported ${locations.length} location records`);
    }

    logout() {
        if (confirm('Logout? Your data will remain on this device.')) {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
            
            localStorage.removeItem('tracking_enabled');
            this.employeeData = null;
            this.isTracking = false;
            this.intervalId = null;
            
            this.render();
        }
    }
}

// Start app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EmployeeTrackerApp();
});


import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const db = getFirestore();

async function firebaseTest() {
  try {
    await addDoc(collection(db, "test_logs"), {
      message: "Firebase connection successful",
      time: serverTimestamp()
    });
    console.log("✅ Firebase WRITE successful");
    alert("Firebase is working!");
  } catch (e) {
    console.error("❌ Firebase WRITE failed:", e);
    alert("Firebase failed. Check console.");
  }
}

firebaseTest();
