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
            this.employee = {
                employeeId: empId,
                name: name,
                department: dept,
                deviceId: 'DEV-' + Math.random().toString(36).substr(2, 9),
                registeredAt: new Date().toISOString()
            };

            // Save to Firebase
            await setDoc(doc(db, "employees", empId), {
                ...this.employee,
                registeredAt: serverTimestamp()
            });

            // Save locally
            localStorage.setItem("employee_profile", JSON.stringify(this.employee));

            alert("✅ Registered successfully!");
            this.render();
            
        } catch (error) {
            console.error("Registration error:", error);
            alert("❌ Registration failed: " + error.message);
        }
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

        // Request permission first
        try {
            await this.getCurrentLocation();
            
            this.watchId = navigator.geolocation.watchPosition(
                pos => this.saveLocation(pos),
                err => {
                    console.error("GPS error", err);
                    alert("GPS error: " + err.message);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 30000,
                    timeout: 10000
                }
            );

            alert("📍 Live tracking started!");
            
        } catch (error) {
            alert("❌ Need location permission to track");
        }
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            alert("Tracking stopped");
        }
    }

    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
    }

    async saveLocation(position) {
        if (!this.employee) return;

        try {
            const locationData = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                speed: position.coords.speed || 0,
                timestamp: serverTimestamp(),
                employeeId: this.employee.employeeId,
                employeeName: this.employee.name,
                deviceId: this.employee.deviceId
            };

            // Save to Firebase
            await addDoc(collection(db, "locations"), locationData);

            // Update status
            this.showStatus(`📍 ${new Date().toLocaleTimeString()}`);

        } catch (error) {
            console.error("Save location error:", error);
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