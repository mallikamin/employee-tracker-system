#!/usr/bin/env python3
"""
Process location logs and generate insights
"""

import json
import os
import csv
from datetime import datetime, timedelta
import math

class LogProcessor:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.logs_dir = os.path.join(data_dir, "logs")
        self.employees_file = os.path.join(data_dir, "employees", "registry.json")
        
        # Ensure directories exist
        os.makedirs(self.logs_dir, exist_ok=True)
        os.makedirs(os.path.dirname(self.employees_file), exist_ok=True)
    
    def process_all_logs(self):
        """Process all log files and generate insights"""
        log_files = [f for f in os.listdir(self.logs_dir) if f.endswith('.json')]
        
        if not log_files:
            print("No log files found")
            return
        
        all_logs = []
        for log_file in log_files:
            file_path = os.path.join(self.logs_dir, log_file)
            try:
                with open(file_path, 'r') as f:
                    log_data = json.load(f)
                    all_logs.append(log_data)
            except Exception as e:
                print(f"Error reading {log_file}: {e}")
        
        if not all_logs:
            print("No valid log data found")
            return
        
        # Generate insights
        insights = self.generate_insights(all_logs)
        
        # Save insights
        insights_file = os.path.join(self.data_dir, f"insights_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(insights_file, 'w') as f:
            json.dump(insights, f, indent=2, default=str)
        
        print(f"Insights saved to: {insights_file}")
        return insights
    
    def generate_insights(self, logs):
        """Generate insights from logs"""
        insights = {
            "generated_at": datetime.now().isoformat(),
            "total_records": len(logs),
            "employees": {},
            "daily_summary": {},
            "movement_analysis": {}
        }
        
        # Group by employee
        employee_logs = {}
        for log in logs:
            emp_id = log.get('employeeId', 'unknown')
            if emp_id not in employee_logs:
                employee_logs[emp_id] = []
            employee_logs[emp_id].append(log)
        
        # Analyze each employee
        for emp_id, emp_logs in employee_logs.items():
            # Sort by timestamp
            emp_logs.sort(key=lambda x: x.get('timestamp', ''))
            
            # Calculate stats
            if len(emp_logs) >= 2:
                total_distance = 0
                for i in range(1, len(emp_logs)):
                    dist = self.calculate_distance(emp_logs[i-1], emp_logs[i])
                    total_distance += dist
                
                insights["employees"][emp_id] = {
                    "total_locations": len(emp_logs),
                    "first_location": emp_logs[0].get('timestamp'),
                    "last_location": emp_logs[-1].get('timestamp'),
                    "total_distance_km": round(total_distance, 2),
                    "avg_locations_per_day": self.calculate_avg_per_day(emp_logs)
                }
        
        # Daily summary
        daily_counts = {}
        for log in logs:
            timestamp = log.get('timestamp')
            if timestamp:
                date = timestamp.split('T')[0]
                daily_counts[date] = daily_counts.get(date, 0) + 1
        
        insights["daily_summary"] = daily_counts
        
        # Movement analysis (hours with most activity)
        hourly_counts = {}
        for log in logs:
            timestamp = log.get('timestamp')
            if timestamp:
                hour = datetime.fromisoformat(timestamp.replace('Z', '+00:00')).hour
                hourly_counts[hour] = hourly_counts.get(hour, 0) + 1
        
        insights["movement_analysis"]["hourly_activity"] = dict(sorted(hourly_counts.items()))
        
        return insights
    
    def calculate_distance(self, loc1, loc2):
        """Calculate distance between two coordinates using Haversine formula"""
        try:
            lat1 = float(loc1.get('latitude', 0))
            lon1 = float(loc1.get('longitude', 0))
            lat2 = float(loc2.get('latitude', 0))
            lon2 = float(loc2.get('longitude', 0))
            
            # Haversine formula
            R = 6371  # Earth's radius in km
            
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            
            a = (math.sin(dlat/2) * math.sin(dlat/2) +
                 math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
                 math.sin(dlon/2) * math.sin(dlon/2))
            
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            distance = R * c
            
            return distance
        except:
            return 0
    
    def calculate_avg_per_day(self, logs):
        """Calculate average locations per day"""
        if not logs:
            return 0
        
        dates = set()
        for log in logs:
            timestamp = log.get('timestamp')
            if timestamp:
                dates.add(timestamp.split('T')[0])
        
        if len(dates) == 0:
            return 0
        
        return round(len(logs) / len(dates), 2)
    
    def export_to_excel(self, output_file=None):
        """Export data to Excel-compatible CSV"""
        if output_file is None:
            output_file = os.path.join(self.data_dir, f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
        
        # Collect all log data
        log_files = [f for f in os.listdir(self.logs_dir) if f.endswith('.json')]
        all_data = []
        
        for log_file in log_files:
            file_path = os.path.join(self.logs_dir, log_file)
            try:
                with open(file_path, 'r') as f:
                    log_data = json.load(f)
                    all_data.append(log_data)
            except:
                continue
        
        if not all_data:
            print("No data to export")
            return
        
        # Write to CSV
        with open(output_file, 'w', newline='') as f:
            fieldnames = ['employeeId', 'timestamp', 'latitude', 'longitude', 'accuracy', 'speed']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            
            writer.writeheader()
            for row in all_data:
                # Only include fields that exist
                row_data = {field: row.get(field, '') for field in fieldnames}
                writer.writerow(row_data)
        
        print(f"Data exported to: {output_file}")
        return output_file

if __name__ == "__main__":
    import sys
    
    processor = LogProcessor()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "process":
            processor.process_all_logs()
        elif command == "export":
            if len(sys.argv) > 2:
                processor.export_to_excel(sys.argv[2])
            else:
                processor.export_to_excel()
        else:
            print(f"Unknown command: {command}")
    else:
        # Default: process logs
        processor.process_all_logs()