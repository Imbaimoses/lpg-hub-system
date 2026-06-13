# LPG Cylinder Inventory Management System

## Overview
A simple, fast, web-based inventory management system for tracking LPG cylinders using barcode/GLP codes. Built for warehouse scanning workflows with mobile-friendly UI.

## Features

### Core Functionality
- **Scan IN**: Add cylinders to inventory with brand, weight, and status
- **Scan OUT**: Remove cylinders from inventory with automatic details lookup
- **Inventory Dashboard**: View all cylinders grouped by brand and status
- **Search**: Find cylinders by GLP code
- **Barcode Generation**: Generate and download barcodes for GLP codes

### Business Rules Enforced
1. **Barcode Validation**: Only GLP-prefixed codes are accepted
2. **Unique Cylinders**: Each GLP code is unique (PRIMARY KEY)
3. **Single State**: Each cylinder is either IN or OUT
4. **Duplicate Prevention**: Cannot register the same cylinder twice
5. **Scan OUT Verification**: Shows details before confirming removal

## Database Structure

### Cylinder Entity
```javascript
{
  glp_code: string,        // Unique, starts with "GLP"
  brand: string,           // PayGo, Wajiko, or GreenWells
  status: string,          // "Full" or "Empty"
  weight: number,          // Weight in kg
  state: string,           // "IN" or "OUT"
  last_updated: timestamp
}
```

### Movement Log
```javascript
{
  glp_code: string,
  action: string,          // "IN" or "OUT"
  timestamp: timestamp
}
```

## Project Structure
```
lpg-hub-system/
├── index.html            # Main HTML structure
├── css/
│   └── styles.css        # Styling (responsive, mobile-friendly)
├── js/
│   ├── app.js            # Main application logic
│   ├── db.js             # Database manager (localStorage)
│   └── barcode.js        # Barcode generation utility
└── README.md
```

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Imbaimoses/lpg-hub-system.git
   cd lpg-hub-system
   ```

2. **Open in browser**
   - Simply open `index.html` in a web browser
   - No server or build process required
   - Works offline with browser localStorage

3. **Optional: Host on GitHub Pages**
   ```bash
   git push origin main
   # Go to repository Settings > Pages > Enable GitHub Pages from main branch
   ```

## Usage Guide

### Scan IN (Adding Cylinders)
1. Click **"📥 Scan IN"** tab
2. Scan or enter GLP barcode
3. Select brand (PayGo, Wajiko, GreenWells)
4. Enter weight in kg
5. Select status (Full or Empty)
6. Click **"✓ Register Cylinder"**

### Scan OUT (Removing Cylinders)
1. Click **"📤 Scan OUT"** tab
2. Scan or enter GLP barcode
3. Click **"🔍 Search Cylinder"**
4. Review cylinder details
5. Click **"✓ Confirm Scan OUT"**

### Inventory Dashboard
1. Click **"📊 Inventory"** tab
2. View all cylinders grouped by brand and status
3. Search by GLP code using the search box
4. Click **"📤 Scan Out"** button on any cylinder
5. Click **"🔄 Refresh"** to update counts

## Validation Rules

| Rule | Message | Trigger |
|------|---------|----------|
| Invalid Barcode | "Invalid barcode. Scan a GLP cylinder only." | Code doesn't start with "GLP" |
| Duplicate | "Cylinder already exists in inventory" | Duplicate scan-in attempt |
| Already Out | "Cylinder already scanned out" | Scan out of already-removed cylinder |
| Not Found | "Cylinder not found in inventory" | Scan out of non-existent cylinder |

## Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: Browser localStorage (no server required)
- **Responsive**: Mobile-first design
- **No Dependencies**: Zero external libraries

## Performance
- ⚡ Fast barcode scanning workflow
- 📱 Mobile-optimized interface
- 🔄 Real-time inventory updates
- 💾 Offline capability

## Browser Compatibility
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Data Persistence
- All data stored in browser localStorage
- Persists between sessions
- Can be exported/backed up by accessing console

## Future Enhancements
- [ ] CSV export functionality
- [ ] Movement history analytics
- [ ] QR code scanning (camera integration)
- [ ] Multi-user support with authentication
- [ ] Cloud sync (Firebase/backend)
- [ ] Barcode label printing
- [ ] Batch operations
- [ ] Advanced reporting and analytics

## License
MIT License

## Support
For issues or feature requests, please open an issue on GitHub.

## Author
**Imbaimoses**
- GitHub: [@Imbaimoses](https://github.com/Imbaimoses)
