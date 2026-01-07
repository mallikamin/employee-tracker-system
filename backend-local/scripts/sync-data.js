#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DataSync {
    constructor() {
        this.dataDir = path.join(__dirname, '../data');
        this.employeesFile = path.join(this.dataDir, 'employees/registry.json');
        this.logsDir = path.join(this.dataDir, 'logs');
        
        // Ensure directories exist
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
        if (!fs.existsSync(this.logsDir)) fs.mkdirSync(this.logsDir, { recursive: true });
        if (!fs.existsSync(path.dirname(this.employeesFile))) {
            fs.mkdirSync(path.dirname(this.employeesFile), { recursive: true });
        }
    }

    // Sync mobile data to local storage
    syncFromMobile(mobileDataPath) {
        try {
            if (!fs.existsSync(mobileDataPath)) {
                console.error('Mobile data path not found:', mobileDataPath);
                return false;
            }

            const mobileData = JSON.parse(fs.readFileSync(mobileDataPath, 'utf8'));
            
            // Process each employee's data
            mobileData.forEach(employeeData => {
                const employeeId = employeeData.employeeId;
                
                // Save to logs directory
                const logFile = path.join(this.logsDir, `${employeeId}_${Date.now()}.json`);
                fs.writeFileSync(logFile, JSON.stringify(employeeData, null, 2));
                
                // Update employee registry
                this.updateEmployeeRegistry(employeeData);
            });

            console.log(`Synced ${mobileData.length} employee records`);
            return true;
        } catch (error) {
            console.error('Sync error:', error);
            return false;
        }
    }

    updateEmployeeRegistry(employeeData) {
        let registry = [];
        
        if (fs.existsSync(this.employeesFile)) {
            registry = JSON.parse(fs.readFileSync(this.employeesFile, 'utf8'));
        }

        // Check if employee already exists
        const existingIndex = registry.findIndex(emp => emp.id === employeeData.employeeId);
        
        if (existingIndex >= 0) {
            // Update existing
            registry[existingIndex] = {
                ...registry[existingIndex],
                lastSync: new Date().toISOString(),
                locationCount: (registry[existingIndex].locationCount || 0) + 1
            };
        } else {
            // Add new employee
            registry.push({
                id: employeeData.employeeId,
                name: employeeData.name || 'Unknown',
                department: employeeData.department || 'Unassigned',
                registeredAt: new Date().toISOString(),
                lastSync: new Date().toISOString(),
                locationCount: 1
            });
        }

        // Save registry
        fs.writeFileSync(this.employeesFile, JSON.stringify(registry, null, 2));
    }

    // Generate consolidated report
    generateReport() {
        try {
            const report = {
                generatedAt: new Date().toISOString(),
                employees: [],
                summary: {}
            };

            // Read employee registry
            if (fs.existsSync(this.employeesFile)) {
                report.employees = JSON.parse(fs.readFileSync(this.employeesFile, 'utf8'));
            }

            // Count log files
            const logFiles = fs.readdirSync(this.logsDir).filter(file => file.endsWith('.json'));
            report.summary.totalLogs = logFiles.length;
            report.summary.totalEmployees = report.employees.length;
            
            // Count today's logs
            const today = new Date().toDateString();
            let todayCount = 0;
            
            logFiles.forEach(file => {
                const filePath = path.join(this.logsDir, file);
                const stats = fs.statSync(filePath);
                if (stats.mtime.toDateString() === today) {
                    todayCount++;
                }
            });
            
            report.summary.logsToday = todayCount;

            // Save report
            const reportFile = path.join(this.dataDir, `report_${Date.now()}.json`);
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            
            console.log(`Report generated: ${reportFile}`);
            return reportFile;
        } catch (error) {
            console.error('Generate report error:', error);
            return null;
        }
    }

    // Export to CSV
    exportToCSV() {
        try {
            let csvContent = 'Employee ID,Name,Department,Registered,Last Sync,Location Count\n';
            
            if (fs.existsSync(this.employeesFile)) {
                const registry = JSON.parse(fs.readFileSync(this.employeesFile, 'utf8'));
                
                registry.forEach(emp => {
                    csvContent += `"${emp.id}","${emp.name}","${emp.department}","${emp.registeredAt}","${emp.lastSync}",${emp.locationCount || 0}\n`;
                });
            }

            const csvFile = path.join(this.dataDir, `employees_export_${Date.now()}.csv`);
            fs.writeFileSync(csvFile, csvContent);
            
            console.log(`CSV exported: ${csvFile}`);
            return csvFile;
        } catch (error) {
            console.error('Export CSV error:', error);
            return null;
        }
    }
}

// Command line interface
if (require.main === module) {
    const sync = new DataSync();
    const command = process.argv[2];
    
    switch (command) {
        case 'sync':
            const mobilePath = process.argv[3];
            if (!mobilePath) {
                console.error('Please provide mobile data path');
                process.exit(1);
            }
            sync.syncFromMobile(mobilePath);
            break;
            
        case 'report':
            sync.generateReport();
            break;
            
        case 'export':
            sync.exportToCSV();
            break;
            
        default:
            console.log(`
Usage: node sync-data.js [command]
Commands:
  sync [mobile-data-path]  Sync data from mobile JSON file
  report                   Generate summary report
  export                   Export to CSV
            `);
    }
}

module.exports = DataSync;