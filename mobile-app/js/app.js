// mobile-app/js/app.js — Firebase Real-Time Version

import {
    getFirestore,
    collection,
    doc,
    setDoc,
    addDoc,
    serverTimestamp
  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
  
  import { getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  
  const db = getFirestore(getApp());
  
  class EmployeeTrackerApp {
    constructor() {
      this.employee = null;
      this.watchId = null;
      this.init();
    }
  
    init() {
      this.loadEmployee();
      this.render();
    }
  
    loadEmployee() {
      const saved = localStorage.getItem("employee_profile");
      if (saved) {
        this.employee = JSON.parse(saved);
        this.startTracking();
      }
    }
  
    async register() {
      const empId = document.getElementById("empId").value.trim();
      const name = document.getElementById("empName").value.trim();
      const dept = document.getElementById("empDept").value.trim() || "General";
  
      if (!empId || !name) {
        alert("Employee ID and Name required");
        return;
      }
  
      this.employee = {
        employeeId: empId,
        name,
        department: dept,
        deviceId: crypto.randomUUID(),
        registeredAt: serverTimestamp()
      };
  
      await setDoc(doc(db, "employees", empId), this.employee);
      localStorage.setItem("employee_profile", JSON.stringify(this.employee));
  
      alert("✅ Registered successfully");
      this.startTracking();
      this.render();
    }
  
    startTracking() {
      if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
      }
  
      if (this.watchId) return;
  
      this.watchId = navigator.geolocation.watchPosition(
        pos => this.saveLocation(pos),
        err => console.error("GPS error", err),
        {
          enableHighAccuracy: true,
          maximumAge: 60000,
          timeout: 15000
        }
      );
  
      console.log("📍 Live tracking started");
    }
  
    async saveLocation(position) {
      if (!this.employee) return;
  
      const data = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || 0,
        timestamp: serverTimestamp(),
        deviceId: this.employee.deviceId
      };
  
      await addDoc(
        collection(db, "locations", this.employee.employeeId, "logs"),
        data
      );
  
      this.showStatus("📡 Location synced");
    }
  
    render() {
      // Your existing UI render logic remains
    }
  
    showStatus(msg) {
      const el = document.getElementById("status");
      if (!el) return;
      el.innerText = msg;
      el.style.display = "block";
      setTimeout(() => el.style.display = "none", 3000);
    }
  }
  
  window.app = new EmployeeTrackerApp();
  