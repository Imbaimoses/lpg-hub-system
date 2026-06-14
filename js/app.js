// ================================
// APP.JS - UI & EVENT HANDLERS
// ================================

// Initialize app on page load
document.addEventListener('DOMContentLoaded', function() {
    updateDashboard();
    updateSettings();
    setupFormAutoComplete();
});

// ==================== SCREEN NAVIGATION ====================
function switchScreenByName(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show selected screen
    const screen = document.getElementById(screenName);
    if (screen) {
        screen.classList.add('active');
    }

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-screen') === screenName) {
            btn.classList.add('active');
        }
    });

    // Refresh screen-specific data
    if (screenName === 'qrcodes') {
        displayCylindersWithQR();
    } else if (screenName === 'dashboard') {
        updateDashboard();
    } else if (screenName === 'settings') {
        updateSettings();
    }
}

// ==================== DASHBOARD ====================
function updateDashboard() {
    const stats = db.getStats();
    
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statFull').textContent = stats.full;
    document.getElementById('statPartial').textContent = stats.partial;
    document.getElementById('statEmpty').textContent = stats.empty;
    document.getElementById('statOut').textContent = stats.out;
    document.getElementById('statWeight').textContent = stats.totalWeight;
}

// ==================== SCAN IN ====================
function handleScanIn(event) {
    event.preventDefault();

    const glpCode = document.getElementById('glpCode').value;
    const brand = document.getElementById('brand').value;
    const weight = document.getElementById('weight').value;
    const status = document.getElementById('status').value;

    const result = db.addCylinder(glpCode, brand, weight, status);
    
    showMessage('scanInMessage', result.success, result.message);

    if (result.success) {
        event.target.reset();
        document.getElementById('glpCode').focus();
        updateDashboard();
        setTimeout(() => {
            switchScreenByName('dashboard');
        }, 1500);
    }
}

// ==================== SCAN OUT ====================
let currentCylinderForRemoval = null;

function handleScanOut(event) {
    event.preventDefault();

    const glpCode = document.getElementById('scanOutCode').value;
    const result = db.findCylinder(glpCode);

    if (!result.success) {
        showMessage('scanOutMessage', false, result.message);
        document.getElementById('cylinderDetails').classList.add('hidden');
        return;
    }

    // Show cylinder details
    currentCylinderForRemoval = result.cylinder;
    displayCylinderDetails(result.cylinder);
    document.getElementById('cylinderDetails').classList.remove('hidden');
    showMessage('scanOutMessage', true, 'Cylinder found. Please confirm removal.');
}

function displayCylinderDetails(cylinder) {
    document.getElementById('detailCode').textContent = cylinder.glp_code;
    document.getElementById('detailBrand').textContent = cylinder.brand;
    document.getElementById('detailWeight').textContent = cylinder.weight + ' kg';
    document.getElementById('detailStatus').textContent = cylinder.status;
    document.getElementById('detailDate').textContent = new Date(cylinder.timestamp).toLocaleString();
}

function confirmScanOut() {
    if (!currentCylinderForRemoval) return;

    const result = db.removeCylinder(currentCylinderForRemoval.glp_code);
    showMessage('scanOutMessage', result.success, result.message);

    if (result.success) {
        document.getElementById('cylinderDetails').classList.add('hidden');
        document.getElementById('scanOutCode').value = '';
        document.getElementById('scanOutCode').focus();
        updateDashboard();
        
        setTimeout(() => {
            switchScreenByName('dashboard');
        }, 1500);
    }

    currentCylinderForRemoval = null;
}

function cancelScanOut() {
    document.getElementById('cylinderDetails').classList.add('hidden');
    document.getElementById('scanOutCode').value = '';
    document.getElementById('scanOutCode').focus();
    currentCylinderForRemoval = null;
}

// ==================== QR CODES DISPLAY ====================
function displayCylindersWithQR() {
    const container = document.getElementById('qrCodeDisplay');
    if (!container) return;
    
    container.innerHTML = ''; // Clear previous
    const cylinders = db.getAll();
    
    if (cylinders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; width: 100%;">No cylinders in inventory</p>';
        return;
    }
    
    cylinders.forEach((cylinder, index) => {
        const qr = generateCylinderQR(cylinder.glp_code, cylinder.weight, index + 1);
        container.appendChild(qr);
    });
}

function printQRCodes() {
    const printWindow = window.open('', '', 'height=600,width=800');
    const container = document.getElementById('qrCodeDisplay');
    
    if (!container || db.getAll().length === 0) {
        alert('No cylinders to print');
        return;
    }

    printWindow.document.write(`
        <html>
            <head>
                <title>LPG Cylinder QR Codes</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .qr-item { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ccc; }
                    .qr-info { text-align: center; margin-bottom: 10px; }
                </style>
            </head>
            <body>
                <h1>LPG Cylinder QR Codes</h1>
                <p>Generated: ${new Date().toLocaleString()}</p>
                ${container.innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
}

function downloadQRCodes() {
    const container = document.getElementById('qrCodeDisplay');
    
    if (!container || db.getAll().length === 0) {
        alert('No cylinders to download');
        return;
    }

    const html = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>LPG Cylinder QR Codes</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; }
                    .qr-container { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
                    .qr-item { background: white; padding: 15px; border: 2px solid #333; border-radius: 8px; }
                    .qr-info { text-align: center; margin-bottom: 10px; font-weight: bold; }
                    h1 { text-align: center; }
                </style>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
            </head>
            <body>
                <h1>LPG Cylinder QR Codes</h1>
                <p style="text-align: center;">Generated: ${new Date().toLocaleString()}</p>
                <div class="qr-container">
                    ${container.innerHTML}
                </div>
            </body>
        </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lpg_qr_codes.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showMessage('qrMessage', true, 'QR codes downloaded successfully!');
}

// ==================== SETTINGS & DATA MANAGEMENT ====================
function updateSettings() {
    const stats = db.getStats();
    const totalRecords = db.data.length;
    const inCount = stats.total;
    const outCount = stats.out;
    
    // Calculate storage size
    const dataString = JSON.stringify(db.data);
    const bytes = new Blob([dataString]).size;
    const kb = (bytes / 1024).toFixed(2);

    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('inInventoryCount').textContent = inCount;
    document.getElementById('outCount').textContent = outCount;
    document.getElementById('storageUsed').textContent = kb + ' KB';
}

function archiveRecords() {
    const days = parseInt(document.getElementById('archiveDays').value) || 30;
    const result = db.archiveOldRecords(days);
    showMessage('settingsMessage', result.success, result.message);
    if (result.success) {
        updateSettings();
    }
}

function exportData() {
    const data = db.exportData();
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'lpg_inventory_export.json', 'application/json');
    showMessage('settingsMessage', true, 'Data exported successfully!');
}

function downloadCSV() {
    const stats = db.getStats();
    const cylinders = db.getAll();

    let csv = 'LPG Cylinder Inventory Report\n';
    csv += `Export Date: ${new Date().toLocaleString()}\n\n`;

    csv += 'SUMMARY STATISTICS\n';
    csv += `Total In Stock,Full,Partial,Empty,Out,Total Weight (kg)\n`;
    csv += `${stats.total},${stats.full},${stats.partial},${stats.empty},${stats.out},${stats.totalWeight}\n\n`;

    csv += 'INVENTORY DETAILS\n';
    csv += 'GLP Code,Brand,Weight (kg),Status,Added Date\n';
    cylinders.forEach(c => {
        csv += `${c.glp_code},"${c.brand}",${c.weight},${c.status},"${new Date(c.timestamp).toLocaleString()}"\n`;
    });

    downloadFile(csv, 'lpg_inventory_export.csv', 'text/csv');
    showMessage('settingsMessage', true, 'CSV exported successfully!');
}

function clearAllData() {
    const result = db.clearAll();
    showMessage('settingsMessage', result.success, result.message);
    if (result.success) {
        updateDashboard();
        updateSettings();
        displayCylindersWithQR();
    }
}

// ==================== UTILITY FUNCTIONS ====================
function showMessage(elementId, isSuccess, message) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.textContent = message;
    element.className = 'message ' + (isSuccess ? 'message-success' : 'message-error');
    element.style.display = 'block';

    setTimeout(() => {
        element.style.display = 'none';
    }, 4000);
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function setupFormAutoComplete() {
    // Get recent brands for auto-complete
    const brandInput = document.getElementById('brand');
    const recentBrands = getRecentBrands();

    if (brandInput) {
        brandInput.addEventListener('input', function() {
            const value = this.value.toUpperCase();
            const suggestions = recentBrands.filter(b => b.includes(value));
            // Could enhance with a datalist or autocomplete UI
        });
    }
}

function getRecentBrands() {
    const brands = new Set();
    db.data.forEach(c => brands.add(c.brand));
    return Array.from(brands).sort();
}
