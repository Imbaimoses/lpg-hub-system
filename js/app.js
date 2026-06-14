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
    if (screenName === 'inventory') {
        displayInventory();
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

// ==================== INVENTORY ====================
function displayInventory() {
    const searchInput = document.getElementById('searchInput').value;
    const filterStatus = document.getElementById('filterStatus').value;

    let cylinders;

    if (searchInput) {
        cylinders = db.search(searchInput);
    } else {
        cylinders = db.getAll();
    }

    // Apply status filter
    if (filterStatus) {
        cylinders = cylinders.filter(c => c.status === filterStatus);
    }

    const inventoryList = document.getElementById('inventoryList');

    if (cylinders.length === 0) {
        inventoryList.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">No cylinders found</p>';
        return;
    }

    inventoryList.innerHTML = cylinders.map(cylinder => `
        <div class="inventory-item">
            <div class="inventory-item-header">
                <strong>${cylinder.glp_code}</strong>
                <span class="status-badge status-${cylinder.status.toLowerCase()}">${cylinder.status}</span>
            </div>
            <div class="inventory-item-details">
                <p><strong>Brand:</strong> ${cylinder.brand}</p>
                <p><strong>Weight:</strong> ${cylinder.weight} kg</p>
                <p><strong>Added:</strong> ${new Date(cylinder.timestamp).toLocaleString()}</p>
            </div>
            <button class="btn btn-sm btn-danger" onclick="removeFromInventoryUI('${cylinder.glp_code}')">Remove</button>
        </div>
    `).join('');
}

function handleSearch() {
    displayInventory();
}

function removeFromInventoryUI(glpCode) {
    if (confirm(`Remove cylinder ${glpCode}?`)) {
        const result = db.removeCylinder(glpCode);
        showMessage('inventoryMessage', result.success, result.message);
        if (result.success) {
            displayInventory();
            updateDashboard();
        }
    }
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
        displayInventory();
    }
}

// ==================== UTILITY FUNCTIONS ====================
function showMessage(elementId, isSuccess, message) {
    const element = document.getElementById(elementId);
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
