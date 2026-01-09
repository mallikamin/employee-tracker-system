// mobile-app/js/app.js — SIMPLIFIED VERSION

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase config (same as in index.html)
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

console.log("✅ Firebase initialized in app.js");

class EmployeeTrackerApp {
    constructor() {
        this.employee = null;
        this.watchId = null;
        this.periodicInterval = null;  // For 15-min intervals
        this.lastLocationTime = null;
        this.init();
    }

    async init() {
        // Hide loader
        const loader = document.querySelector('.loader');
        if (loader) loader.style.display = 'none';
        
        this.loadEmployee();
        this.render();
        this.setupEventListeners();
    }

    loadEmployee() {
        const saved = localStorage.getItem("employee_profile");
        if (saved) {
            this.employee = JSON.parse(saved);
            console.log("Loaded employee:", this.employee);
            // Don't auto-start tracking for safety
        }
    }

    render() {
        const app = document.getElementById('app');
        
        if (!this.employee) {
            app.innerHTML = `
                <div class="container">
                    <div class="form-container">
                        <h1>👨‍💼 Employee Tracker</h1>
                        <p class="subtitle">Register with Firebase</p>
                        
                        <div class="input-group">
                            <label>Employee ID</label>
                            <input type="text" id="empId" placeholder="EMP001" value="EMP001">
                        </div>
                        
                        <div class="input-group">
                            <label>Full Name</label>
                            <input type="text" id="empName" placeholder="John Smith" value="John Doe">
                        </div>
                        
                        <div class="input-group">
                            <label>Department</label>
                            <input type="text" id="empDept" placeholder="Sales" value="Sales">
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
        } else {
            app.innerHTML = `
                <div class="container">
                    <div class="dashboard">
                        <h1>👋 ${this.employee.name}</h1>
                        <p style="color:#666; margin-bottom:30px;">
                            ${this.employee.employeeId} | ${this.employee.department}
                        </p>
                        
                        <div class="status-card">
                            <h3>📍 Live Tracking</h3>
                            <p id="status" style="color: #4CAF50; font-weight: bold;">
                                ${this.watchId ? 'ACTIVE' : 'READY'}
                            </p>
                            
                            <div class="button-group">
                                <button class="btn ${this.watchId ? 'btn-danger' : 'btn-primary'}" id="toggleBtn">
                                    ${this.watchId ? '⏸️ Stop Tracking' : '▶️ Start Live Tracking'}
                                </button>
                                <button class="btn btn-secondary" id="testFirebaseBtn">
                                    🔥 Test Firebase
                                </button>
                            </div>
                        </div>
                        
                        <div style="margin-top: 30px;">
                            <button class="btn btn-secondary" id="logoutBtn">
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
            const registerBtn = document.getElementById('registerBtn');
            if (registerBtn) {
                registerBtn.addEventListener('click', () => this.register());
            }
            
            const toggleBtn = document.getElementById('toggleBtn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => this.toggleTracking());
            }
            
            const testFirebaseBtn = document.getElementById('testFirebaseBtn');
            if (testFirebaseBtn) {
                testFirebaseBtn.addEventListener('click', () => this.testFirebase());
            }
            
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.logout());
            }
        }, 100);
    }

    async register() {
        const empId = document.getElementById("empId").value.trim();
        const name = document.getElementById("empName").value.trim();
        const dept = document.getElementById("empDept").value.trim() || "General";
    
        if (!empId || !name) {
            alert("Employee ID and Name required");
            return;
        }
    
        try {
            // First get location BEFORE registration
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
                registeredAt: serverTimestamp()
            });
    
            // 2. Immediately save initial location
            await this.saveLocation(position, true); // true = isInitial
            
            // 3. Save locally
            localStorage.setItem("employee_profile", JSON.stringify(this.employee));
            
            // 4. Start periodic tracking
            this.startTracking();
    
            alert("✅ Registered successfully! First location captured.");
            this.render();
            
        } catch (error) {
            console.error("Registration error:", error);
            if (error.code === 1) { // PERMISSION_DENIED
                alert("❌ Location permission required!\n\nPlease enable location access to register.");
            } else {
                alert("❌ Registration failed: " + error.message);
            }
        }
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
    









    initBackgroundSync() {
        // Register background sync
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                return registration.sync.register('sync-locations');
            }).then(() => {
                console.log('Background sync registered');
            }).catch(err => {
                console.log('Background sync registration failed:', err);
            });
        }
        
        // Auto-sync when coming online
        window.addEventListener('online', () => {
            console.log('Device is online, syncing...');
            this.syncOfflineLocations();
        });
        
        // Periodic sync every 15 minutes
        setInterval(() => {
            if (navigator.onLine && this.watchId) {
                this.syncOfflineLocations();
            }
        }, 15 * 60 * 1000); // 15 minutes
    }









    async toggleTracking() {
        if (this.watchId) {
            this.stopTracking();
        } else {
            await this.startTracking();
        }
        this.render();
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
            
            // Start watchPosition for real-time
            this.watchId = navigator.geolocation.watchPosition(
                async (pos) => {
                    // Only save if accuracy is good (< 100 meters)
                    if (pos.coords.accuracy < 100) {
                        await this.saveLocation(pos, false);
                    }
                },
                (err) => {
                    console.error("GPS error:", err);
                    if (err.code === 3) { // TIMEOUT
                        this.startPeriodicFallback();
                    }
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 30000,
                    timeout: 10000
                }
            );
    
            // Start 15-minute periodic intervals as backup
            this.startPeriodicTracking();
            
            alert("✅ Live tracking started!\n\nTracking every 15 minutes automatically.");
            
        } catch (error) {
            console.error("Failed to start tracking:", error);
            alert("❌ Could not start tracking: " + error.message);
        }
    }
    
    // 15-minute periodic tracking
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
        }, 15 * 60 * 1000); // 15 minutes
        
        console.log("⏰ 15-minute periodic tracking started");
    }
    
    // Get location for periodic tracking
    async getPeriodicLocation() {
        if (!this.employee) return;
        
        try {
            console.log("⏰ Getting periodic location...");
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,  // Save battery
                    maximumAge: 300000,  // 5 minutes old is OK
                    timeout: 5000
                });
            });
            
            await this.saveLocation(position, false);
            this.lastLocationTime = new Date();
            console.log("✅ Periodic location saved");
            
        } catch (error) {
            console.warn("Periodic location failed:", error.message);
            // Try again in 1 minute
            setTimeout(() => this.getPeriodicLocation(), 60000);
        }
    }
    
    // Fallback method if watchPosition fails
    startPeriodicFallback() {
        console.log("🔄 Falling back to periodic tracking");
        this.startPeriodicTracking();
    }
    
    // Add to stopTracking method
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

    

// Add to EmployeeTrackerApp class
saveLocationOffline(position) {
    if (!this.employee) return;
    
    const offlineLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || 0,
        timestamp: new Date().toISOString(),
        employeeId: this.employee.employeeId,
        employeeName: this.employee.name,
        deviceId: this.employee.deviceId,
        synced: false
    };
    
    // Save to IndexedDB or localStorage
    const key = 'offline_locations';
    let offlineQueue = JSON.parse(localStorage.getItem(key) || '[]');
    offlineQueue.push(offlineLocation);
    
    // Keep only last 100 offline locations
    if (offlineQueue.length > 100) {
        offlineQueue = offlineQueue.slice(-100);
    }
    
    localStorage.setItem(key, JSON.stringify(offlineQueue));
    console.log("📍 Saved offline, queue size:", offlineQueue.length);
}

async syncOfflineLocations() {
    const key = 'offline_locations';
    let offlineQueue = JSON.parse(localStorage.getItem(key) || '[]');
    
    if (offlineQueue.length === 0) return;
    
    const toSync = offlineQueue.filter(loc => !loc.synced);
    
    for (const location of toSync) {
        try {
            await addDoc(collection(db, "locations"), {
                ...location,
                timestamp: serverTimestamp(),
                synced: true,
                wasOffline: true
            });
            
            location.synced = true;
            console.log("✅ Synced offline location");
        } catch (error) {
            console.error("Failed to sync offline location:", error);
            break; // Stop if error
        }
    }
    
    // Update queue
    offlineQueue = offlineQueue.filter(loc => !loc.synced);
    localStorage.setItem(key, JSON.stringify(offlineQueue));
}







    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
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
            
            // Save to Firebase - locations collection
            await addDoc(collection(db, "locations"), locationData);
            
            // Also update lastLocation in employee document
            await setDoc(doc(db, "employees", this.employee.employeeId), {
                lastLocation: {
                    lat: locationData.lat,
                    lng: locationData.lng,
                    timestamp: serverTimestamp()
                },
                lastSeen: serverTimestamp(),
                isOnline: true
            }, { merge: true }); // merge = update only these fields
    
            console.log("✅ Location saved to Firebase");
            this.showStatus(`📍 ${new Date().toLocaleTimeString()}`);
            
        } catch (error) {
            console.error("❌ Save location error:", error);
            // Save offline for later sync
            this.saveLocationOffline(position, isInitial);
            throw error;
        }
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

    showStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = '#4CAF50';
        }
    }

    logout() {
        if (confirm("Logout? Your data will remain saved.")) {
            this.stopTracking();
            this.employee = null;
            localStorage.removeItem("employee_profile");
            this.render();
        }
    }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EmployeeTrackerApp();
});