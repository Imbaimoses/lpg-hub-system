// ================================
// SIMPLE LPG DATABASE (PRODUCTION)
// ================================
class Database {
    constructor() {
        this.storageKey = "lpg_cylinders";
        this.maxStorageAttempts = 3;
        this.initializeData();
    }

    initializeData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            this.data = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("Failed to parse stored data:", error);
            this.data = [];
        }
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            return { success: true };
        } catch (error) {
            if (error.name === "QuotaExceededError") {
                console.error("Storage quota exceeded. Consider archiving old records.");
                return { success: false, message: "Storage quota exceeded" };
            }
            console.error("Failed to save data:", error);
            return { success: false, message: "Failed to save data" };
        }
    }

    // Validate required fields
    validateCylinder(glp_code, brand, weight, status) {
        if (!glp_code || typeof glp_code !== "string" || glp_code.trim() === "") {
            return { valid: false, message: "Invalid GLP code" };
        }
        if (!brand || typeof brand !== "string" || brand.trim() === "") {
            return { valid: false, message: "Invalid brand" };
        }
        if (!weight || isNaN(weight) || weight <= 0) {
            return { valid: false, message: "Invalid weight" };
        }
        if (!status || !["Full", "Empty", "Partial"].includes(status)) {
            return { valid: false, message: "Invalid status. Must be: Full, Empty, or Partial" };
        }
        return { valid: true };
    }

    // ADD CYLINDER (SCAN IN)
    addCylinder(glp_code, brand, weight, status) {
        // Validate input
        const validation = this.validateCylinder(glp_code, brand, weight, status);
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }

        // Normalize GLP code (trim & uppercase for consistency)
        const normalizedCode = glp_code.trim().toUpperCase();

        // Check for duplicates (case-insensitive)
        const exists = this.data.find(c => 
            c.glp_code.toUpperCase() === normalizedCode && c.state === "IN"
        );
        if (exists) {
            return { success: false, message: "Cylinder already exists in inventory" };
        }

        const cylinder = {
            glp_code: normalizedCode,
            brand: brand.trim(),
            weight: parseFloat(weight),
            status,
            state: "IN",
            timestamp: new Date().toISOString()
        };

        this.data.push(cylinder);
        const saveResult = this.save();
        
        if (!saveResult.success) {
            this.data.pop(); // Rollback
            return saveResult;
        }

        return { success: true, message: "Cylinder added successfully", cylinder };
    }

    // FIND CYLINDER (SCAN OUT SEARCH)
    findCylinder(glp_code) {
        if (!glp_code || typeof glp_code !== "string") {
            return { success: false, message: "Invalid GLP code" };
        }

        const normalizedCode = glp_code.trim().toUpperCase();
        const cylinder = this.data.find(c => 
            c.glp_code === normalizedCode && c.state === "IN"
        );

        if (!cylinder) {
            return { success: false, message: "Cylinder not found or already removed" };
        }

        return { success: true, cylinder };
    }

    // REMOVE CYLINDER (SCAN OUT CONFIRM)
    removeCylinder(glp_code) {
        if (!glp_code || typeof glp_code !== "string") {
            return { success: false, message: "Invalid GLP code" };
        }

        const normalizedCode = glp_code.trim().toUpperCase();
        const index = this.data.findIndex(c => 
            c.glp_code === normalizedCode && c.state === "IN"
        );

        if (index === -1) {
            return { success: false, message: "Cylinder not found or already removed" };
        }

        this.data[index].state = "OUT";
        this.data[index].outTime = new Date().toISOString();

        const saveResult = this.save();
        if (!saveResult.success) {
            // Rollback state change
            this.data[index].state = "IN";
            delete this.data[index].outTime;
            return saveResult;
        }

        return { success: true, message: "Cylinder scanned OUT", outTime: this.data[index].outTime };
    }

    // GET ALL IN INVENTORY
    getAll() {
        return this.data
            .filter(c => c.state === "IN")
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // GET STATS
    getStats() {
        const inInventory = this.data.filter(c => c.state === "IN");
        const outInventory = this.data.filter(c => c.state === "OUT");

        return {
            total: inInventory.length,
            full: inInventory.filter(c => c.status === "Full").length,
            partial: inInventory.filter(c => c.status === "Partial").length,
            empty: inInventory.filter(c => c.status === "Empty").length,
            out: outInventory.length,
            totalWeight: inInventory.reduce((sum, c) => sum + c.weight, 0).toFixed(2)
        };
    }

    // SEARCH (with validation)
    search(query) {
        if (!query || typeof query !== "string") {
            return [];
        }

        const normalizedQuery = query.trim().toUpperCase();
        return this.data.filter(c => 
            c.state === "IN" && (
                c.glp_code.includes(normalizedQuery) ||
                c.brand.toUpperCase().includes(normalizedQuery)
            )
        );
    }

    // ARCHIVE OLD OUT RECORDS
    archiveOldRecords(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const beforeCount = this.data.length;
        this.data = this.data.filter(c => {
            if (c.state === "OUT" && c.outTime) {
                return new Date(c.outTime) >= cutoffDate;
            }
            return true;
        });

        const archived = beforeCount - this.data.length;
        if (archived > 0) {
            this.save();
            return { success: true, message: `Archived ${archived} old records` };
        }

        return { success: true, message: "No old records to archive" };
    }

    // EXPORT DATA
    exportData() {
        const stats = this.getStats();
        return {
            exportDate: new Date().toISOString(),
            stats,
            records: this.data
        };
    }

    // CLEAR ALL DATA (use with caution)
    clearAll() {
        if (confirm("Are you sure? This will delete all records.")) {
            this.data = [];
            this.save();
            return { success: true, message: "All data cleared" };
        }
        return { success: false, message: "Operation cancelled" };
    }
}

// GLOBAL DB INSTANCE
const db = new Database();

// ================================
// UI & EVENT HANDLER LOGIC
// ================================

// ============== SCREEN NAVIGATION ==============
function switchScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show selected screen
    document.getElementById(screenId).classList.add('active');

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update dashboard stats when switching
    if (screenId === 'dashboard') {
        updateDashboard();
    }

    // Refresh inventory when viewing
    if (screenId === 'inventory') {
        displayInventory();
    }

    // Refresh settings when viewing
    if (screenId === 'settings') {
        updateSettingsInfo();
    }
}

// ============== DASHBOARD ==============
function updateDashboard() {
    const stats = db.getStats();

    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statFull').textContent = stats.full;
    document.getElementById('statPartial').textContent = stats.partial;
    document.getElementById('statEmpty').textContent = stats.empty;
    document.getElementById('statOut').textContent = stats.out;
    document.getElementById('statWeight').textContent = stats.totalWeight;
}

// ============== SCAN IN ==============
function handleScanIn(event) {
    event.preventDefault();

    const glpCode = document.getElementById('glpCode').value.trim();
    const brand = document.getElementById('brand').value.trim();
    const weight = document.getElementById('weight').value;
    const status = document.getElementById('status').value;

    // Add to database
    const result = db.addCylinder(glpCode, brand, weight, status);

    if (result.success) {
        showMessage('scanInMessage', result.message, 'success');
        event.target.reset();
        document.getElementById('glpCode').focus();
    } else {
        showMessage('scanInMessage', result.message, 'error');
    }
}

// ============== SCAN OUT ==============
let currentCylinderToRemove = null;

function handleScanOut(event) {
    event.preventDefault();

    const glpCode = document.getElementById('scanOutCode').value.trim();

    if (!glpCode) {
        showMessage('scanOutMessage', 'Please enter a GLP code', 'error');
        return;
    }

    // Find cylinder
    const result = db.findCylinder(glpCode);

    if (result.success) {
        currentCylinderToRemove = result.cylinder;
        displayCylinderDetails(result.cylinder);
        document.getElementById('cylinderDetails').classList.remove('hidden');
    } else {
        showMessage('scanOutMessage', result.message, 'error');
        document.getElementById('cylinderDetails').classList.add('hidden');
    }
}

function displayCylinderDetails(cylinder) {
    document.getElementById('detailCode').textContent = cylinder.glp_code;
    document.getElementById('detailBrand').textContent = cylinder.brand;
    document.getElementById('detailWeight').textContent = cylinder.weight + ' kg';
    document.getElementById('detailStatus').textContent = cylinder.status;
    document.getElementById('detailDate').textContent = new Date(cylinder.timestamp).toLocaleString();
}

function confirmScanOut() {
    if (!currentCylinderToRemove) return;

    const result = db.removeCylinder(currentCylinderToRemove.glp_code);

    if (result.success) {
        showMessage('scanOutMessage', result.message, 'success');
        cancelScanOut();
        document.getElementById('scanOutCode').value = '';
        document.getElementById('scanOutCode').focus();
    } else {
        showMessage('scanOutMessage', result.message, 'error');
    }
}

function cancelScanOut() {
    currentCylinderToRemove = null;
    document.getElementById('cylinderDetails').classList.add('hidden');
    document.getElementById('scanOutMessage').classList.remove('show');
}

// ============== INVENTORY ==============
function displayInventory() {
    const query = document.getElementById('searchInput')?.value.trim() || '';
    const filterStatus = document.getElementById('filterStatus')?.value || '';

    let cylinders = db.getAll();

    // Apply search filter
    if (query) {
        cylinders = db.search(query);
    }

    // Apply status filter
    if (filterStatus) {
        cylinders = cylinders.filter(c => c.status === filterStatus);
    }

    const container = document.getElementById('inventoryList');

    if (cylinders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">No cylinders found</p>';
        return;
    }

    // Group by brand
    const grouped = cylinders.reduce((acc, cylinder) => {
        if (!acc[cylinder.brand]) {
            acc[cylinder.brand] = [];
        }
        acc[cylinder.brand].push(cylinder);
        return acc;
    }, {});

    container.innerHTML = Object.entries(grouped).map(([brand, items]) => {
        // Group by status within brand
        const byStatus = items.reduce((acc, cylinder) => {
            if (!acc[cylinder.status]) {
                acc[cylinder.status] = [];
            }
            acc[cylinder.status].push(cylinder);
            return acc;
        }, {});

        return `
            <div style="grid-column: 1/-1;">
                <div class="brand-title">${brand}</div>
                ${Object.entries(byStatus).map(([status, statusItems]) => `
                    <div class="status-group">
                        <div class="status-label">${status} (${statusItems.length})</div>
                        <div class="inventory-list" style="grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));">
                            ${statusItems.map(cylinder => createCylinderCard(cylinder)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

function createCylinderCard(cylinder) {
    const date = new Date(cylinder.timestamp).toLocaleDateString();
    const statusColor = {
        'Full': '#28a745',
        'Partial': '#ffc107',
        'Empty': '#e74c3c'
    }[cylinder.status] || '#999';

    return `
        <div class="cylinder-card">
            <div class="cylinder-code">${cylinder.glp_code}</div>
            <div class="cylinder-info">
                <div class="info-item">
                    <span class="info-label">Brand:</span>
                    <span class="info-value">${cylinder.brand}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Weight:</span>
                    <span class="info-value">${cylinder.weight} kg</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Status:</span>
                    <span class="info-value" style="color: ${statusColor};">● ${cylinder.status}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Added:</span>
                    <span class="info-value">${date}</span>
                </div>
            </div>
            <button class="btn-scan-out" onclick="quickScanOut('${cylinder.glp_code}')">Scan Out</button>
        </div>
    `;
}

function quickScanOut(glpCode) {
    document.getElementById('scanOutCode').value = glpCode;
    switchScreen('scanOut');
    const result = db.findCylinder(glpCode);
    if (result.success) {
        currentCylinderToRemove = result.cylinder;
        displayCylinderDetails(result.cylinder);
        document.getElementById('cylinderDetails').classList.remove('hidden');
    }
}

function handleSearch() {
    displayInventory();
}

// ============== SETTINGS ==============
function updateSettingsInfo() {
    const stats = db.getStats();
    const totalRecords = db.data.length;
    const outCount = db.data.filter(c => c.state === "OUT").length;

    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('inInventoryCount').textContent = stats.total;
    document.getElementById('outCount').textContent = outCount;

    // Calculate storage used
    const storageSize = new Blob([JSON.stringify(db.data)]).size;
    const storageSizeKB = (storageSize / 1024).toFixed(2);
    document.getElementById('storageUsed').textContent = storageSizeKB + ' KB';
}

function archiveRecords() {
    const days = document.getElementById('archiveDays').value;
    const result = db.archiveOldRecords(parseInt(days));
    showMessage('settingsMessage', result.message, result.success ? 'success' : 'error');
    updateSettingsInfo();
}

function exportData() {
    const data = db.exportData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadFile(blob, `lpg_inventory_${new Date().toISOString().split('T')[0]}.json`);
    showMessage('settingsMessage', '✅ Data exported successfully!', 'success');
}

function downloadCSV() {
    const cylinders = db.getAll();

    if (cylinders.length === 0) {
        showMessage('settingsMessage', '⚠️ No data to export', 'error');
        return;
    }

    // CSV Headers
    const headers = ['GLP Code', 'Brand', 'Weight (kg)', 'Status', 'Added Date'];
    const rows = cylinders.map(c => [
        c.glp_code,
        c.brand,
        c.weight,
        c.status,
        new Date(c.timestamp).toLocaleString()
    ]);

    // Create CSV
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `lpg_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    showMessage('settingsMessage', '✅ CSV exported successfully!', 'success');
}

function clearAllData() {
    const confirmed = confirm(
        '⚠️ WARNING: This will permanently delete ALL records!\n\n' +
        'Are you absolutely sure? This cannot be undone.'
    );

    if (confirmed) {
        const result = db.clearAll();
        if (result.success) {
            showMessage('settingsMessage', result.message, 'success');
            updateSettingsInfo();
            updateDashboard();
        } else {
            showMessage('settingsMessage', result.message, 'error');
        }
    }
}

// ============== UTILITY FUNCTIONS ==============
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = message;
    element.className = `message show ${type}`;

    // Auto-hide after 5 seconds (unless error)
    if (type !== 'error') {
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============== INITIALIZE ==============
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    updateSettingsInfo();

    // Auto-update stats periodically (every 5 seconds)
    setInterval(() => {
        if (document.getElementById('dashboard').classList.contains('active')) {
            updateDashboard();
        }
    }, 5000);
});
