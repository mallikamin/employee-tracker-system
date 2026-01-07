# Create setup guide
cat > docs/SETUP_GUIDE.md << 'EOF'
# Employee Tracker - Setup Guide

## 📱 Mobile App Setup (For Employees)

### Option A: Direct URL Access
1. Employees visit: `http://[YOUR-COMPUTER-IP]:8000/mobile-app/`
2. They register with their details
3. Grant location permission when asked
4. App will track location automatically every 15 minutes

### Option B: QR Code (Easiest)
1. Generate QR code for your mobile app URL
2. Employees scan QR code with phone camera
3. Follow same steps as Option A

### Option C: PWA (App-like Experience)
1. Employees visit URL in Chrome/Edge
2. Click "Add to Home Screen" when prompted
3. App will appear like a native app

## 🖥️ Admin Dashboard Setup

### Local Computer:
1. Open `admin-dashboard/index.html` in any browser
2. Or start a local server:
   ```bash
   cd admin-dashboard
   python -m http.server 8000