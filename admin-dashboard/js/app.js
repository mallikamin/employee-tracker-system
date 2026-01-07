// Admin Dashboard - Local Data Version
class AdminDashboard {
    constructor() {
        this.employees = [];
        this.locations = [];
        this.initialize();
    }

    async initialize() {
        this.loadData();
        this.setupUI();
        this.setupEventListeners();
        this.updateTime();
        
        // Auto-refresh every 30 seconds
        setInterval(() => this.updateStats(), 30000);
    }

    loadData() {
        // Try to load from localStorage
        const savedEmployees = localStorage.getItem('admin_employees');
        const savedLocations = localStorage.getItem('admin_locations');
        
        if (savedEmployees) {
            this.employees = JSON.parse(savedEmployees);
        }
        
        if (savedLocations) {
            this.locations = JSON.parse(savedLocations);
        }
        
        this.updateUI();
    }

    saveData() {
        localStorage.setItem('admin_employees', JSON.stringify(this.employees));
        localStorage.setItem('admin_locations', JSON.stringify(this.locations));
    }

    setupUI() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Show active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === tabName + 'Tab') {
                content.classList.add('active');
            }
        });
        
        // Refresh map if needed
        if (tabName === 'map' && window.map) {
            setTimeout(() => window.map.invalidateSize(), 100);
        }
    }

    setupEventListeners() {
        // Import data button
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileImport(e.target.files[0]);
        });
        
        // Export all data
        document.getElementById('exportAll').addEventListener('click', () => {
            this.exportAllData();
        });
        
        // Report buttons
        document.getElementById('dailyReport').addEventListener('click', () => {
            this.generateDailyReport();
        });
        
        document.getElementById('employeeReport').addEventListener('click', () => {
            this.generateEmployeeReport();
        });
        
        document.getElementById('deptReport').addEventListener('click', () => {
            this.generateDepartmentReport();
        });
        
        // Add employee
        document.getElementById('addEmployee').addEventListener('click', () => {
            this.addEmployee();
        });
        
        // Map controls
        document.getElementById('zoomIn')?.addEventListener('click', () => {
            if (window.map) window.map.zoomIn();
        });
        
        document.getElementById('zoomOut')?.addEventListener('click', () => {
            if (window.map) window.map.zoomOut();
        });
        
        document.getElementById('refreshMap')?.addEventListener('click', () => {
            this.updateMap();
        });
    }

    async handleFileImport(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.employee && data.locations) {
                    // Import employee data
                    const existingIndex = this.employees.findIndex(emp => 
                        emp.employeeId === data.employee.employeeId
                    );
                    
                    if (existingIndex >= 0) {
                        this.employees[existingIndex] = data.employee;
                    } else {
                        this.employees.push(data.employee);
                    }
                    
                    // Import locations
                    this.locations = [...this.locations, ...data.locations];
                    
                    // Remove duplicates based on timestamp
                    this.locations = this.locations.filter((loc, index, self) =>
                        index === self.findIndex(t => 
                            t.timestamp === loc.timestamp && 
                            t.employeeId === loc.employeeId
                        )
                    );
                    
                    // Sort by timestamp
                    this.locations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    
                    // Keep only last 5000 locations
                    if (this.locations.length > 5000) {
                        this.locations = this.locations.slice(0, 5000);
                    }
                    
                    this.saveData();
                    this.updateUI();
                    
                    alert(`Imported ${data.locations.length} locations for ${data.employee.name}`);
                }
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    updateUI() {
        this.updateEmployeeList();
        this.updateDataTable();
        this.updateStats();
        this.updateMap();
    }

    updateEmployeeList() {
        const container = document.getElementById('employeesContainer');
        if (!container) return;
        
        if (this.employees.length === 0) {
            container.innerHTML = '<p>No employees yet. Import data first.</p>';
            return;
        }
        
        let html = '';
        this.employees.forEach(emp => {
            const empLocations = this.locations.filter(l => l.employeeId === emp.employeeId);
            const lastLocation = empLocations[0];
            
            html += `
                <div class="employee-item">
                    <div class="employee-avatar">${emp.name.charAt(0)}</div>
                    <div class="employee-info">
                        <div class="employee-name">${emp.name}</div>
                        <div class="employee-details">
                            ${emp.employeeId} | ${emp.department || 'No dept'}
                            ${lastLocation ? `<br>Last: ${new Date(lastLocation.timestamp).toLocaleTimeString()}` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    updateDataTable() {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;
        
        if (this.employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
            return;
        }
        
        let html = '';
        this.employees.forEach(emp => {
            const empLocations = this.locations.filter(l => l.employeeId === emp.employeeId);
            const lastLocation = empLocations[0];
            const totalLocations = empLocations.length;
            
            html += `
                <tr>
                    <td><strong>${emp.employeeId}</strong></td>
                    <td>${emp.name}</td>
                    <td>${emp.department || '-'}</td>
                    <td>
                        ${lastLocation ? 
                            `${lastLocation.latitude.toFixed(4)}, ${lastLocation.longitude.toFixed(4)}` : 
                            'No location'}
                    </td>
                    <td>${lastLocation ? new Date(lastLocation.timestamp).toLocaleString() : 'Never'}</td>
                    <td>
                        <button class="btn-small" onclick="admin.viewEmployee('${emp.employeeId}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn-small" onclick="admin.exportEmployeeData('${emp.employeeId}')">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }

    updateStats() {
        // Calculate stats
        const totalEmployees = this.employees.length;
        const totalLocations = this.locations.length;
        
        // Calculate active today (last 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeEmployees = new Set(
            this.locations
                .filter(loc => new Date(loc.timestamp) > twentyFourHoursAgo)
                .map(loc => loc.employeeId)
        ).size;
        
        // Update UI
        document.getElementById('totalEmployees').textContent = totalEmployees;
        document.getElementById('activeToday').textContent = activeEmployees;
        document.getElementById('totalLocations').textContent = totalLocations;
        document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
    }

    updateMap() {
        // This will be handled by map.js
        if (window.updateMapData) {
            window.updateMapData(this.employees, this.locations);
        }
    }

    updateTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            setInterval(() => {
                timeElement.textContent = new Date().toLocaleTimeString();
            }, 1000);
        }
    }

    viewEmployee(employeeId) {
        const employee = this.employees.find(e => e.employeeId === employeeId);
        const employeeLocations = this.locations.filter(l => l.employeeId === employeeId);
        
        let reportHTML = `
            <h3>${employee.name} (${employee.employeeId})</h3>
            <div style="margin: 20px 0;">
                <p><strong>Department:</strong> ${employee.department || 'N/A'}</p>
                <p><strong>Total Locations:</strong> ${employeeLocations.length}</p>
            </div>
        `;
        
        if (employeeLocations.length > 0) {
            reportHTML += `
                <h4>Recent Locations (Last 10)</h4>
                <table style="width:100%; margin-top:10px;">
                    <tr>
                        <th>Time</th>
                        <th>Coordinates</th>
                        <th>Accuracy</th>
                    </tr>
            `;
            
            employeeLocations.slice(0, 10).forEach(loc => {
                reportHTML += `
                    <tr>
                        <td>${new Date(loc.timestamp).toLocaleString()}</td>
                        <td>${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}</td>
                        <td>${Math.round(loc.accuracy || 0)}m</td>
                    </tr>
                `;
            });
            
            reportHTML += '</table>';
        }
        
        this.switchTab('reports');
        document.getElementById('reportOutput').innerHTML = reportHTML;
    }

    exportEmployeeData(employeeId) {
        const employee = this.employees.find(e => e.employeeId === employeeId);
        const employeeLocations = this.locations.filter(l => l.employeeId === employeeId);
        
        if (!employee) {
            alert('Employee not found');
            return;
        }
        
        const exportData = {
            employee: employee,
            locations: employeeLocations,
            exportDate: new Date().toISOString(),
            totalLocations: employeeLocations.length
        };
        
        this.downloadJSON(exportData, `employee_${employeeId}_${new Date().toISOString().split('T')[0]}.json`);
    }

    exportAllData() {
        if (this.employees.length === 0) {
            alert('No data to export');
            return;
        }
        
        const exportData = {
            employees: this.employees,
            locations: this.locations,
            exportDate: new Date().toISOString(),
            totalEmployees: this.employees.length,
            totalLocations: this.locations.length
        };
        
        this.downloadJSON(exportData, `all_employees_${new Date().toISOString().split('T')[0]}.json`);
    }

    downloadJSON(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', filename);
        link.click();
    }

    addEmployee() {
        const name = prompt('Enter employee name:');
        const employeeId = prompt('Enter employee ID:');
        const department = prompt('Enter department:');
        
        if (name && employeeId) {
            const newEmployee = {
                employeeId: employeeId,
                name: name,
                department: department || '',
                registeredAt: new Date().toISOString()
            };
            
            this.employees.push(newEmployee);
            this.saveData();
            this.updateUI();
            
            alert(`Employee ${name} added successfully!`);
        }
    }

    generateDailyReport() {
        const today = new Date().toDateString();
        const todayLocations = this.locations.filter(loc => 
            new Date(loc.timestamp).toDateString() === today
        );
        
        let reportHTML = `
            <h3>Daily Report - ${today}</h3>
            <p>Total locations today: ${todayLocations.length}</p>
        `;
        
        if (todayLocations.length > 0) {
            // Group by employee
            const byEmployee = {};
            todayLocations.forEach(loc => {
                if (!byEmployee[loc.employeeId]) byEmployee[loc.employeeId] = [];
                byEmployee[loc.employeeId].push(loc);
            });
            
            reportHTML += '<table style="width:100%; margin-top:20px;">';
            reportHTML += '<tr><th>Employee</th><th>Locations</th><th>First</th><th>Last</th></tr>';
            
            for (const [empId, logs] of Object.entries(byEmployee)) {
                const employee = this.employees.find(e => e.employeeId === empId);
                const first = logs[logs.length - 1];
                const last = logs[0];
                
                reportHTML += `
                    <tr>
                        <td>${employee?.name || empId}</td>
                        <td>${logs.length}</td>
                        <td>${new Date(first.timestamp).toLocaleTimeString()}</td>
                        <td>${new Date(last.timestamp).toLocaleTimeString()}</td>
                    </tr>
                `;
            }
            
            reportHTML += '</table>';
        }
        
        this.switchTab('reports');
        document.getElementById('reportOutput').innerHTML = reportHTML;
    }

    generateEmployeeReport() {
        // Similar to viewEmployee but with export option
        const employeeId = prompt('Enter Employee ID:');
        if (employeeId) {
            this.viewEmployee(employeeId);
        }
    }

    generateDepartmentReport() {
        if (this.employees.length === 0) {
            document.getElementById('reportOutput').innerHTML = '<p>No data available</p>';
            return;
        }
        
        // Group by department
        const byDepartment = {};
        this.employees.forEach(emp => {
            const dept = emp.department || 'Unassigned';
            if (!byDepartment[dept]) byDepartment[dept] = [];
            byDepartment[dept].push(emp);
        });
        
        let reportHTML = '<h3>Department Report</h3>';
        
        for (const [dept, employees] of Object.entries(byDepartment)) {
            reportHTML += `
                <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h4>${dept} (${employees.length} employees)</h4>
                    <ul>
                        ${employees.map(emp => `<li>${emp.name} (${emp.employeeId})</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        this.switchTab('reports');
        document.getElementById('reportOutput').innerHTML = reportHTML;
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminDashboard();
});