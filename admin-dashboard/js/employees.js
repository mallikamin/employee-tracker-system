// Employee Data Management

class EmployeeManager {
    constructor() {
        this.employees = [];
        this.locationLogs = [];
        this.initialize();
    }

    async initialize() {
        await this.loadEmployees();
        await this.loadLocationLogs();
        this.renderEmployeeList();
        this.updateStats();
    }

    // Load employees from JSON file
    async loadEmployees() {
        try {
            const response = await fetch('data/employees.json');
            if (response.ok) {
                this.employees = await response.json();
            } else {
                // If file doesn't exist, create sample data
                this.employees = this.getSampleEmployees();
                await this.saveEmployees();
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            this.employees = this.getSampleEmployees();
        }
    }

    // Load location logs from JSON file
    async loadLocationLogs() {
        try {
            const response = await fetch('data/location_logs.json');
            if (response.ok) {
                this.locationLogs = await response.json();
            } else {
                this.locationLogs = this.getSampleLocationLogs();
                await this.saveLocationLogs();
            }
        } catch (error) {
            console.error('Error loading location logs:', error);
            this.locationLogs = this.getSampleLocationLogs();
        }
    }

    // Save employees to JSON file
    async saveEmployees() {
        try {
            const response = await fetch('data/save_employees.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.employees)
            });
            return response.ok;
        } catch (error) {
            console.error('Error saving employees:', error);
            return false;
        }
    }

    // Save location logs to JSON file
    async saveLocationLogs() {
        try {
            const response = await fetch('data/save_logs.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.locationLogs)
            });
            return response.ok;
        } catch (error) {
            console.error('Error saving location logs:', error);
            return false;
        }
    }

    // Render employee list in sidebar
    renderEmployeeList() {
        const container = document.getElementById('employeeList');
        if (!container) return;

        container.innerHTML = '';

        this.employees.forEach(employee => {
            const lastLocation = this.getLastLocation(employee.id);
            const isActive = this.isEmployeeActive(employee.id);
            
            const employeeElement = document.createElement('div');
            employeeElement.className = `employee-item ${isActive ? 'active' : ''}`;
            employeeElement.dataset.employeeId = employee.id;
            
            employeeElement.innerHTML = `
                <div class="employee-name">
                    <span class="employee-status ${isActive ? 'status-active' : 'status-inactive'}"></span>
                    ${employee.name}
                </div>
                <div class="employee-details">
                    <div>ID: ${employee.id}</div>
                    <div>Dept: ${employee.department}</div>
                    ${lastLocation ? `
                        <div>Last: ${new Date(lastLocation.timestamp).toLocaleTimeString()}</div>
                        <div>Loc: ${lastLocation.latitude.toFixed(4)}, ${lastLocation.longitude.toFixed(4)}</div>
                    ` : '<div>No location data</div>'}
                </div>
            `;

            employeeElement.addEventListener('click', () => {
                this.selectEmployee(employee.id);
            });

            container.appendChild(employeeElement);
        });

        // Update department filter
        this.updateDepartmentFilter();
    }

    // Get last location for an employee
    getLastLocation(employeeId) {
        const employeeLogs = this.locationLogs.filter(log => log.employeeId === employeeId);
        if (employeeLogs.length === 0) return null;
        
        return employeeLogs.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        )[0];
    }

    // Check if employee is active (has location in last 2 hours)
    isEmployeeActive(employeeId) {
        const lastLocation = this.getLastLocation(employeeId);
        if (!lastLocation) return false;
        
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        return new Date(lastLocation.timestamp) > twoHoursAgo;
    }

    // Select employee (for map focus)
    selectEmployee(employeeId) {
        // Remove active class from all employees
        document.querySelectorAll('.employee-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected employee
        const selectedItem = document.querySelector(`.employee-item[data-employee-id="${employeeId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
        
        // Trigger map update
        if (window.mapManager) {
            window.mapManager.focusOnEmployee(employeeId);
        }
    }

    // Update statistics
    updateStats() {
        const activeCount = this.employees.filter(emp => 
            this.isEmployeeActive(emp.id)
        ).length;
        
        const today = new Date().toDateString();
        const locationsToday = this.locationLogs.filter(log => {
            const logDate = new Date(log.timestamp).toDateString();
            return logDate === today;
        }).length;
        
        document.getElementById('activeCount').textContent = activeCount;
        document.getElementById('locationsToday').textContent = locationsToday;
        document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
    }

    // Update department filter dropdown
    updateDepartmentFilter() {
        const select = document.getElementById('departmentFilter');
        if (!select) return;
        
        // Get unique departments
        const departments = [...new Set(this.employees.map(emp => emp.department))];
        
        // Clear existing options except "All"
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add department options
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            select.appendChild(option);
        });
    }

    // Get sample data (for testing)
    getSampleEmployees() {
        return [
            {
                id: "EMP001",
                name: "John Smith",
                department: "Sales",
                contact: "john@company.com",
                registeredAt: "2024-01-15T09:00:00Z"
            },
            {
                id: "EMP002",
                name: "Sarah Johnson",
                department: "Marketing",
                contact: "sarah@company.com",
                registeredAt: "2024-01-15T09:30:00Z"
            },
            {
                id: "EMP003",
                name: "Mike Chen",
                department: "Operations",
                contact: "mike@company.com",
                registeredAt: "2024-01-14T10:15:00Z"
            },
            {
                id: "EMP004",
                name: "Emma Wilson",
                department: "Sales",
                contact: "emma@company.com",
                registeredAt: "2024-01-16T08:45:00Z"
            }
        ];
    }

    getSampleLocationLogs() {
        const logs = [];
        const employeeIds = ["EMP001", "EMP002", "EMP003", "EMP004"];
        const today = new Date();
        
        employeeIds.forEach(empId => {
            // Create 5 location points for each employee today
            for (let i = 0; i < 5; i++) {
                const timestamp = new Date(today);
                timestamp.setHours(9 + i * 2, Math.floor(Math.random() * 60));
                
                logs.push({
                    employeeId: empId,
                    timestamp: timestamp.toISOString(),
                    latitude: 31.5204 + (Math.random() - 0.5) * 0.1,
                    longitude: 74.3587 + (Math.random() - 0.5) * 0.1,
                    accuracy: 15 + Math.random() * 30,
                    speed: Math.random() * 10
                });
            }
        });
        
        return logs;
    }

    // Export data as Excel
    exportToExcel() {
        try {
            // Prepare data
            const exportData = this.employees.map(emp => {
                const locations = this.locationLogs
                    .filter(log => log.employeeId === emp.id)
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                
                const lastLocation = locations[locations.length - 1];
                
                return {
                    "Employee ID": emp.id,
                    "Name": emp.name,
                    "Department": emp.department,
                    "Contact": emp.contact || "",
                    "Registered Date": new Date(emp.registeredAt).toLocaleDateString(),
                    "Total Locations": locations.length,
                    "Last Location Time": lastLocation ? new Date(lastLocation.timestamp).toLocaleString() : "None",
                    "Last Latitude": lastLocation ? lastLocation.latitude.toFixed(6) : "",
                    "Last Longitude": lastLocation ? lastLocation.longitude.toFixed(6) : ""
                };
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);
            
            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Employees");
            
            // Add location data as second sheet
            const locationSheet = XLSX.utils.json_to_sheet(this.locationLogs);
            XLSX.utils.book_append_sheet(wb, locationSheet, "Location Logs");
            
            // Generate file
            XLSX.writeFile(wb, `employee_tracking_${new Date().toISOString().split('T')[0]}.xlsx`);
            
            return true;
        } catch (error) {
            console.error('Export error:', error);
            return false;
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.employeeManager = new EmployeeManager();
    
    // Setup event listeners
    document.getElementById('exportBtn')?.addEventListener('click', () => {
        window.employeeManager.exportToExcel();
    });
    
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        window.employeeManager.initialize();
    });
    
    // Auto-refresh every 5 minutes
    setInterval(() => {
        window.employeeManager.initialize();
    }, 5 * 60 * 1000);
});