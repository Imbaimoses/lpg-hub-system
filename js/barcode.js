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

    addCylinder(glp_code, brand, weight, status) {
        const validation = this.validateCylinder(glp_code, brand, weight, status);
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }

        const normalizedCode = glp_code.trim().toUpperCase();

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
            this.data.pop();
            return saveResult;
        }

        return { success: true, message: "Cylinder added successfully", cylinder };
    }

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
            this.data[index].state = "IN";
            delete this.data[index].outTime;
            return saveResult;
        }

        return { success: true, message: "Cylinder scanned OUT", outTime: this.data[index].outTime };
    }

    getAll() {
        return this.data
            .filter(c => c.state === "IN")
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

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

    exportData() {
        const stats = this.getStats();
        return {
            exportDate: new Date().toISOString(),
            stats,
            records: this.data
        };
    }

    clearAll() {
        if (confirm("Are you sure? This will delete all records.")) {
            this.data = [];
            this.save();
            return { success: true, message: "All data cleared" };
        }
        return { success: false, message: "Operation cancelled" };
    }
}

const db = new Database();

// ================================
// BARCODE + QR CODE GENERATOR
// ================================
class BarcodeGenerator {
    static generateGLPCode() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = 'GLP';

        for (let i = 0; i < 9; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return code;
    }

    static generateQRCode(canvas, glpCode) {
        if (!canvas || !glpCode) return;

        QRCode.toCanvas(canvas, glpCode, {
            width: 120,
            margin: 1,
            color: {
                dark: "#000000",
                light: "#ffffff"
            }
        }, function (error) {
            if (error) {
                console.error("QR generation error:", error);
            }
        });
    }

    static downloadQRCode(glpCode) {
        const canvas = document.createElement("canvas");

        QRCode.toCanvas(canvas, glpCode, function (err) {
            if (err) return console.error(err);

            const link = document.createElement('a');
            link.href = canvas.toDataURL("image/png");
            link.download = `GLP_${glpCode}.png`;
            link.click();
        });
    }
}

// ================================
// UI & EVENT HANDLER LOGIC
// ================================

function switchScreenByName(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    document.getElementById(screenId).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-screen="${screenId}"]`).classList.add('active');

    if (screenId === 'dashboard') {
        updateDashboard();
    }

    if (screenId === 'inventory') {
        displayInventory();
    }

    if (screenId === 'settings') {
        updateSettingsInfo();
    }
}

function updateDashboard() {
    const stats = db.getStats();

    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statFull').textContent = stats.full;
    document.getElementById('statPartial').textContent = stats.partial;
    document.getElementById('statEmpty').textContent = stats.empty;
    document.getElementById('statOut').textContent = stats.out;
    document.getElementById('statWeight').textContent = stats.totalWeight;
}

function handleScanIn(event) {
    event.preventDefault();

    const glpCode = document.getElementById('glpCode').value.trim();
    const brand = document.getElementById('brand').value.trim();
    const weight = document.getElementById('weight').value;
    const status = document.getElementById('status').value;

    const result = db.addCylinder(glpCode, brand, weight, status);

    if (result.success) {
        showMessage('scanInMessage', result.message, 'success');
        event.target.reset();
        document.getElementById('glpCode').focus();
    } else {
        showMessage('scanInMessage', result.message, 'error');
    }
}

let currentCylinderToRemove = null;

function handleScanOut(event) {
    event.preventDefault();

    const glpCode = document.getElementById('scanOutCode').value.trim();

    if (!glpCode) {
        showMessage('scanOutMessage', 'Please enter a GLP code', 'error');
        return;
    }

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

function displayInventory() {
    const query = document.getElementById('searchInput')?.value.trim() || '';
    const filterStatus = document.getElementById('filterStatus')?.value || '';

    let cylinders = db.getAll();

    if (query) {
        cylinders = db.search(query);
    }

    if (filterStatus) {
        cylinders = cylinders.filter(c => c.status === filterStatus);
    }

    const container = document.getElementById('inventoryList');

    if (cylinders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">No cylinders found</p>';
        return;
    }

    const grouped = cylinders.reduce((acc, cylinder) => {
        if (!acc[cylinder.brand]) {
            acc[cylinder.brand] = [];
        }
        acc[cylinder.brand].push(cylinder);
        return acc;
    }, {});

    container.innerHTML = Object.entries(grouped).map(([brand, items]) => {
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
                        <div class="inventory-list" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                            ${statusItems.map(cylinder => createCylinderCard(cylinder)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');

    // Generate QR codes after cards are rendered
    cylinders.forEach(cylinder => {
        const canvasId = `qr_${cylinder.glp_code}`;
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            BarcodeGenerator.generateQRCode(canvas, cylinder.glp_code);
        }
    });
}

function createCylinderCard(cylinder) {
    const date = new Date(cylinder.timestamp).toLocaleDateString();
    const statusColor = {
        'Full': '#28a745',
        'Partial': '#ffc107',
        'Empty': '#e74c3c'
    }[cylinder.status] || '#999';

    const canvasId = `qr_${cylinder.glp_code}`;

    return `
        <div class="cylinder-card">
            <div class="cylinder-code">${cylinder.glp_code}</div>
            
            <!-- QR CODE -->
            <div style="text-align: center; margin: 1rem 0; padding: 0.5rem; background: #f9f9f9; border-radius: 4px;">
                <canvas id="${canvasId}" style="width: 120px; height: 120px;"></canvas>
            </div>
            
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
            <button class="btn" style="width: 100%; padding: 0.6rem; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 0.5rem; font-weight: 600;" onclick="BarcodeGenerator.downloadQRCode('${cylinder.glp_code}')">⬇️ Download QR</button>
        </div>
    `;
}

function quickScanOut(glpCode) {
    document.getElementById('scanOutCode').value = glpCode;
    switchScreenByName('scanOut');
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

function updateSettingsInfo() {
    const stats = db.getStats();
    const totalRecords = db.data.length;
    const outCount = db.data.filter(c => c.state === "OUT").length;

    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('inInventoryCount').textContent = stats.total;
    document.getElementById('outCount').textContent = outCount;

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

    const headers = ['GLP Code', 'Brand', 'Weight (kg)', 'Status', 'Added Date'];
    const rows = cylinders.map(c => [
        c.glp_code,
        c.brand,
        c.weight,
        c.status,
        new Date(c.timestamp).toLocaleString()
    ]);

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

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = message;
    element.className = `message show ${type}`;

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

document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    updateSettingsInfo();

    setInterval(() => {
        if (document.getElementById('dashboard').classList.contains('active')) {
            updateDashboard();
        }
    }, 5000);
});
