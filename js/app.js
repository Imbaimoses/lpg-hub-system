name=js/app.js
// ============================================
// UNIFIED LPG CYLINDER INVENTORY APP
// Single localStorage-based system
// ============================================

// ============================================
// DATA MANAGEMENT (localStorage)
// ============================================
class CylinderDB {
    constructor() {
        this.storageKey = 'lpg_cylinders';
        this.loadData();
    }

    loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            this.cylinders = data ? JSON.parse(data) : [];
        } catch (e) {
            this.cylinders = [];
        }
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.cylinders));
    }

    addCylinder(glpCode, brand, weight, status) {
        // Validate inputs
        if (!glpCode || !brand || !weight || !status) {
            throw new Error('All fields are required');
        }

        glpCode = glpCode.trim().toUpperCase();

        // Check for duplicates (only IN state)
        if (this.cylinders.find(c => c.glp === glpCode && c.state === 'IN')) {
            throw new Error(`Cylinder ${glpCode} already exists in inventory`);
        }

        // Validate weight
        weight = parseFloat(weight);
        if (isNaN(weight)) {
            throw new Error('Weight must be a valid number');
        }

        if (status === 'Full') {
            if (weight < 24.0 || weight > 25.0) {
                throw new Error('Full cylinder weight must be 24.0 - 25.0 kg');
            }
        } else if (status === 'Empty') {
            if (weight < 11.0 || weight > 25.0) {
                throw new Error('Empty cylinder weight must be 11.0 - 25.0 kg');
            }
        }

        // Create cylinder object
        const cylinder = {
            id: Date.now().toString(),
            glp: glpCode,
            brand,
            weight,
            status,
            state: 'IN',
            createdAt: new Date().toISOString(),
            outAt: null
        };

        this.cylinders.push(cylinder);
        this.save();
        return cylinder;
    }

    findByGlp(glpCode) {
        glpCode = glpCode.trim().toUpperCase();
        return this.cylinders.find(c => c.glp === glpCode && c.state === 'IN');
    }

    markAsOut(id) {
        const cylinder = this.cylinders.find(c => c.id === id);
        if (cylinder) {
            cylinder.state = 'OUT';
            cylinder.outAt = new Date().toISOString();
            this.save();
        }
        return cylinder;
    }

    getInStock() {
        return this.cylinders.filter(c => c.state === 'IN');
    }

    getFullCylinders() {
        return this.cylinders.filter(c => c.state === 'IN' && c.status === 'Full');
    }

    getEmptyCylinders() {
        return this.cylinders.filter(c => c.state === 'IN' && c.status === 'Empty');
    }

    getScannedOut() {
        return this.cylinders.filter(c => c.state === 'OUT');
    }
}

// ============================================
// INITIALIZE DATABASE
// ============================================
const db = new CylinderDB();
let currentCylinderOut = null;
let currentInventoryTab = 'all';

// ============================================
// SCREEN NAVIGATION
// ============================================
function switchScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show selected screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.screen === screenId) {
            btn.classList.add('active');
        }
    });

    // Screen-specific actions
    if (screenId === 'dashboard') {
        updateDashboard();
    } else if (screenId === 'inventory') {
        renderInventory('all');
    }
}

// ============================================
// DASHBOARD
// ============================================
function updateDashboard() {
    document.getElementById('dashTotal').textContent = db.getInStock().length;
    document.getElementById('dashFull').textContent = db.getFullCylinders().length;
    document.getElementById('dashEmpty').textContent = db.getEmptyCylinders().length;
    document.getElementById('dashOut').textContent = db.getScannedOut().length;
}

// ============================================
// SCAN IN
// ============================================
document.getElementById('scanInForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const glpCode = document.getElementById('inGlpCode').value;
    const brand = document.getElementById('inBrand').value;
    const weight = document.getElementById('inWeight').value;
    const status = document.getElementById('inStatus').value;

    const msgDiv = document.getElementById('inMessage');
    msgDiv.classList.remove('success', 'error');

    try {
        const cylinder = db.addCylinder(glpCode, brand, weight, status);

        // Show success
        msgDiv.className = 'message success';
        msgDiv.textContent = `✓ Cylinder ${cylinder.glp} registered successfully!`;

        // Generate QR code
        const canvas = document.getElementById('inQrCanvas');
        QRCode.toCanvas(canvas, cylinder.glp, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 200,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' }
        });
        document.getElementById('inQrText').textContent = `GLP Code: ${cylinder.glp}`;
        document.getElementById('inQrContainer').style.display = 'block';

        // Clear form
        this.reset();
        updateDashboard();

        setTimeout(() => {
            msgDiv.classList.remove('success');
        }, 5000);

    } catch (error) {
        msgDiv.className = 'message error';
        msgDiv.textContent = `✗ ${error.message}`;
        document.getElementById('inQrContainer').style.display = 'none';
    }
});

// ============================================
// SCAN OUT
// ============================================
document.getElementById('scanOutForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const glpCode = document.getElementById('outGlpCode').value;
    const msgDiv = document.getElementById('outMessage');
    const detailsDiv = document.getElementById('outDetails');

    msgDiv.classList.remove('success', 'error');
    detailsDiv.style.display = 'none';

    try {
        const cylinder = db.findByGlp(glpCode);

        if (!cylinder) {
            throw new Error(`Cylinder ${glpCode} not found in inventory`);
        }

        currentCylinderOut = cylinder;

        // Display details
        document.getElementById('outGlp').textContent = cylinder.glp;
        document.getElementById('outBrand').textContent = cylinder.brand;
        document.getElementById('outWeight').textContent = `${cylinder.weight} kg`;
        document.getElementById('outStatus').textContent = cylinder.status;

        // Status badge
        const statusBadge = document.getElementById('outStatusBadge');
        statusBadge.className = `detail-status status-${cylinder.status.toLowerCase()}`;
        statusBadge.textContent = cylinder.status;

        // Generate QR
        const canvas = document.getElementById('outQrCanvas');
        QRCode.toCanvas(canvas, cylinder.glp, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 150,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' }
        });

        detailsDiv.style.display = 'block';
        msgDiv.className = 'message success';
        msgDiv.textContent = '✓ Cylinder found. Click "Confirm Scan Out" to complete.';

    } catch (error) {
        msgDiv.className = 'message error';
        msgDiv.textContent = `✗ ${error.message}`;
    }
});

document.getElementById('confirmOutBtn').addEventListener('click', function() {
    if (!currentCylinderOut) return;

    try {
        db.markAsOut(currentCylinderOut.id);

        const msgDiv = document.getElementById('outMessage');
        msgDiv.className = 'message success';
        msgDiv.textContent = `✓ Cylinder ${currentCylinderOut.glp} scanned out successfully!`;

        document.getElementById('outDetails').style.display = 'none';
        document.getElementById('scanOutForm').reset();
        currentCylinderOut = null;

        updateDashboard();

        setTimeout(() => {
            msgDiv.classList.remove('success');
        }, 5000);

    } catch (error) {
        const msgDiv = document.getElementById('outMessage');
        msgDiv.className = 'message error';
        msgDiv.textContent = `✗ ${error.message}`;
    }
});

// ============================================
// INVENTORY WITH TABS
// ============================================
function renderInventory(tabType) {
    currentInventoryTab = tabType;
    let cylinders;

    if (tabType === 'all') {
        cylinders = db.getInStock();
    } else if (tabType === 'full') {
        cylinders = db.getFullCylinders();
    } else if (tabType === 'empty') {
        cylinders = db.getEmptyCylinders();
    }

    // Update active tab button
    document.querySelectorAll('.inventory-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.invTab === tabType) {
            btn.classList.add('active');
        }
    });

    const container = document.getElementById('inventoryContent');

    if (cylinders.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><p>No cylinders in this category</p></div>`;
        return;
    }

    const html = cylinders.map(c => `
        <div class="cylinder-card">
            <div class="card-header">
                <div class="glp-code">${c.glp}</div>
                <span class="status-badge status-${c.status.toLowerCase()}">${c.status}</span>
            </div>
            <div class="card-info">
                <div class="info-row">
                    <span class="info-label">Brand:</span>
                    <span>${c.brand}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Weight:</span>
                    <span>${c.weight} kg</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Created:</span>
                    <span>${new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="card-qr" id="qr-${c.id}"></div>
            <button class="card-button" onclick="quickScanOut('${c.id}')">Scan Out</button>
        </div>
    `).join('');

    container.innerHTML = html;

    // Generate QR codes
    cylinders.forEach(c => {
        const qrContainer = document.getElementById(`qr-${c.id}`);
        if (qrContainer && qrContainer.children.length === 0) {
            const canvas = document.createElement('canvas');
            QRCode.toCanvas(canvas, c.glp, {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                width: 160,
                margin: 1,
                color: { dark: '#000000', light: '#FFFFFF' }
            });
            qrContainer.appendChild(canvas);
        }
    });
}

function quickScanOut(cylinderId) {
    const cylinder = db.cylinders.find(c => c.id === cylinderId);
    if (cylinder) {
        document.getElementById('outGlpCode').value = cylinder.glp;
        switchScreen('scan-out');
        setTimeout(() => {
            document.getElementById('scanOutForm').dispatchEvent(new Event('submit'));
        }, 100);
    }
}

// ============================================
// INVENTORY TAB BUTTONS
// ============================================
document.querySelectorAll('.inventory-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        renderInventory(btn.dataset.invTab);
    });
});

// ============================================
// NAV BUTTONS
// ============================================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        switchScreen(btn.dataset.screen);
    });
});

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
});
