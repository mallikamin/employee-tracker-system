// admin-dashboard/js/app.js — Firebase Real-Time Version

import {
    getFirestore,
    collection,
    doc,
    onSnapshot,
    query,
    orderBy
  } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
  
  import { getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  
  const db = getFirestore(getApp());
  
  class AdminDashboard {
    constructor() {
      this.employees = {};
      this.locations = {};
      this.init();
    }
  
    init() {
      this.listenEmployees();
      this.setupUI();
      this.updateTime();
    }
  
    /* ========================
       🔥 FIRESTORE LISTENERS
    ========================= */
  
    listenEmployees() {
      onSnapshot(collection(db, "employees"), snapshot => {
        snapshot.forEach(docSnap => {
          this.employees[docSnap.id] = docSnap.data();
          this.listenEmployeeLocations(docSnap.id);
        });
        this.updateUI();
      });
    }
  
    listenEmployeeLocations(employeeId) {
      const q = query(
        collection(db, "locations", employeeId, "logs"),
        orderBy("timestamp", "desc")
      );
  
      onSnapshot(q, snapshot => {
        this.locations[employeeId] = snapshot.docs.map(d => ({
          id: d.id,
          employeeId,
          ...d.data()
        }));
        this.updateUI();
      });
    }
  
    /* ========================
       🖥️ UI
    ========================= */
  
    setupUI() {
      document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", e => {
          this.switchTab(e.target.dataset.tab);
        });
      });
    }
  
    switchTab(tab) {
      document.querySelectorAll(".tab-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.tab === tab)
      );
      document.querySelectorAll(".tab-content").forEach(c =>
        c.classList.toggle("active", c.id === tab + "Tab")
      );
    }
  
    updateUI() {
      this.renderEmployees();
      this.renderTable();
      this.updateStats();
      this.updateMap();
    }
  
    renderEmployees() {
      const el = document.getElementById("employeesContainer");
      if (!el) return;
  
      const values = Object.values(this.employees);
      if (!values.length) {
        el.innerHTML = "<p>No employees online</p>";
        return;
      }
  
      el.innerHTML = values.map(emp => {
        const logs = this.locations[emp.employeeId] || [];
        const last = logs[0];
        return `
          <div class="employee-item">
            <div class="employee-avatar">${emp.name[0]}</div>
            <div>
              <strong>${emp.name}</strong><br>
              ${emp.employeeId} | ${emp.department}<br>
              ${last ? "Last: " + new Date(last.timestamp?.seconds * 1000).toLocaleTimeString() : "No data"}
            </div>
          </div>
        `;
      }).join("");
    }
  
    renderTable() {
      const tbody = document.getElementById("tableBody");
      if (!tbody) return;
  
      tbody.innerHTML = Object.values(this.employees).map(emp => {
        const logs = this.locations[emp.employeeId] || [];
        const last = logs[0];
        return `
          <tr>
            <td>${emp.employeeId}</td>
            <td>${emp.name}</td>
            <td>${emp.department}</td>
            <td>${last ? `${last.lat.toFixed(5)}, ${last.lng.toFixed(5)}` : "-"}</td>
            <td>${last ? new Date(last.timestamp.seconds * 1000).toLocaleString() : "Never"}</td>
            <td>
              <button onclick="admin.viewEmployee('${emp.employeeId}')">View</button>
            </td>
          </tr>
        `;
      }).join("");
    }
  
    updateStats() {
      const totalEmployees = Object.keys(this.employees).length;
      const totalLocations = Object.values(this.locations)
        .reduce((a, b) => a + b.length, 0);
  
      document.getElementById("totalEmployees").innerText = totalEmployees;
      document.getElementById("totalLocations").innerText = totalLocations;
      document.getElementById("lastUpdated").innerText = new Date().toLocaleTimeString();
    }
  
    updateMap() {
      if (window.updateMapData) {
        const allLocations = Object.values(this.locations).flat();
        window.updateMapData(Object.values(this.employees), allLocations);
      }
    }
  
    updateTime() {
      setInterval(() => {
        const el = document.getElementById("currentTime");
        if (el) el.innerText = new Date().toLocaleTimeString();
      }, 1000);
    }
  
    viewEmployee(employeeId) {
      const emp = this.employees[employeeId];
      const logs = this.locations[employeeId] || [];
  
      let html = `<h3>${emp.name} (${emp.employeeId})</h3>`;
      html += `<p>Total points: ${logs.length}</p>`;
  
      logs.slice(0, 10).forEach(l => {
        html += `<p>${new Date(l.timestamp.seconds * 1000).toLocaleString()} — ${l.lat}, ${l.lng}</p>`;
      });
  
      this.switchTab("reports");
      document.getElementById("reportOutput").innerHTML = html;
    }
  }
  
  window.admin = new AdminDashboard();
  