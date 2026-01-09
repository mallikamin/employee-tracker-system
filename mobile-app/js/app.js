// mobile-app/js/app.js — Complete Mobile App
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase config
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

console.log("✅ Firebase initialized");

class EmployeeTrackerApp {
    constructor() {
        this.employee = null;
        this.watchId = null;
        this.periodicInterval = null;
        this.lastLocationTime = null;
        this.todayCount = 0;
        this.init();
    }

    async init() {
        // Hide loader
        const loader = document.querySelector('.loader');
        if (loader) loader.style.display = 'none';
        
        this.loadEmployee();
        this.renderUI();
        this.setupEventListeners();
    }

    loadEmployee() {
        const saved = localStorage.getItem("employee_profile");
        if (saved) {
            this.employee = JSON.parse(saved);
            console.log("Loaded existing employee:", this.employee);
        }
    }

    // ============= UI METHODS =============
    renderUI() {
        const app = document.getElementById('app');
        
        if (!this.employee) {
            this.renderRegistrationForm(app);
        } else {
            this.renderDashboard(app);
        }
    }

    renderRegistrationForm(container) {
        container.innerHTML = `
            <div class="container">
                <div class="form-container">
                    <h1>👨‍💼 Employee Tracker</h1>
                    <p class="subtitle">Register with Firebase</p>
                    
                    <div class="input-group">
                        <label>Employee ID</label>
                        <input type="text" id="empId" placeholder="EMP001" value="EMP${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}">
                    </div>
                    
                    <div class="input-group">
                        <label>Full Name</label>
                        <input type="text" id="empName" placeholder="John Smith" value="Test User">
                    </div>
                    
                    <div class="input-group">
                        <label>Department</label>
                        <input type="text" id="empDept" placeholder="Sales" value="Testing">
                    </div>
                    
                    <button class="btn btn-primary" id="registerBtn">
                        Register & Start Tracking
                    </button>
                    
                    <div style="margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 5px;">
                        <p style="margin: 0; font-size: 12px; color: #666;">
                            <strong>Test Mode:</strong> Using Firebase Project: tracker-f78a7
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    renderDashboard(container) {
        container.innerHTML = `
            <div class="container">
                <div class="dashboard">
                    <div class="employee-header">
                        <h1>👋 ${this.employee.name}</h1>
                        <p style="color:#666; margin-bottom:30px;">
                            ${this.employee.employeeId} | ${this.employee.department}
                        </p>
                    </div>
                    
                    <div class="status-card ${this.watchId ? 'active' : 'inactive'}">
                        <h3>
                            <span class="status-indicator ${this.watchId ? 'active' : 'inactive'}"></span>
                            Status: ${this.watchId ? 'LIVE TRACKING' : 'INACTIVE'}
                        </h3>
                        <p id="lastLocationText">
                            ${this.lastLocationTime ? 
                                `Last update: ${this.lastLocationTime.toLocaleTimeString()}` : 
                                'No location data yet'}
                        </p>
                        
                        <div class="button-group">
                            <button class="btn ${this.watchId ? 'btn-danger' : 'btn-primary'}" 
                                    id="toggleBtn">
                                ${this.watchId ? '⏸️ Stop Tracking' : '▶️ Start Live Tracking'}
                            </button>
                            <button class="btn btn-secondary" id="manualLocationBtn">
                                📍 Get Location Now
                            </button>
                        </div>
                    </div>
                    
                    <div style="margin-top: 30px;">
                        <button class="btn btn-secondary" id="testFirebaseBtn">
                            🔥 Test Firebase
                        </button>
                        <button class="btn btn-danger" id="logoutBtn" style="margin-top:10px;">
                            🚪 Logout
                        </button>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                        <h4>📊 Debug Info:</h4>
                        <p style="font-size: 12px; color: #666;">
                            Status: ${this.watchId ? 'Active' : 'Inactive'}<br>
                            Last update: ${this.lastLocationTime ? this.lastLocationTime.toLocaleTimeString() : 'Never'}<br>
                            Employee: ${this.employee.employeeId}
                        </p>
                        <button class="btn btn-small" onclick="window.location.reload()" style="margin-right: 10px;">
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </div>
        `;
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
            
            // Manual location
            const manualBtn = document.getElementById('manualLocationBtn');
            if (manualBtn) {
                manualBtn.addEventListener('click', () => this.getManualLocation());
            }
            
            // Test Firebase
            const testBtn = document.getElementById('testFirebaseBtn');
            if (testBtn) {
                testBtn.addEventListener('click', () => this.testFirebase());
            }
            
            // Logout
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.logout());
            }
        }, 100);
    }

    // ============= BUSINESS LOGIC =============
    async register() {
        const empId = document.getElementById("empId").value.trim();
        const name = document.getElementById("empName").value.trim();
        const dept = document.getElementById("empDept").value.trim() || "General";

        if (!empId || !name) {
            alert("Employee ID and Name required");
            return;
        }

        try {
            // Get location first
            const position = await this.getCurrentLocationWithPermission();
            
            this.employee = {
                employeeId: empId,
                name: name,
                department: dept,
                deviceId: 'DEV-' + Math.random().toString(36).substr(2, 9),
                registeredAt: new Date().toISOString()
            };

            // 1. Save employee to Firebase
            await setDoc(doc(db, "employees", empId), {
                ...this.employee,
                registeredAt: serverTimestamp(),
                isOnline: true
            });

            // 2. Save initial location
            await this.saveLocation(position, true);
            
            // 3. Save locally
            localStorage.setItem("employee_profile", JSON.stringify(this.employee));
            
            // 4. Start tracking
            this.startTracking();

            alert("✅ Registered successfully! First location captured.");
            this.renderUI();
            
        } catch (error) {
            console.error("Registration error:", error);
            if (error.code === 1) {
                alert("❌ Location permission required!\n\nPlease enable location access to register.");
            } else {
                alert("❌ Registration failed: " + error.message);
            }
        }
    }

    async toggleTracking() {
        if (this.watchId) {
            this.stopTracking();
        } else {
            await this.startTracking();
        }
        this.renderUI();
    }

    async startTracking() {
        if (!navigator.geolocation) {
            alert("Geolocation not supported");
            return;
        }

        try {
            // Get initial location
            const position = await this.getCurrentLocationWithPermission();
            await this.saveLocation(position, false);
            
            // Start watchPosition
            this.watchId = navigator.geolocation.watchPosition(
                async (pos) => {
                    if (pos.coords.accuracy < 100) { // Only if accurate
                        await this.saveLocation(pos, false);
                    }
                },
                (err) => {
                    console.error("GPS error:", err);
                    // Fallback to periodic
                    this.startPeriodicFallback();
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 30000,
                    timeout: 10000
                }
            );

            // Start 15-minute backup
            this.startPeriodicTracking();
            
            alert("✅ Live tracking started!\n\nTracking every 15 minutes automatically.");
            
        } catch (error) {
            console.error("Failed to start tracking:", error);
            alert("❌ Could not start tracking: " + error.message);
        }
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        if (this.periodicInterval) {
            clearInterval(this.periodicInterval);
            this.periodicInterval = null;
        }
        
        // Mark as offline in Firebase
        if (this.employee) {
            setDoc(doc(db, "employees", this.employee.employeeId), {
                isOnline: false,
                lastSeen: serverTimestamp()
            }, { merge: true });
        }
        
        console.log("Tracking stopped");
        alert("Tracking stopped");
    }

    startPeriodicTracking() {
        // Clear existing interval
        if (this.periodicInterval) {
            clearInterval(this.periodicInterval);
        }
        
        // Get location now
        this.getPeriodicLocation();
        
        // Then every 15 minutes
        this.periodicInterval = setInterval(() => {
            this.getPeriodicLocation();
        }, 15 * 60 * 1000);
        
        console.log("⏰ 15-minute periodic tracking started");
    }

    async getPeriodicLocation() {
        if (!this.employee) return;
        
        try {
            console.log("⏰ Getting periodic location...");
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,
                    maximumAge: 300000,
                    timeout: 5000
                });
            });
            
            await this.saveLocation(position, false);
            this.lastLocationTime = new Date();
            console.log("✅ Periodic location saved");
            
        } catch (error) {
            console.warn("Periodic location failed:", error.message);
        }
    }

    startPeriodicFallback() {
        console.log("🔄 Falling back to periodic tracking");
        this.startPeriodicTracking();
    }

    getCurrentLocationWithPermission() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    async getManualLocation() {
        try {
            alert("Getting your current location...");
            const position = await this.getCurrentLocationWithPermission();
            await this.saveLocation(position, false);
            this.lastLocationTime = new Date();
            this.renderUI();
            alert("✅ Location saved manually!");
        } catch (error) {
            alert("❌ Failed: " + error.message);
        }
    }

    async saveLocation(position, isInitial = false) {
        if (!this.employee) return;

        try {
            const locationData = {
                employeeId: this.employee.employeeId,
                employeeName: this.employee.name,
                department: this.employee.department,
                deviceId: this.employee.deviceId,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: Math.round(position.coords.accuracy),
                speed: position.coords.speed || 0,
                isInitial: isInitial,
                source: 'mobile-app',
                timestamp: serverTimestamp(),
                clientTimestamp: new Date().toISOString()
            };

            console.log("📍 Saving location:", locationData.lat, locationData.lng);
            
            // Save to Firebase
            await addDoc(collection(db, "locations"), locationData);
            
            // Update employee's last location
            await setDoc(doc(db, "employees", this.employee.employeeId), {
                lastLocation: {
                    lat: locationData.lat,
                    lng: locationData.lng,
                    timestamp: serverTimestamp()
                },
                lastSeen: serverTimestamp(),
                isOnline: true
            }, { merge: true });

            console.log("✅ Location saved to Firebase");
            this.lastLocationTime = new Date();
            
        } catch (error) {
            console.error("❌ Save location error:", error);
            // Save offline
            this.saveLocationOffline(position, isInitial);
            throw error;
        }
    }

    saveLocationOffline(position, isInitial) {
        if (!this.employee) return;
        
        const offlineLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
            employeeId: this.employee.employeeId,
            synced: false
        };
        
        const key = 'offline_locations';
        let queue = JSON.parse(localStorage.getItem(key) || '[]');
        queue.push(offlineLocation);
        
        if (queue.length > 100) queue = queue.slice(-100);
        localStorage.setItem(key, JSON.stringify(queue));
        
        console.log("📍 Saved offline, queue size:", queue.length);
    }

    async testFirebase() {
        try {
            await addDoc(collection(db, "test_logs"), {
                message: "Firebase test from mobile app",
                timestamp: serverTimestamp(),
                test: true
            });
            alert("✅ Firebase test successful!");
        } catch (error) {
            alert("❌ Firebase test failed: " + error.message);
        }
    }

    logout() {
        if (confirm("Logout? Your data will remain saved.")) {
            this.stopTracking();
            this.employee = null;
            localStorage.removeItem("employee_profile");
            this.renderUI();
        }
    }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EmployeeTrackerApp();
});